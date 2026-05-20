import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface PresenceUser {
  user_id: string;
  email: string;
  online_at: string;
}

export function useTripPresence(tripId: string | undefined) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!tripId || !user) return;

    const channel = supabase.channel(`presence-${tripId}-${Date.now()}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users: PresenceUser[] = [];
        for (const [, presences] of Object.entries(state)) {
          const presence = presences[0] as PresenceUser | undefined;
          if (presence && presence.user_id !== user.id) {
            users.push(presence);
          }
        }
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            email: user.email || '',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, user]);

  return { onlineUsers };
}
