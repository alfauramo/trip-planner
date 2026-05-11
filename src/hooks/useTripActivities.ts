import { useState, useEffect, useCallback } from 'react';
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
  const [activities, setActivities] = useState<TripActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!tripId) return;

    setLoading(true);
    const { data } = await supabase
      .from('trip_activities')
      .select(`
        *,
        profile:user_id (full_name, alias, avatar_url)
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(50);

    setActivities(data || []);
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const logActivity = async (
    action: string,
    entityType: string,
    entityId?: string,
    entityName?: string,
    details?: Record<string, any>
  ) => {
    if (!user || !tripId) return;

    await supabase.from('trip_activities').insert([
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

    fetchActivities();
  };

  return {
    activities,
    loading,
    logActivity,
    refresh: fetchActivities,
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
