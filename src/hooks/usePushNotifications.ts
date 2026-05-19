import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData.split('').map((c) => c.charCodeAt(0)));
}

export type PushStatus = 'unsupported' | 'denied' | 'granted' | 'prompt' | 'subscribing';

export function usePushNotifications() {
  const { user } = useAuth();
  const [status, setStatus] = useState<PushStatus>('prompt');
  const [subscription, setSubscription] = useState<PushSubscriptionJSON | null>(null);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }
    if (Notification.permission === 'denied') setStatus('denied');
    else if (Notification.permission === 'granted') setStatus('granted');
  }, []);

  const subscribe = useCallback(async () => {
    if (!PUBLIC_VAPID_KEY) {
      console.warn('VITE_VAPID_PUBLIC_KEY not set');
      return;
    }
    setStatus('subscribing');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      });
      const subJson = sub.toJSON();
      await supabase.from('push_subscriptions').upsert({
        endpoint: subJson.endpoint,
        keys: subJson.keys,
        user_agent: navigator.userAgent,
        user_id: user?.id,
      });
      setSubscription(subJson);
      setStatus('granted');
    } catch {
      setStatus('prompt');
    }
  }, [user]);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        const endpoint = sub.toJSON().endpoint;
        if (endpoint) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
        }
      }
      setSubscription(null);
      setStatus('prompt');
    } catch {
      // ignore
    }
  }, []);

  return { status, subscription, subscribe, unsubscribe };
}
