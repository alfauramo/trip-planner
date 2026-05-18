import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Trip } from '../types';
import { useAuth } from '../context/AuthContext';

export function useTrips() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['trips', user?.id],
    queryFn: async () => {
      const { data: ownedTrips, error: ownedError } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user!.id);

      if (ownedError) throw ownedError;

      const { data: memberTrips, error: memberError } = await supabase
        .from('trip_members')
        .select('trip_id')
        .eq('user_id', user!.id)
        .eq('status', 'accepted');

      if (memberError) throw memberError;

      let sharedTrips: Trip[] = [];
      if (memberTrips && memberTrips.length > 0) {
        const tripIds = memberTrips.map(m => m.trip_id);
        const { data: tripsData, error: tripsError } = await supabase
          .from('trips')
          .select('*')
          .in('id', tripIds);

        if (tripsError) throw tripsError;
        sharedTrips = tripsData || [];
      }

      const allTrips = [...(ownedTrips || []), ...sharedTrips];
      return allTrips
        .filter((trip, index, self) => index === self.findIndex(t => t.id === trip.id))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (trip: Partial<Trip>) => {
      const { data, error } = await supabase
        .from('trips')
        .insert([{ ...trip, user_id: user!.id }])
        .select()
        .single();

      if (error) throw error;

      const { error: memberError } = await supabase
        .from('trip_members')
        .insert([{ trip_id: data.id, user_id: user!.id, email: user!.email, role: 'owner', status: 'accepted' }]);

      if (memberError) throw memberError;

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Trip> }) => {
      const { error } = await supabase.from('trips').update(updates).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['trips'] });
      const previousTrips = queryClient.getQueryData<Trip[]>(['trips', user?.id]);
      if (previousTrips) {
        queryClient.setQueryData<Trip[]>(['trips', user?.id], (old) =>
          old?.map(t => (t.id === id ? { ...t, ...updates } : t))
        );
      }
      return { previousTrips };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTrips) {
        queryClient.setQueryData(['trips', user?.id], context.previousTrips);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('trips').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['trips'] });
      const previousTrips = queryClient.getQueryData<Trip[]>(['trips', user?.id]);
      if (previousTrips) {
        queryClient.setQueryData<Trip[]>(['trips', user?.id], (old) =>
          old?.filter(t => t.id !== id)
        );
      }
      return { previousTrips };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTrips) {
        queryClient.setQueryData(['trips', user?.id], context.previousTrips);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });

  return {
    trips: query.data || [],
    loading: query.isLoading,
    error: query.error?.message || null,
    fetchTrips: async () => { await query.refetch(); },
    createTrip: async (trip: Partial<Trip>) => {
      if (!user) return null;
      return createMutation.mutateAsync(trip);
    },
    updateTrip: async (id: string, updates: Partial<Trip>) => {
      await updateMutation.mutateAsync({ id, updates });
    },
    deleteTrip: async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
  };
}
