import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Trip, Day, TripEvent, TripMember } from '../types';
import { useAuth } from '../context/AuthContext';

interface TripDetailData {
  trip: Trip | null;
  days: (Day & { events: TripEvent[] })[];
  members: TripMember[];
}

export function useTripDetail(tripId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['trip-detail', tripId] as const;

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<TripDetailData> => {
      const { data: tripData, error: tripError } = await supabase.from('trips').select('*').eq('id', tripId).single();

      if (tripError) throw tripError;

      const { data: daysData, error: daysError } = await supabase
        .from('days')
        .select('*')
        .eq('trip_id', tripId)
        .order('date');

      if (daysError) throw daysError;

      const sortedDaysData = (daysData || []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const daysWithEvents = await Promise.all(
        sortedDaysData.map(async (day) => {
          const { data: eventsData, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .eq('day_id', day.id)
            .order('order');

          if (eventsError) throw eventsError;

          const eventIds = (eventsData || []).map((e) => e.id);
          const attachmentsByEvent: Record<string, any[]> = {};

          if (eventIds.length > 0) {
            const { data: attachmentsData } = await supabase.from('attachments').select('*').in('event_id', eventIds);

            if (attachmentsData) {
              attachmentsData.forEach((att) => {
                if (!attachmentsByEvent[att.event_id]) {
                  attachmentsByEvent[att.event_id] = [];
                }
                attachmentsByEvent[att.event_id].push(att);
              });
            }
          }

          const eventsWithAttachments = (eventsData || []).map((event) => ({
            ...event,
            attachments: attachmentsByEvent[event.id] || [],
          }));

          return { ...day, events: eventsWithAttachments };
        }),
      );

      const { data: membersData, error: membersError } = await supabase
        .from('trip_members')
        .select('*')
        .eq('trip_id', tripId)
        .eq('status', 'accepted');

      if (membersError) {
        console.error('Error fetching members:', membersError);
      }

      let membersWithProfiles: TripMember[] = [];
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map((m) => m.user_id).filter(Boolean);
        const profilesMap: Record<string, any> = {};

        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, alias, avatar_url')
            .in('id', userIds);

          if (profilesData) {
            profilesData.forEach((p) => {
              profilesMap[p.id] = p;
            });
          }
        }

        membersWithProfiles = membersData.map((m) => ({
          ...m,
          profile: m.user_id ? profilesMap[m.user_id] : null,
        }));
      }

      return {
        trip: tripData,
        days: daysWithEvents,
        members: membersWithProfiles,
      };
    },
    enabled: !!tripId,
  });

  const trip = query.data?.trip ?? null;
  const days = query.data?.days ?? [];
  const members = query.data?.members ?? [];
  const loading = query.isLoading;
  const error = query.error?.message ?? null;

  const addDayMutation = useMutation({
    mutationFn: async ({ date, notes }: { date: string; notes?: string }) => {
      const existingData = queryClient.getQueryData<TripDetailData>(queryKey);
      const existingDays = existingData?.days || [];

      const newDate = new Date(date);
      let calculatedDayNumber = 1;
      const sortedDays = [...existingDays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

      const allDays = [...existingDays, { ...data, events: [] }].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      for (let i = 0; i < allDays.length; i++) {
        const expectedDayNumber = i + 1;
        if (allDays[i].day_number !== expectedDayNumber) {
          await supabase.from('days').update({ day_number: expectedDayNumber }).eq('id', allDays[i].id);
        }
      }

      return data;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateDayMutation = useMutation({
    mutationFn: async ({ dayId, updates }: { dayId: string; updates: { date?: string; notes?: string } }) => {
      const { error } = await supabase.from('days').update(updates).eq('id', dayId);
      if (error) throw error;
    },
    onMutate: async ({ dayId, updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<TripDetailData>(queryKey);
      if (previousData) {
        queryClient.setQueryData<TripDetailData>(queryKey, {
          ...previousData,
          days: previousData.days.map((d) => (d.id === dayId ? { ...d, ...updates } : d)),
        });
      }
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const addEventMutation = useMutation({
    mutationFn: async ({ dayId, eventData }: { dayId: string; eventData: Partial<TripEvent> }) => {
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
      return data;
    },
    onMutate: async ({ dayId, eventData }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<TripDetailData>(queryKey);
      if (previousData) {
        queryClient.setQueryData<TripDetailData>(queryKey, {
          ...previousData,
          days: previousData.days.map((d) =>
            d.id === dayId
              ? {
                  ...d,
                  events: [
                    ...d.events,
                    {
                      ...eventData,
                      id: 'temp-' + Date.now(),
                      day_id: dayId,
                      order: (d.events.length || 0) + 1,
                    } as TripEvent,
                  ],
                }
              : d,
          ),
        });
      }
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, updates }: { eventId: string; updates: Partial<TripEvent> }) => {
      const { error } = await supabase.from('events').update(updates).eq('id', eventId);
      if (error) throw error;
    },
    onMutate: async ({ eventId, updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<TripDetailData>(queryKey);
      if (previousData) {
        queryClient.setQueryData<TripDetailData>(queryKey, {
          ...previousData,
          days: previousData.days.map((d) => ({
            ...d,
            events: d.events.map((e) => (e.id === eventId ? { ...e, ...updates } : e)),
          })),
        });
      }
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const reorderEventsMutation = useMutation({
    mutationFn: async ({ dayId: _dayId, eventIds }: { dayId: string; eventIds: string[] }) => {
      for (let i = 0; i < eventIds.length; i++) {
        const { error } = await supabase
          .from('events')
          .update({ order: i + 1 })
          .eq('id', eventIds[i]);

        if (error) throw error;
      }
    },
    onMutate: async ({ dayId, eventIds }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<TripDetailData>(queryKey);
      if (previousData) {
        queryClient.setQueryData<TripDetailData>(queryKey, {
          ...previousData,
          days: previousData.days.map((d) => {
            if (d.id !== dayId) return d;
            const reorderedEvents = eventIds
              .map((id, index) => {
                const event = d.events.find((e) => e.id === id);
                return event ? { ...event, order: index + 1 } : null;
              })
              .filter(Boolean) as TripEvent[];
            return { ...d, events: reorderedEvents };
          }),
        });
      }
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteEventMutation = useMutation({
    mutationFn: async ({ eventId, dayId: _dayId }: { eventId: string; dayId: string }) => {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
    },
    onMutate: async ({ eventId, dayId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<TripDetailData>(queryKey);
      if (previousData) {
        queryClient.setQueryData<TripDetailData>(queryKey, {
          ...previousData,
          days: previousData.days.map((d) =>
            d.id === dayId ? { ...d, events: d.events.filter((e) => e.id !== eventId) } : d,
          ),
        });
      }
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteDayMutation = useMutation({
    mutationFn: async (dayId: string) => {
      await supabase.from('events').delete().eq('day_id', dayId);
      const { error } = await supabase.from('days').delete().eq('id', dayId);
      if (error) throw error;
    },
    onMutate: async (dayId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<TripDetailData>(queryKey);
      if (previousData) {
        queryClient.setQueryData<TripDetailData>(queryKey, {
          ...previousData,
          days: previousData.days.filter((d) => d.id !== dayId),
        });
      }
      return { previousData };
    },
    onError: (_err, _dayId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: 'viewer' | 'editor' }) => {
      if (!user) return;

      const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', email).single();

      if (existingUser) {
        const { error } = await supabase
          .from('trip_members')
          .insert([{ trip_id: tripId, user_id: existingUser.id, email, role, status: 'accepted' }]);

        if (error) throw error;
      } else {
        const token = Math.random().toString(36).substring(2);
        const { error } = await supabase
          .from('trip_invitations')
          .insert([{ trip_id: tripId, email, role, invited_by: user.id, token }]);

        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from('trip_members').delete().eq('id', memberId);
      if (error) throw error;
    },
    onMutate: async (memberId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<TripDetailData>(queryKey);
      if (previousData) {
        queryClient.setQueryData<TripDetailData>(queryKey, {
          ...previousData,
          members: previousData.members.filter((m) => m.id !== memberId),
        });
      }
      return { previousData };
    },
    onError: (_err, _memberId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: 'viewer' | 'editor' }) => {
      const { error } = await supabase.from('trip_members').update({ role }).eq('id', memberId);

      if (error) throw error;
    },
    onMutate: async ({ memberId, role }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<TripDetailData>(queryKey);
      if (previousData) {
        queryClient.setQueryData<TripDetailData>(queryKey, {
          ...previousData,
          members: previousData.members.map((m) => (m.id === memberId ? { ...m, role } : m)),
        });
      }
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    trip,
    days,
    members,
    loading,
    error,
    refresh: () => query.refetch(),
    addDay: async (date: string, notes?: string) => addDayMutation.mutateAsync({ date, notes }),
    updateDay: async (dayId: string, updates: { date?: string; notes?: string }) => {
      await updateDayMutation.mutateAsync({ dayId, updates });
    },
    addEvent: async (dayId: string, eventData: Partial<TripEvent>) =>
      addEventMutation.mutateAsync({ dayId, eventData }),
    updateEvent: async (eventId: string, updates: Partial<TripEvent>) => {
      await updateEventMutation.mutateAsync({ eventId, updates });
    },
    reorderEvents: async (dayId: string, eventIds: string[]) => {
      await reorderEventsMutation.mutateAsync({ dayId, eventIds });
    },
    deleteEvent: async (eventId: string, dayId: string) => {
      await deleteEventMutation.mutateAsync({ eventId, dayId });
    },
    deleteDay: async (dayId: string) => {
      await deleteDayMutation.mutateAsync(dayId);
    },
    inviteMember: async (email: string, role: 'viewer' | 'editor') => {
      await inviteMemberMutation.mutateAsync({ email, role });
    },
    removeMember: async (memberId: string) => {
      await removeMemberMutation.mutateAsync(memberId);
    },
    updateMemberRole: async (memberId: string, role: 'viewer' | 'editor') => {
      await updateMemberRoleMutation.mutateAsync({ memberId, role });
    },
  };
}
