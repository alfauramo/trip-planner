import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface TripActivity {
  id: string;
  trip_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: Record<string, any> | null;
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
        .select(`
          *,
          profile:user_id (full_name, alias, avatar_url)
        `)
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
      action, entityType, entityId, entityName, details,
    }: {
      action: string;
      entityType: string;
      entityId?: string;
      entityName?: string;
      details?: Record<string, any>;
    }) => {
      if (!user || !tripId) return;

      const { error } = await supabase.from('trip_activities').insert([{
        trip_id: tripId,
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        details,
      }]);

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
      details?: Record<string, any>
    ) => {
      await logActivityMutation.mutateAsync({ action, entityType, entityId, entityName, details });
    },
    refresh: async () => { await query.refetch(); },
  };
}

const actionLabels: Record<string, string> = {
  created: 'creó',
  updated: 'actualizó',
  deleted: 'eliminó',
  added: 'añadió',
  completed: 'completó',
  invited: 'invitó',
  joined: 'se unió a',
  left: 'abandonó',
};

const entityLabels: Record<string, string> = {
  trip: 'el viaje',
  day: 'un día',
  event: 'el evento',
  member: 'un miembro',
  expense: 'el gasto',
  checklist: 'la checklist',
  packing: 'el objeto de equipaje',
  comment: 'un comentario',
};

export function formatActivity(activity: TripActivity): string {
  const userName = activity.profile?.alias || activity.profile?.full_name || 'Alguien';
  const action = actionLabels[activity.action] || activity.action;
  const entity = entityLabels[activity.entity_type] || activity.entity_type;
  const name = activity.entity_name ? ` "${activity.entity_name}"` : '';

  return `${userName} ${action} ${entity}${name}`;
}
