import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Trip, Day, TripEvent, TripMember } from '../types';
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

export function useTripDetail(tripId: string) {
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<(Day & { events: TripEvent[] })[]>([]);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTripWithDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;
      setTrip(tripData);

      const { data: daysData, error: daysError } = await supabase
        .from('days')
        .select('*')
        .eq('trip_id', tripId)
        .order('date');

      if (daysError) throw daysError;

      const sortedDaysData = (daysData || []).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const daysWithEvents = await Promise.all(
        sortedDaysData.map(async (day) => {
          const { data: eventsData } = await supabase
            .from('events')
            .select('*')
            .eq('day_id', day.id)
            .order('order');
          
          const eventIds = (eventsData || []).map(e => e.id);
          let attachmentsByEvent: Record<string, any[]> = {};
          
          if (eventIds.length > 0) {
            const { data: attachmentsData } = await supabase
              .from('attachments')
              .select('*')
              .in('event_id', eventIds);
            
            if (attachmentsData) {
              attachmentsData.forEach(att => {
                if (!attachmentsByEvent[att.event_id]) {
                  attachmentsByEvent[att.event_id] = [];
                }
                attachmentsByEvent[att.event_id].push(att);
              });
            }
          }
          
          const eventsWithAttachments = (eventsData || []).map(event => ({
            ...event,
            attachments: attachmentsByEvent[event.id] || []
          }));
          
          return { ...day, events: eventsWithAttachments };
        })
      );

      setDays(daysWithEvents);

      const { data: membersData, error: membersError } = await supabase
        .from('trip_members')
        .select('*')
        .eq('trip_id', tripId)
        .eq('status', 'accepted');

      if (membersError) {
        console.error('Error fetching members:', membersError);
      }

      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id).filter(Boolean);
        let profilesMap: Record<string, any> = {};
        
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, alias, avatar_url')
            .in('id', userIds);
          
          if (profilesData) {
            profilesData.forEach(p => {
              profilesMap[p.id] = p;
            });
          }
        }
        
        const membersWithProfiles = membersData.map(m => ({
          ...m,
          profile: m.user_id ? profilesMap[m.user_id] : null
        }));
        
        setMembers(membersWithProfiles);
      } else {
        setMembers([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inviteMember = async (email: string, role: 'viewer' | 'editor') => {
    if (!user) return;

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      await supabase
        .from('trip_members')
        .insert([{
          trip_id: tripId,
          user_id: existingUser.id,
          email,
          role,
          status: 'accepted'
        }]);
    } else {
      const token = Math.random().toString(36).substring(2);
      await supabase
        .from('trip_invitations')
        .insert([{
          trip_id: tripId,
          email,
          role,
          invited_by: user.id,
          token
        }]);
    }

    await fetchTripWithDetails();
  };

  const removeMember = async (memberId: string) => {
    await supabase.from('trip_members').delete().eq('id', memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const updateMemberRole = async (memberId: string, role: 'viewer' | 'editor') => {
    await supabase
      .from('trip_members')
      .update({ role })
      .eq('id', memberId);

    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role } : m))
    );
  };

  const addDay = async (date: string, notes?: string) => {
    const newDate = new Date(date);
    
    let calculatedDayNumber = 1;
    const sortedDays = [...days].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    for (const day of sortedDays) {
      const existingDate = new Date(day.date);
      if (newDate > existingDate) {
        calculatedDayNumber = day.day_number + 1;
      } else {
        break;
      }
    }

    const { data, error } = await supabase
      .from('days')
      .insert([{ trip_id: tripId, date, day_number: calculatedDayNumber, notes: notes || undefined }])
      .select()
      .single();

    if (error) throw error;
    
    const newDays = [...days, { ...data, events: [] }].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setDays(newDays);
    
    await recalculateDayNumbers();
    
    return data;
  };

  const updateDay = async (dayId: string, updates: { date?: string; notes?: string }) => {
    const { error } = await supabase
      .from('days')
      .update(updates)
      .eq('id', dayId);

    if (error) throw error;
    setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, ...updates } : d)));
  };

  const recalculateDayNumbers = async () => {
    const sortedDays = [...days].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    for (let i = 0; i < sortedDays.length; i++) {
      const expectedDayNumber = i + 1;
      if (sortedDays[i].day_number !== expectedDayNumber) {
        await supabase
          .from('days')
          .update({ day_number: expectedDayNumber })
          .eq('id', sortedDays[i].id);
      }
    }
    
    await fetchTripWithDetails();
  };

  const addEvent = async (dayId: string, eventData: Partial<TripEvent>) => {
    const { data: existingEvents } = await supabase
      .from('events')
      .select('order')
      .eq('day_id', dayId)
      .order('order', { ascending: false })
      .limit(1);

    const nextOrder = existingEvents?.[0]?.order + 1 || 1;

    const { data, error } = await supabase
      .from('events')
      .insert([{ ...eventData, day_id: dayId, order: nextOrder }])
      .select()
      .single();

    if (error) throw error;
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, events: [...d.events, data] } : d
      )
    );
    return data;
  };

  const updateEvent = async (eventId: string, updates: Partial<TripEvent>) => {
    const { error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId);

    if (error) throw error;
    setDays((prev) =>
      prev.map((d) => ({
        ...d,
        events: d.events.map((e) => (e.id === eventId ? { ...e, ...updates } : e)),
      }))
    );
  };

  const reorderEvents = async (dayId: string, eventIds: string[]) => {
    // Update local state immediately
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;
        const reorderedEvents = eventIds
          .map((id, index) => {
            const event = d.events.find((e) => e.id === id);
            return event ? { ...event, order: index + 1 } : null;
          })
          .filter(Boolean) as TripEvent[];
        return { ...d, events: reorderedEvents };
      })
    );

    // Update database in background
    for (let i = 0; i < eventIds.length; i++) {
      await supabase
        .from('events')
        .update({ order: i + 1 })
        .eq('id', eventIds[i]);
    }
  };

  const deleteEvent = async (eventId: string, dayId: string) => {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) throw error;
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, events: d.events.filter((e) => e.id !== eventId) } : d))
    );
  };

  const deleteDay = async (dayId: string) => {
    await supabase.from('events').delete().eq('day_id', dayId);
    const { error } = await supabase.from('days').delete().eq('id', dayId);
    if (error) throw error;
    setDays((prev) => prev.filter((d) => d.id !== dayId));
  };

  useEffect(() => {
    if (tripId) {
      fetchTripWithDetails();
    }
  }, [tripId]);

  return {
    trip,
    days,
    members,
    loading,
    error,
    refresh: fetchTripWithDetails,
    addDay,
    updateDay,
    addEvent,
    updateEvent,
    reorderEvents,
    deleteEvent,
    deleteDay,
    inviteMember,
    removeMember,
    updateMemberRole,
  };
}
