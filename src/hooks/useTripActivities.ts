import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import i18n from '../lib/i18n';

export interface TripActivity {
  id: string;
  trip_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  profile?: {
    full_name?: string;
    alias?: string;
    avatar_url?: string;
  };
}

export function useTripActivities(tripId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['trip-activities', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_activities')
        .select(
          `
          *,
          profile:user_id (full_name, alias, avatar_url)
        `,
        )
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tripId,
  });

  const logActivityMutation = useMutation({
    mutationFn: async ({
      action,
      entityType,
      entityId,
      entityName,
      details,
    }: {
      action: string;
      entityType: string;
      entityId?: string;
      entityName?: string;
      details?: Record<string, unknown>;
    }) => {
      if (!user || !tripId) return;

      const { error } = await supabase.from('trip_activities').insert([
        {
          trip_id: tripId,
          user_id: user.id,
          action,
          entity_type: entityType,
          entity_id: entityId,
          entity_name: entityName,
          details,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip-activities', tripId] }),
  });

  return {
    activities: query.data || [],
    loading: query.isLoading,
    logActivity: async (
      action: string,
      entityType: string,
      entityId?: string,
      entityName?: string,
      details?: Record<string, unknown>,
    ) => {
      await logActivityMutation.mutateAsync({ action, entityType, entityId, entityName, details });
    },
    refresh: async () => {
      await query.refetch();
    },
  };
}

const actionLabels: Record<string, string> = {
  created: i18n.t('activity.action.created'),
  updated: i18n.t('activity.action.updated'),
  deleted: i18n.t('activity.action.deleted'),
  added: i18n.t('activity.action.added'),
  completed: i18n.t('activity.action.completed'),
  invited: i18n.t('activity.action.invited'),
  joined: i18n.t('activity.action.joined'),
  left: i18n.t('activity.action.left'),
};

const entityLabels: Record<string, string> = {
  trip: i18n.t('activity.entity.trip'),
  day: i18n.t('activity.entity.day'),
  event: i18n.t('activity.entity.event'),
  member: i18n.t('activity.entity.member'),
  expense: i18n.t('activity.entity.expense'),
  checklist: i18n.t('activity.entity.checklist'),
  packing: i18n.t('activity.entity.packing'),
  comment: i18n.t('activity.entity.comment'),
};

export function formatActivity(activity: TripActivity): string {
  const userName = activity.profile?.alias || activity.profile?.full_name || i18n.t('activity.someone');
  const action = actionLabels[activity.action] || activity.action;
  const entity = entityLabels[activity.entity_type] || activity.entity_type;
  const name = activity.entity_name ? ` "${activity.entity_name}"` : '';

  return `${userName} ${action} ${entity}${name}`;
}
