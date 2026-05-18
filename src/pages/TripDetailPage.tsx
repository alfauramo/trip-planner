import { useState, useEffect } from 'react';
import { useConfirm } from '../components/ConfirmModal';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Receipt, Plus, Download, TrendingUp, ArrowRight,
  CheckSquare, Check, Trash2, Euro
} from 'lucide-react';
import { useTripDetail } from '../hooks/useTripDetail';
import { useTrips } from '../hooks/useTrips';
import { CoverSelector } from '../components/CoverSelector';
import { TripMembersManager } from '../components/TripMembersManager';
import { useToast } from '../components/Toast';
import { LoadingOverlay, DetailSkeleton } from '../components/Loading';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TripEvent, EXPENSE_CATEGORIES, ExpenseCategory } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Footer } from '../components/Footer';
import { TripMap } from '../components/TripMap';
import { PackingList } from '../components/PackingList';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { BottomSheet } from '../components/BottomSheet';
import { useIsMobile } from '../hooks/useMediaQuery';
import { TripDetailHeader } from '../components/TripDetailHeader';
import {
  TripItinerary, AddDayForm, EditDayForm, AddEventForm,
  EditEventContent, EventDetailsContent, getMemberDisplayName
} from '../components/TripItinerary';

const tripSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  total_budget: z.string().optional(),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.end_date) >= new Date(data.start_date);
  }
  return true;
}, {
  message: 'La fecha fin no puede ser anterior a la fecha de inicio',
  path: ['end_date'],
});

type TripForm = z.infer<typeof tripSchema>;

