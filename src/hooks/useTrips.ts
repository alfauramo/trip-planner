import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Trip } from '../types';
import { useAuth } from '../context/AuthContext';

export function useTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchTrips = async (force = false) => {
    if (!user) return;
    if (!force && hasFetched.current && trips.length > 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: ownedTrips, error: ownedError } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id);

      if (ownedError) throw ownedError;

      const { data: memberTrips, error: memberError } = await supabase
        .from('trip_members')
        .select('trip_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (memberError) throw memberError;

      let sharedTrips: Trip[] = [];
      if (memberTrips && memberTrips.length > 0) {
        const tripIds = memberTrips.map(m => m.trip_id);
        const { data: tripsData } = await supabase
          .from('trips')
          .select('*')
          .in('id', tripIds);
        sharedTrips = tripsData || [];
      }

      const allTrips = [...(ownedTrips || []), ...sharedTrips];
      const uniqueTrips = allTrips.filter((trip, index, self) => 
        index === self.findIndex(t => t.id === trip.id)
      );

      uniqueTrips.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setTrips(uniqueTrips);
      hasFetched.current = true;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTrip = async (trip: Partial<Trip>) => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('trips')
      .insert([{ ...trip, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    
    await supabase
      .from('trip_members')
      .insert([{
        trip_id: data.id,
        user_id: user.id,
        email: user.email,
        role: 'owner',
        status: 'accepted'
      }]);
    
    await fetchTrips(true);
    
    return data;
  };

  const updateTrip = async (id: string, updates: Partial<Trip>) => {
    const { error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTrip = async (id: string) => {
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (error) throw error;
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    hasFetched.current = false;
    fetchTrips();
  }, [user?.id]);

  return { trips, loading, error, fetchTrips: () => fetchTrips(true), createTrip, updateTrip, deleteTrip };
}
