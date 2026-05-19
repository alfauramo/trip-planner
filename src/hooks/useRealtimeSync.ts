import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useRealtimeSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`db-changes-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
        queryClient.invalidateQueries({ queryKey: ['trips'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members' }, () => {
        queryClient.invalidateQueries({ queryKey: ['trips'] });
        queryClient.invalidateQueries({ queryKey: ['trip-detail'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'days' }, (p) => {
        const rec = (p.new || p.old) as Record<string, unknown> | null;
        queryClient.invalidateQueries({ queryKey: ['trip-detail', rec?.trip_id as string | undefined] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        queryClient.invalidateQueries({ queryKey: ['trip-detail'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'packing_items' }, () => {
        queryClient.invalidateQueries({ queryKey: ['packing-list'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_activities' }, () => {
        queryClient.invalidateQueries({ queryKey: ['trip-activities'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
}