export function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { updateTrip } = useTrips();
  const { trip, days, members, loading, error, refresh, addDay, updateDay, addEvent, updateEvent, reorderEvents, deleteEvent, deleteDay } = useTripDetail(id!);
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const { signOut, user, profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showAddDay, setShowAddDay] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<TripEvent | null>(null);
  const [editingDay, setEditingDay] = useState<{ id: string; date: string; notes?: string } | null>(null);
  const [showEditTrip, setShowEditTrip] = useState(false);
  const [showCoverEditor, setShowCoverEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'expenses' | 'members' | 'checklist' | 'map' | 'packing' | 'activity'>('itinerary');
  const [eventDetails, setEventDetails] = useState<TripEvent | null>(null);
  const [showQuickAddExpense, setShowQuickAddExpense] = useState(false);

  const handleQuickAddExpense = async (dayId: string, data: any) => {
    await addEvent(dayId, data);
    refresh();
  };

  const displayName = profile?.alias || profile?.full_name || user?.email?.split('@')[0] || 'Usuario';

  const handleLogout = async () => {
    if (await confirm('¿Cerrar sesión?')) {
      await signOut();
      navigate('/');
    }
  };

  if (loading) {
    return isMobile ? <DetailSkeleton /> : <LoadingOverlay />;
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Viaje no encontrado'}</p>
          <Link to="/" className="text-blue-500 hover:underline">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
        <TripDetailHeader
          trip={trip}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as any)}
          isMobile
          displayName={displayName}
          profile={profile}
          onLogout={handleLogout}
          onEditTrip={() => setShowEditTrip(true)}
          onEditCover={() => setShowCoverEditor(true)}
          members={members}
          days={days}
        />

        <main className="flex-1 px-4 py-4 pb-20">
          {activeTab === 'members' ? (
            <TripMembersManager
              tripId={trip.id}
              tripTitle={trip.title}
              members={members}
              onMembersChange={refresh}
            />
          ) : activeTab === 'expenses' ? (
            <ExpensesSection
              days={days}
              members={members}
              onAddExpense={() => setShowQuickAddExpense(true)}
              onAddDay={() => {
                setShowAddDay(true);
                setActiveTab('itinerary');
              }}
              tripBudget={trip.total_budget}
              isMobile
            />
          ) : activeTab === 'checklist' ? (
            <ChecklistSection tripId={trip.id} />
          ) : activeTab === 'packing' ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <PackingList tripId={trip.id} />
            </div>
          ) : activeTab === 'map' ? (
            <div className="h-[calc(100vh-220px)] bg-white rounded-xl overflow-hidden shadow-sm">
              <TripMap
                events={days.flatMap(d => d.events)}
                onEventClick={(event) => {
                  const day = days.find(d => d.id === event.day_id);
                  if (day) {
                    setActiveTab('itinerary');
                    setTimeout(() => {
                      const eventElement = document.getElementById(`event-${event.id}`);
                      eventElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      eventElement?.classList.add('ring-2', 'ring-blue-500');
                      setTimeout(() => eventElement?.classList.remove('ring-2', 'ring-blue-500'), 2000);
                    }, 100);
                  }
                }}
              />
            </div>
          ) : activeTab === 'activity' ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <ActivityTimeline tripId={trip.id} />
            </div>
          ) : (
            <TripItinerary
              trip={trip}
              days={days}
              members={members}
              isMobile
              onAddDayClick={() => setShowAddDay(true)}
              onAddEventClick={(dayId) => setShowAddEvent(dayId)}
              onEditEventClick={(event) => setEditingEvent(event)}
              onViewEventDetails={(event) => setEventDetails(event)}
              onEditDayClick={(day) => setEditingDay(day)}
              onDeleteDay={deleteDay}
              onDeleteEvent={deleteEvent}
              onReorderEvents={reorderEvents}
              onRefresh={refresh}
            />
          )}
        </main>

        {activeTab === 'itinerary' && days.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAddDay(true)}
            aria-label="Añadir día"
            className="fixed right-5 bottom-20 z-30 w-14 h-14 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all active:scale-95"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}

        {showEditTrip && (
          <BottomSheet title="Editar Viaje" onClose={() => setShowEditTrip(false)}>
            <EditTripForm
              trip={trip}
              onSave={async (data) => {
                await updateTrip(trip.id, data);
                setShowEditTrip(false);
                refresh();
              }}
            />
          </BottomSheet>
        )}

        {showAddDay && (
          <BottomSheet title="Añadir Nuevo Día" onClose={() => setShowAddDay(false)}>
            <AddDayForm
              startDate={trip.start_date}
              lastDate={days.length > 0 ? days[days.length - 1].date : undefined}
              onSave={async (date, notes) => {
                await addDay(date, notes);
                setShowAddDay(false);
              }}
            />
          </BottomSheet>
        )}

        {editingDay && (
          <BottomSheet title="Editar Día" onClose={() => setEditingDay(null)}>
            <EditDayForm
              day={editingDay}
              onSave={async (updates) => {
                await updateDay(editingDay.id, updates);
                showToast('Día actualizado');
                setEditingDay(null);
                refresh();
              }}
            />
          </BottomSheet>
        )}

        {showAddEvent && (
          <BottomSheet title="Añadir Evento" onClose={() => setShowAddEvent(null)}>
            <AddEventForm
              onSave={async (data) => {
                await addEvent(showAddEvent, { ...data, event_type: data.event_type as any });
                showToast('Evento creado');
                setShowAddEvent(null);
              }}
            />
          </BottomSheet>
        )}

        {showCoverEditor && (
          <BottomSheet title="Editar Portada" onClose={() => setShowCoverEditor(false)}>
            <EditCoverForm
              trip={trip}
              onSave={async (coverImage) => {
                await updateTrip(trip.id, { cover_image: coverImage || undefined });
                setShowCoverEditor(false);
                refresh();
              }}
            />
          </BottomSheet>
        )}

        {editingEvent && (
          <BottomSheet title="Editar Evento" onClose={() => setEditingEvent(null)}>
            <EditEventContent
              event={editingEvent}
              members={members}
              onSave={async (data, payerId, participants) => {
                try {
                  const clean = (val: string | undefined) => val === '' ? undefined : val;
                  const updates = {
                    name: data.name,
                    event_type: data.event_type,
                    address: clean(data.address),
                    notes: clean(data.notes),
                    start_time: clean(data.start_time),
                    end_time: clean(data.end_time),
                    google_maps_url: clean(data.google_maps_url),
                    website_url: clean(data.website_url),
                    cost_amount: data.cost_amount ? parseFloat(data.cost_amount as string) : undefined,
                    cost_currency: data.cost_currency || 'EUR',
                    cost_paid: data.cost_paid || false,
                    booking_reference: clean(data.booking_reference),
                    booking_status: clean(data.booking_status) as any,
                    booking_platform: clean(data.booking_platform),
                    booking_contact_name: clean(data.booking_contact_name),
                    booking_contact_phone: clean(data.booking_contact_phone),
                    payer_id: payerId || undefined,
                    participants: participants && participants.length > 0 ? participants : undefined,
                  };
                  await updateEvent(editingEvent.id, updates);
                  showToast('Evento actualizado');
                  setEditingEvent(null);
                  refresh();
                } catch (err: any) {
                  showToast(err.message || 'Error al actualizar', 'error');
                }
              }}
              onRefreshTrip={refresh}
            />
          </BottomSheet>
        )}

        {eventDetails && (
          <BottomSheet title="Detalles del Evento" onClose={() => setEventDetails(null)}>
            <EventDetailsContent
              event={eventDetails}
              members={members}
              onSave={async (updates) => {
                try {
                  await updateEvent(eventDetails.id, updates);
                  showToast('Detalles actualizados');
                  setEventDetails(null);
                  refresh();
                } catch (err: any) {
                  showToast(err.message || 'Error', 'error');
                }
              }}
            />
          </BottomSheet>
        )}

        {showQuickAddExpense && (
          <BottomSheet title="Añadir gasto rápido" onClose={() => setShowQuickAddExpense(false)}>
            <QuickAddExpenseForm
              days={days}
              members={members}
              onSave={async (dayId, data) => {
                try {
                  await handleQuickAddExpense(dayId, data);
                  showToast('Gasto añadido');
                  setShowQuickAddExpense(false);
                } catch (err: any) {
                  showToast(err.message || 'Error', 'error');
                }
              }}
            />
          </BottomSheet>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <TripDetailHeader
        trip={trip}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
        isMobile={false}
        displayName={displayName}
        profile={profile}
        onLogout={handleLogout}
        onEditTrip={() => setShowEditTrip(true)}
        onEditCover={() => setShowCoverEditor(true)}
        members={members}
        days={days}
      />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
        {activeTab === 'members' ? (
          <TripMembersManager tripId={trip.id} tripTitle={trip.title} members={members} onMembersChange={refresh} />
        ) : activeTab === 'expenses' ? (
          <ExpensesSection
            days={days}
            members={members}
            onAddExpense={() => setShowQuickAddExpense(true)}
            onAddDay={() => { setShowAddDay(true); setActiveTab('itinerary'); }}
            tripBudget={trip.total_budget}
          />
        ) : activeTab === 'checklist' ? (
          <ChecklistSection tripId={trip.id} />
        ) : activeTab === 'packing' ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <PackingList tripId={trip.id} />
          </div>
        ) : activeTab === 'map' ? (
          <div className="h-[600px] bg-white rounded-xl overflow-hidden">
            <TripMap
              events={days.flatMap(d => d.events)}
              onEventClick={(event) => {
                const day = days.find(d => d.id === event.day_id);
                if (day) {
                  setActiveTab('itinerary');
                  setTimeout(() => {
                    const eventElement = document.getElementById(`event-${event.id}`);
                    eventElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    eventElement?.classList.add('ring-2', 'ring-blue-500');
                    setTimeout(() => eventElement?.classList.remove('ring-2', 'ring-blue-500'), 2000);
                  }, 100);
                }
              }}
            />
          </div>
        ) : activeTab === 'activity' ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <ActivityTimeline tripId={trip.id} />
          </div>
        ) : (
          <TripItinerary
            trip={trip}
            days={days}
            members={members}
            isMobile={false}
            onAddDayClick={() => setShowAddDay(true)}
            onAddEventClick={(dayId) => setShowAddEvent(dayId)}
            onEditEventClick={(event) => setEditingEvent(event)}
            onViewEventDetails={(event) => setEventDetails(event)}
            onEditDayClick={(day) => setEditingDay(day)}
            onDeleteDay={deleteDay}
            onDeleteEvent={deleteEvent}
            onReorderEvents={reorderEvents}
            onRefresh={refresh}
          />
        )}
      </main>

      {showEditTrip && (
        <BottomSheet title="Editar Viaje" onClose={() => setShowEditTrip(false)}>
          <EditTripForm
            trip={trip}
            onSave={async (data) => { await updateTrip(trip.id, data); setShowEditTrip(false); refresh(); }}
          />
        </BottomSheet>
      )}

      {showAddDay && (
        <BottomSheet title="Añadir Nuevo Día" onClose={() => setShowAddDay(false)}>
          <AddDayForm
            startDate={trip.start_date}
            lastDate={days.length > 0 ? days[days.length - 1].date : undefined}
            onSave={async (date, notes) => { await addDay(date, notes); setShowAddDay(false); }}
          />
        </BottomSheet>
      )}

      {editingDay && (
        <BottomSheet title="Editar Día" onClose={() => setEditingDay(null)}>
          <EditDayForm
            day={editingDay}
            onSave={async (updates) => { await updateDay(editingDay.id, updates); showToast('Día actualizado'); setEditingDay(null); refresh(); }}
          />
        </BottomSheet>
      )}

      {showAddEvent && (
        <BottomSheet title="Añadir Evento" onClose={() => setShowAddEvent(null)}>
          <AddEventForm
            onSave={async (data) => { await addEvent(showAddEvent, { ...data, event_type: data.event_type as any }); showToast('Evento creado'); setShowAddEvent(null); }}
          />
        </BottomSheet>
      )}

      {showCoverEditor && (
        <BottomSheet title="Editar Portada" onClose={() => setShowCoverEditor(false)}>
          <EditCoverForm
            trip={trip}
            onSave={async (coverImage) => { await updateTrip(trip.id, { cover_image: coverImage || undefined }); setShowCoverEditor(false); refresh(); }}
          />
        </BottomSheet>
      )}

      {editingEvent && (
        <BottomSheet title="Editar Evento" onClose={() => setEditingEvent(null)}>
          <EditEventContent
            event={editingEvent}
            members={members}
            onSave={async (data, payerId, participants) => {
              try {
                const clean = (val: string | undefined) => val === '' ? undefined : val;
                const updates = {
                  name: data.name, event_type: data.event_type, address: clean(data.address),
                  notes: clean(data.notes), start_time: clean(data.start_time), end_time: clean(data.end_time),
                  google_maps_url: clean(data.google_maps_url), website_url: clean(data.website_url),
                  cost_amount: data.cost_amount ? parseFloat(data.cost_amount as string) : undefined,
                  cost_currency: data.cost_currency || 'EUR', cost_paid: data.cost_paid || false,
                  booking_reference: clean(data.booking_reference), booking_status: clean(data.booking_status) as any,
                  booking_platform: clean(data.booking_platform), booking_contact_name: clean(data.booking_contact_name),
                  booking_contact_phone: clean(data.booking_contact_phone), payer_id: payerId || undefined,
                  participants: participants && participants.length > 0 ? participants : undefined,
                };
                await updateEvent(editingEvent.id, updates);
                showToast('Evento actualizado'); setEditingEvent(null); refresh();
              } catch (err: any) { showToast(err.message || 'Error al actualizar', 'error'); }
            }}
            onRefreshTrip={refresh}
          />
        </BottomSheet>
      )}

      {eventDetails && (
        <BottomSheet title="Detalles del Evento" onClose={() => setEventDetails(null)}>
          <EventDetailsContent
            event={eventDetails}
            members={members}
            onSave={async (updates) => {
              try { await updateEvent(eventDetails.id, updates); showToast('Detalles actualizados'); setEventDetails(null); refresh(); } catch (err: any) { showToast(err.message || 'Error', 'error'); }
            }}
          />
        </BottomSheet>
      )}

      {showQuickAddExpense && (
        <BottomSheet title="Añadir gasto rápido" onClose={() => setShowQuickAddExpense(false)}>
          <QuickAddExpenseForm
            days={days}
            members={members}
            onSave={async (dayId, data) => { try { await handleQuickAddExpense(dayId, data); showToast('Gasto añadido'); setShowQuickAddExpense(false); } catch (err: any) { showToast(err.message || 'Error', 'error'); } }}
          />
        </BottomSheet>
      )}

      <Footer />
    </div>
  );
}

