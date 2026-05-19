import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  trip_id?: string;
  read: boolean;
  created_at: string;
}

export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: ['notifications', userId] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const notifications = query.data || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', userId] });
      const previous = queryClient.getQueryData<Notification[]>(['notifications', userId]);
      if (previous) {
        queryClient.setQueryData<Notification[]>(['notifications', userId], (old) =>
          old?.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications', userId], context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notifications', userId] }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', userId] });
      const previous = queryClient.getQueryData<Notification[]>(['notifications', userId]);
      if (previous) {
        queryClient.setQueryData<Notification[]>(['notifications', userId], (old) =>
          old?.map((n) => ({ ...n, read: true })),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications', userId], context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notifications', userId] }),
  });

  return {
    notifications,
    unreadCount,
    loading: query.isLoading,
    markAsRead: async (id: string) => {
      await markAsReadMutation.mutateAsync(id);
    },
    markAllAsRead: async () => {
      await markAllAsReadMutation.mutateAsync();
    },
  };
}