function EditTripForm({ trip, onSave }: { trip: { id: string; title: string; description?: string; start_date?: string; end_date?: string; total_budget?: number }; onSave: (data: any) => void }) {
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting, isValid } } = useForm<TripForm>({
    resolver: zodResolver(tripSchema), mode: 'onChange',
    defaultValues: { title: trip.title, description: trip.description || '', start_date: trip.start_date || '', end_date: trip.end_date || '', total_budget: trip.total_budget?.toString() || '' },
  });
  const startDate = watch('start_date');

  return (
    <form onSubmit={handleSubmit(async (data) => {
      try {
        setError('');
        await onSave({
          title: data.title, description: data.description || undefined, start_date: data.start_date || undefined,
          end_date: data.end_date || undefined, total_budget: data.total_budget ? parseFloat(data.total_budget) : undefined,
        });
      } catch (err: any) { setError(err.message || 'Error'); }
    })} className="space-y-4">
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título <span className="text-red-500">*</span></label>
        <input {...register('title')} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
        <textarea {...register('description')} rows={3} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha inicio</label>
          <input {...register('start_date')} type="date" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha fin</label>
          <input {...register('end_date')} type="date" min={startDate || ''} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Presupuesto (€)</label>
        <div className="relative">
          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input {...register('total_budget')} type="number" step="0.01" min="0" placeholder="Ej: 1500" className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isSubmitting || !isValid} className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed">
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

function EditCoverForm({ trip, onSave }: { trip: { id: string; cover_image?: string }; onSave: (coverImage: string) => void }) {
  const [coverImage, setCoverImage] = useState(trip.cover_image || '');

  return (
    <div className="space-y-4">
      <CoverSelector value={coverImage} onChange={(url) => setCoverImage(url)} />
      <button type="button" onClick={() => onSave(coverImage)} className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600">Guardar</button>
    </div>
  );
}

function ChecklistSection({ tripId }: { tripId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => { fetchItems(); }, [tripId]);
  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase.from('todo_items').select('*').eq('trip_id', tripId).is('event_id', null).order('created_at', { ascending: false });
    setItems(data || []); setLoading(false);
  };

  const addItem = async () => {
    if (!newItem.trim()) return;
    const { data, error } = await supabase.from('todo_items').insert({ trip_id: tripId, description: newItem.trim(), completed: false }).select().single();
    if (error) { showToast('Error al añadir', 'error'); } else { setItems(prev => [data, ...prev]); setNewItem(''); }
  };

  const toggleItem = async (item: any) => {
    const { error } = await supabase.from('todo_items').update({ completed: !item.completed }).eq('id', item.id);
    if (!error) setItems(prev => prev.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i));
  };

  const deleteItem = async (id: string) => {
    await supabase.from('todo_items').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const completedCount = items.filter(i => i.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  const cardCls = 'bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white flex items-center gap-1.5">
          <CheckSquare className="w-4 h-4" /> Checklist pre-viaje
        </h2>
        {items.length > 0 && <span className="text-xs text-gray-500">{completedCount}/{items.length}</span>}
      </div>
      {items.length > 0 && (
        <div className={cardCls}>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-600 dark:text-gray-300">Progreso</span>
            <span className="font-medium text-gray-800 dark:text-white">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      <div className={cardCls}>
        <div className="flex gap-2">
          <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()} placeholder="Añadir tarea..." className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
          <button type="button" onClick={addItem} disabled={!newItem.trim()} aria-label="Añadir tarea" className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-300 transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-6 text-sm text-gray-500">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
          <CheckSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No hay tareas en tu checklist</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <button type="button" onClick={() => toggleItem(item)} aria-label={item.completed ? 'Marcar como pendiente' : 'Marcar como completado'} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                {item.completed && <Check className="w-3 h-3" />}
              </button>
              <span className={`flex-1 text-sm ${item.completed ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-white'}`}>{item.description}</span>
              <button type="button" onClick={() => deleteItem(item.id)} aria-label="Eliminar tarea" className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickAddExpenseForm({ days, members, onSave }: {
  days: { id: string; day_number: number; date: string }[];
  members: { id: string; user_id?: string; email: string; profile?: { full_name?: string; alias?: string } }[];
  onSave: (dayId: string, data: any) => void;
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState(days[0]?.id || '');
  const [category, setCategory] = useState<ExpenseCategory>('other');

  const toggleParticipant = (id: string) => {
    setSelectedParticipants(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Concepto <span className="text-red-500">*</span></label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Cena, Taxi..." className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Importe (€) <span className="text-red-500">*</span></label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" step="0.01" min="0" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Día <span className="text-red-500">*</span></label>
        <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          {days.map(day => (<option key={day.id} value={day.id}>Día {day.day_number} - {formatDate(day.date)}</option>))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pagado por <span className="text-red-500">*</span></label>
        <select value={payerId} onChange={(e) => setPayerId(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="">Seleccionar...</option>
          {members.map(m => (<option key={m.id} value={m.user_id || m.id}>{getMemberDisplayName(m)}</option>))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categoría</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[]).map(cat => {
            const catInfo = EXPENSE_CATEGORIES[cat];
            return (
              <button key={cat} type="button" onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1 ${category === cat ? `${catInfo.color} ring-2 ring-blue-500` : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                <span>{catInfo.icon}</span><span>{catInfo.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Compartido entre (opcional)</label>
        <div className="flex flex-wrap gap-2">
          {members.map(m => {
            const id = m.user_id || m.id;
            const isSelected = selectedParticipants.includes(id);
            return (
              <button key={m.id} type="button" onClick={() => toggleParticipant(id)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isSelected ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>
                {getMemberDisplayName(m)}
              </button>
            );
          })}
        </div>
        {selectedParticipants.length > 0 && amount && (
          <p className="text-xs text-gray-500 mt-2">{parseFloat(amount) / selectedParticipants.length}€ por persona</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onSave(selectedDay, { name, event_type: 'activity', cost_amount: parseFloat(amount), cost_currency: 'EUR', expense_category: category, payer_id: payerId, participants: selectedParticipants.length > 0 ? selectedParticipants : undefined })}
        disabled={!name || !amount || !selectedDay || !payerId}
        className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Añadir
      </button>
    </div>
  );
}

function exportToCSV(events: any[], members: any[], days: any[]) {
  const memberMap = new Map(members.map((m: any) => [m.user_id, getMemberDisplayName(m)]));
  const dayMap = new Map(days.map((d: any) => [d.id, d.date]));
  const headers = ['Fecha', 'Concepto', 'Categoría', 'Importe', 'Moneda', 'Pagado por', 'Participantes', 'Notas'];
  const rows = events.map((e: any) => [
    dayMap.get(e.day_id) || '', e.name, EXPENSE_CATEGORIES[e.expense_category as ExpenseCategory]?.label || 'Otros',
    e.cost_amount || 0, e.cost_currency || 'EUR', memberMap.get(e.payer_id) || 'N/A',
    (e.participants || []).map((p: string) => memberMap.get(p) || p).join(', '), e.notes || '',
  ]);
  const csvContent = [headers, ...rows].map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const csvBlob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(csvBlob);
  downloadLink.download = `gastos-viaje-${new Date().toISOString().split('T')[0]}.csv`;
  downloadLink.click();
}

function ExpensesSection({ days, members, onAddExpense, onAddDay, tripBudget, isMobile }: {
  days: (any & { events: any[] })[];
  members: { id: string; user_id?: string; email: string; role: string; status: string; profile?: { full_name?: string; alias?: string; avatar_url?: string } }[];
  onAddExpense: () => void;
  onAddDay: () => void;
  tripBudget?: number;
  isMobile?: boolean;
}) {
  const allEvents = days.flatMap(d => d.events);
  const eventsWithCost = allEvents.filter(e => e.cost_amount && e.cost_amount > 0);
  const totalExpenses = eventsWithCost.reduce((sum, e) => sum + (e.cost_amount || 0), 0);

  const categoryStats = eventsWithCost.reduce((acc, e) => {
    const cat = e.expense_category || 'other';
    acc[cat] = (acc[cat] || 0) + (e.cost_amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const catEntries = Object.entries(categoryStats) as [string, number][];
  const sortedCategories = catEntries.sort((entryA, entryB) => entryB[1] - entryA[1]).map(([cat, expenseAmt]) => ({
    category: cat as ExpenseCategory, amount: expenseAmt, percentage: totalExpenses > 0 ? (expenseAmt / totalExpenses) * 100 : 0,
  }));

  const memberStats = members.filter(m => m.status === 'accepted' && m.user_id).map(m => {
    const userId = m.user_id!;
    const paidByUser = eventsWithCost.filter(e => e.payer_id === userId).reduce((sum, e) => sum + (e.cost_amount || 0), 0);
    const owedByUser = eventsWithCost.reduce((sum, e) => {
      const participants = e.participants || [];
      if (participants.length === 0) return sum;
      return sum + (participants.includes(userId) ? (e.cost_amount || 0) / participants.length : 0);
    }, 0);
    return { userId, email: m.email, displayName: getMemberDisplayName(m), paid: paidByUser, owed: owedByUser, balance: paidByUser - owedByUser };
  });

  const settlements: { from: string; fromName: string; to: string; toName: string; amount: number }[] = [];
  const debtors = memberStats.filter(m => m.balance < 0).sort((a, b) => a.balance - b.balance);
  const creditors = memberStats.filter(m => m.balance > 0).sort((a, b) => b.balance - a.balance);
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
    if (amount > 0.01) settlements.push({ from: debtor.userId, fromName: debtor.displayName, to: creditor.userId, toName: creditor.displayName, amount: Math.round(amount * 100) / 100 });
    debtor.balance -= amount;
    creditor.balance += amount;
    if (Math.abs(debtor.balance) < 0.01) i++;
    if (Math.abs(creditor.balance) < 0.01) j++;
  }

  const formatCurrency = (amount: number, currency: string = 'EUR') => new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2"><Receipt className="w-5 h-5" /> Gastos</h2>
        <div className="flex items-center gap-2">
          {days.length === 0 ? (
            <button type="button" onClick={onAddDay} className="flex items-center gap-1 text-blue-500 text-sm font-medium"><Plus className="w-4 h-4" /> Crear día</button>
          ) : (
            <>
              <button type="button" onClick={onAddExpense} aria-label="Añadir gasto" className="flex items-center gap-1.5 bg-blue-500 text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-blue-600"><Plus className="w-4 h-4" /> {isMobile ? '' : 'Añadir gasto'}</button>
              {!isMobile && (
                <button type="button" onClick={() => exportToCSV(eventsWithCost, members, days)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${eventsWithCost.length > 0 ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'}`} disabled={eventsWithCost.length === 0}>
                  <Download className="w-4 h-4" /> Exportar
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs opacity-80">Gasto total</span>
          </div>
          <span className="text-xs opacity-80">{eventsWithCost.length} gastos</span>
        </div>
        <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
        {tripBudget && tripBudget > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="opacity-80">Presupuesto: {formatCurrency(tripBudget)}</span>
              <span className="opacity-80">{Math.round((totalExpenses / tripBudget) * 100)}%</span>
            </div>
            <div className="h-2.5 bg-white/30 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${totalExpenses > tripBudget ? 'bg-red-400' : 'bg-white'}`} style={{ width: `${Math.min((totalExpenses / tripBudget) * 100, 100)}%` }} />
            </div>
            <p className={`text-xs mt-1 ${totalExpenses > tripBudget ? 'text-red-200' : 'opacity-80'}`}>
              {totalExpenses > tripBudget ? `¡Has superado el presupuesto en ${formatCurrency(totalExpenses - tripBudget)}!` : `Te quedan ${formatCurrency(tripBudget - totalExpenses)}`}
            </p>
          </div>
        )}
      </div>

      {eventsWithCost.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className={`${isMobile ? 'px-4 py-2.5' : 'px-5 py-3'} bg-gray-50 dark:bg-gray-700 border-b`}>
            <h3 className="font-semibold text-sm text-gray-800 dark:text-white">Gastos por categoría</h3>
          </div>
          <div className={`${isMobile ? 'p-4' : 'p-5'} space-y-3`}>
            {sortedCategories.map(({ category, amount, percentage }) => {
              const catInfo = EXPENSE_CATEGORIES[category];
              return (
                <div key={category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="flex items-center gap-1.5">
                      <span>{catInfo.icon}</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{catInfo.label}</span>
                    </span>
                    <span className="text-xs font-medium text-gray-800 dark:text-white">{formatCurrency(amount)} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: category === 'food' ? '#f97316' : category === 'transport' ? '#3b82f6' : category === 'accommodation' ? '#a855f7' : category === 'activities' ? '#22c55e' : category === 'shopping' ? '#ec4899' : '#6b7280' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className={`${isMobile ? 'px-4 py-2.5' : 'px-5 py-3'} bg-gray-50 dark:bg-gray-700 border-b`}>
          <h3 className="font-semibold text-sm text-gray-800 dark:text-white">Resumen por persona</h3>
        </div>
        {memberStats.length === 0 ? (
          <div className={`${isMobile ? 'p-6' : 'p-8'} text-center text-sm text-gray-500`}>No hay datos suficientes</div>
        ) : (
          <div className="divide-y">
            {memberStats.map(stat => (
              <div key={stat.userId} className={`${isMobile ? 'px-4 py-3' : 'px-5 py-4'} flex items-center justify-between`}>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{stat.displayName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Pagó: {formatCurrency(stat.paid)} · Debe: {formatCurrency(stat.owed)}</p>
                </div>
                <div className={`text-right ${stat.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <p className="font-semibold text-sm">{stat.balance >= 0 ? '+' : ''}{formatCurrency(stat.balance)}</p>
                  <p className="text-xs">{stat.balance >= 0 ? 'Le deben' : 'Debe'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {settlements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className={`${isMobile ? 'px-4 py-2.5' : 'px-5 py-3'} bg-gray-50 dark:bg-gray-700 border-b`}>
            <h3 className="font-semibold text-sm text-gray-800 dark:text-white">Liquidación</h3>
          </div>
          <div className="divide-y">
            {settlements.map((s, idx) => (
              <div key={idx} className={`${isMobile ? 'px-4 py-3' : 'px-5 py-4'} flex items-center justify-between`}>
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-red-600 font-medium">{s.fromName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-green-600 font-medium">{s.toName}</span>
                </div>
                <span className="font-semibold text-sm text-gray-800 dark:text-white">{formatCurrency(s.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {eventsWithCost.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className={`${isMobile ? 'px-4 py-2.5' : 'px-5 py-3'} bg-gray-50 dark:bg-gray-700 border-b`}>
            <h3 className="font-semibold text-sm text-gray-800 dark:text-white">Detalle de gastos</h3>
          </div>
          <div className="divide-y">
            {eventsWithCost.map(event => {
              const payer = members.find(m => m.user_id === event.payer_id);
              const participants = event.participants || [];
              return (
                <div key={event.id} className={`${isMobile ? 'px-4 py-3' : 'px-5 py-4'}`}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{event.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {payer ? `Pagado por ${getMemberDisplayName(payer)}` : 'Sin pagador'}
                        {participants.length > 0 && ` · ${participants.length} pers.`}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white shrink-0">{formatCurrency(event.cost_amount!, event.cost_currency)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
