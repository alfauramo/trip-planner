import { useState, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, Plus, Receipt, Users, Package } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useTripDetail } from '../hooks/useTripDetail';
import { useTrips } from '../hooks/useTrips';
import { TripMembersManager } from '../components/TripMembersManager';
import { useToast } from '../components/Toast';
import { LoadingOverlay, DetailSkeleton } from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { Footer } from '../components/Footer';
import { PackingList } from '../components/PackingList';
import { BottomSheet } from '../components/BottomSheet';
import { useIsMobile } from '../hooks/useMediaQuery';
import { TripDetailHeader } from '../components/TripDetailHeader';
import { EditTripForm } from '../components/EditTripForm';
import { EditCoverForm } from '../components/EditCoverForm';
import { ChecklistSection } from '../components/ChecklistSection';
import { QuickAddExpenseForm } from '../components/QuickAddExpenseForm';
import { ExpensesSection } from '../components/ExpensesSection';
import { Modal } from '../components/Modal';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import {
  TripItinerary,
  AddDayForm,
  EditDayForm,
  AddEventForm,
  EditEventContent,
  EventDetailsContent,
} from '../components/TripItinerary';
import type { PlaceForm } from '../components/EventForms';
import { TripEvent, EventType } from '../types';
import type { AIItineraryResult } from '../hooks/useAIItinerary';

function prepareEventUpdates(data: PlaceForm, payerId?: string, participants?: string[]) {
  const clean = (val: string | undefined) => (val === '' ? undefined : val);
  return {
    name: data.name,
    event_type: data.event_type as EventType,
    address: clean(data.address as string | undefined),
    notes: clean(data.notes as string | undefined),
    start_time: clean(data.start_time as string | undefined),
    end_time: clean(data.end_time as string | undefined),
    google_maps_url: clean(data.google_maps_url as string | undefined),
    website_url: clean(data.website_url as string | undefined),
    cost_amount:
      data.cost_amount !== '' && data.cost_amount !== undefined ? parseFloat(data.cost_amount as string) : undefined,
    cost_currency: data.cost_currency || 'EUR',
    cost_paid: data.cost_paid || false,
    booking_reference: clean(data.booking_reference as string | undefined),
    booking_status: clean(data.booking_status as string | undefined) as
      | 'pending'
      | 'confirmed'
      | 'paid'
      | 'cancelled'
      | undefined,
    booking_platform: clean(data.booking_platform as string | undefined),
    booking_contact_name: clean(data.booking_contact_name as string | undefined),
    booking_contact_phone: clean(data.booking_contact_phone as string | undefined),
    payer_id: payerId || undefined,
    participants: participants && participants.length > 0 ? participants : undefined,
  };
}

export function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { updateTrip } = useTrips();
  const {
    trip,
    days,
    members,
    loading,
    error,
    refresh,
    addDay,
    updateDay,
    addEvent,
    updateEvent,
    reorderEvents,
    deleteEvent,
    deleteDay,
  } = useTripDetail(id!);
  const { showToast } = useToast();
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [showAddDay, setShowAddDay] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<TripEvent | null>(null);
  const [editingDay, setEditingDay] = useState<{ id: string; date: string; notes?: string } | null>(null);
  const [showEditTrip, setShowEditTrip] = useState(false);
  const [showCoverEditor, setShowCoverEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'expenses' | 'members' | 'prep'>('itinerary');
  const [eventDetails, setEventDetails] = useState<TripEvent | null>(null);
  const [showQuickAddExpense, setShowQuickAddExpense] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const closeAllSheets = useCallback(() => {
    setShowAddDay(false);
    setShowAddEvent(null);
    setEditingEvent(null);
    setEditingDay(null);
    setShowEditTrip(false);
    setShowCoverEditor(false);
    setEventDetails(null);
    setShowQuickAddExpense(false);
  }, []);

  useKeyboardShortcuts(
    useMemo(
      () => [
        { key: 'Escape', handler: closeAllSheets, description: t('shortcuts.closeSheets') || 'Cerrar panel' },
        {
          key: 'n',
          ctrl: true,
          handler: () => setShowAddDay(true),
          description: t('shortcuts.addDay') || 'Añadir día',
        },
      ],
      [closeAllSheets, t],
    ),
  );

  const handleQuickAddExpense = async (dayId: string, data: Record<string, unknown>) => {
    await addEvent(dayId, data);
    refresh();
  };

  const handleBulkCreate = async (result: AIItineraryResult) => {
    if (!trip?.start_date) {
      showToast(t('trip.ai.noStartDate'), 'error');
      return;
    }
    try {
      const startDate = new Date(trip.start_date);
      for (const dayPlan of result.days) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + dayPlan.day - 1);
        const dateStr = date.toISOString().split('T')[0];
        const newDay = await addDay(dateStr, dayPlan.description);
        for (const act of dayPlan.activities) {
          await addEvent(newDay.id, {
            name: act.description,
            event_type: 'activity' as EventType,
            notes: `${dayPlan.title}: ${act.time}`,
            start_time: act.time,
          });
        }
      }
      showToast(t('trip.ai.created'), 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    }
  };

  const displayName = profile?.alias || profile?.full_name || user?.email?.split('@')[0] || t('profile.user');

  if (loading) {
    return isMobile ? <DetailSkeleton /> : <LoadingOverlay />;
  }

  if (error || !trip) {
    return (
      <div className="error-page bg-stone-50 dark:bg-stone-950">
        <Helmet>
          <title>Viaje | Trip Planner</title>
        </Helmet>
        <div className="error-content">
          <p className="error-message">{error || t('trip.notFound')}</p>
          <div className="error-actions">
            <Link to="/" className="text-emerald-600 hover:underline">
              {t('common.back')}
            </Link>
            <button type="button" onClick={refresh} className="btn-primary">
              {t('common.retry') || 'Reintentar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'itinerary' as const, label: t('nav.itinerary'), icon: Calendar },
    { key: 'expenses' as const, label: t('nav.expenses'), icon: Receipt },
    { key: 'members' as const, label: t('nav.members'), icon: Users },
    { key: 'prep' as const, label: t('nav.prep'), icon: Package },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'members':
        return (
          <TripMembersManager tripId={trip.id} tripTitle={trip.title} members={members} onMembersChange={refresh} />
        );
      case 'expenses':
        return (
          <ExpensesSection
            days={days}
            members={members}
            onAddExpense={() => setShowQuickAddExpense(true)}
            onAddDay={() => {
              setShowAddDay(true);
              setActiveTab('itinerary');
            }}
            tripBudget={trip.total_budget}
            tripCurrency={trip.currency}
            isMobile={isMobile || undefined}
          />
        );
      case 'prep':
        return (
          <div className="space-y-6">
            <ChecklistSection tripId={trip.id} />
            <div className={`card-widget ${isMobile ? 'p-4' : 'p-6'}`}>
              <PackingList tripId={trip.id} />
            </div>
          </div>
        );
      default:
        return (
          <TripItinerary
            trip={trip}
            days={days}
            members={members}
            isMobile={isMobile}
            onAddDayClick={() => setShowAddDay(true)}
            onAddEventClick={(dayId) => setShowAddEvent(dayId)}
            onEditEventClick={(event) => setEditingEvent(event)}
            onViewEventDetails={(event) => setEventDetails(event)}
            onEditDayClick={(day) => setEditingDay(day)}
            onDeleteDay={deleteDay}
            onDeleteEvent={deleteEvent}
            onReorderEvents={reorderEvents}
            onRefresh={refresh}
            onBulkCreate={handleBulkCreate}
          />
        );
    }
  };

  const bottomSheets = (
    <>
      {showEditTrip && (
        <BottomSheet title={t('trip.edit')} onClose={() => setShowEditTrip(false)}>
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
        <BottomSheet title={t('day.addNew')} onClose={() => setShowAddDay(false)}>
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
        <BottomSheet title={t('day.edit')} onClose={() => setEditingDay(null)}>
          <EditDayForm
            day={editingDay}
            onSave={async (updates) => {
              await updateDay(editingDay.id, updates);
              showToast(t('day.updated'));
              setEditingDay(null);
              refresh();
            }}
          />
        </BottomSheet>
      )}
      {showAddEvent && (
        <BottomSheet title={t('event.add')} onClose={() => setShowAddEvent(null)}>
          <AddEventForm
            onSave={async (data) => {
              await addEvent(showAddEvent, { ...data, event_type: data.event_type as EventType });
              showToast(t('event.created'));
              setShowAddEvent(null);
            }}
          />
        </BottomSheet>
      )}
      {showCoverEditor && (
        <BottomSheet title={t('trip.editCover')} onClose={() => setShowCoverEditor(false)}>
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
        <BottomSheet title={t('event.edit')} onClose={() => setEditingEvent(null)}>
          <EditEventContent
            event={editingEvent}
            members={members}
            onSave={async (data, payerId, participants) => {
              try {
                const updates = prepareEventUpdates(data, payerId, participants);
                await updateEvent(editingEvent.id, updates);
                showToast(t('event.updated'));
                setEditingEvent(null);
                refresh();
              } catch (err: unknown) {
                showToast(err instanceof Error ? err.message : t('event.update.error'), 'error');
              }
            }}
            onRefreshTrip={refresh}
          />
        </BottomSheet>
      )}
      {eventDetails && (
        <BottomSheet title={t('event.details')} onClose={() => setEventDetails(null)}>
          <EventDetailsContent
            event={eventDetails}
            members={members}
            onSave={async (updates) => {
              try {
                await updateEvent(eventDetails.id, updates);
                showToast(t('event.updated'));
                setEventDetails(null);
                refresh();
              } catch (err: unknown) {
                showToast(err instanceof Error ? err.message : t('common.error'), 'error');
              }
            }}
          />
        </BottomSheet>
      )}
      {showQuickAddExpense && (
        <BottomSheet title={t('expenses.quickAdd')} onClose={() => setShowQuickAddExpense(false)}>
          <QuickAddExpenseForm
            days={days}
            members={members}
            onSave={async (dayId, data) => {
              try {
                await handleQuickAddExpense(dayId, data);
                showToast(t('expenses.added'));
                setShowQuickAddExpense(false);
              } catch (err: unknown) {
                showToast(err instanceof Error ? err.message : t('common.error'), 'error');
              }
            }}
          />
        </BottomSheet>
      )}
    </>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
        <Helmet>
          <title>{trip?.title || 'Viaje'} | Trip Planner</title>
        </Helmet>
        <TripDetailHeader
          trip={trip}
          isMobile
          displayName={displayName}
          profile={profile}
          onEditTrip={() => setShowEditTrip(true)}
          onEditCover={() => setShowCoverEditor(true)}
          members={members}
          days={days}
        />
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-stone-950/95 backdrop-blur-xl border-b border-stone-100 dark:border-stone-800 overflow-x-auto no-scrollbar">
          <div className="flex px-1 py-1.5 gap-0.5 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`${active ? 'btn-nav-active' : 'btn-nav-inactive'} whitespace-nowrap`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <main className="flex-1 px-4 pt-4 pb-24 space-y-6">{loading ? <DetailSkeleton /> : renderTabContent()}</main>
        {activeTab === 'itinerary' && (
          <button
            type="button"
            onClick={() => setShowAddDay(true)}
            aria-label={t('day.add')}
            className="btn-fab right-5 bottom-6"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
        {bottomSheets}
        {showKeyboardHelp && (
          <Modal title={t('shortcuts.title') || 'Atajos de teclado'} onClose={() => setShowKeyboardHelp(false)}>
            <div className="space-y-3">
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">{t('shortcuts.available')}</p>
              <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                <span className="text-sm">{t('shortcuts.addDay') || 'Añadir día'}</span>
                <kbd className="px-2 py-1 text-xs bg-stone-100 dark:bg-stone-800 rounded font-mono">Ctrl+N</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                <span className="text-sm">{t('shortcuts.closeSheets') || 'Cerrar panel'}</span>
                <kbd className="px-2 py-1 text-xs bg-stone-100 dark:bg-stone-800 rounded font-mono">Esc</kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">{t('shortcuts.help') || 'Mostrar atajos'}</span>
                <kbd className="px-2 py-1 text-xs bg-stone-100 dark:bg-stone-800 rounded font-mono">Ctrl+/</kbd>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      <Helmet>
        <title>{trip?.title || 'Viaje'} | Trip Planner</title>
      </Helmet>
      <TripDetailHeader
        trip={trip}
        isMobile={false}
        displayName={displayName}
        profile={profile}
        onEditTrip={() => setShowEditTrip(true)}
        onEditCover={() => setShowCoverEditor(true)}
        members={members}
        days={days}
      />
      <div className="bg-white dark:bg-stone-950 border-b border-stone-100 dark:border-stone-800 sticky top-[57px] z-10">
        <div className="page-container flex overflow-x-auto no-scrollbar gap-1 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`${active ? 'btn-nav-active' : 'btn-nav-inactive'}`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <main className="page-container flex-1 py-8 w-full space-y-6">
        {loading ? <DetailSkeleton /> : renderTabContent()}
      </main>
      {bottomSheets}
      {showKeyboardHelp && (
        <Modal title={t('shortcuts.title') || 'Atajos de teclado'} onClose={() => setShowKeyboardHelp(false)}>
          <div className="space-y-3">
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">{t('shortcuts.available')}</p>
            <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
              <span className="text-sm">{t('shortcuts.addDay') || 'Añadir día'}</span>
              <kbd className="px-2 py-1 text-xs bg-stone-100 dark:bg-stone-800 rounded font-mono">Ctrl+N</kbd>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
              <span className="text-sm">{t('shortcuts.closeSheets') || 'Cerrar panel'}</span>
              <kbd className="px-2 py-1 text-xs bg-stone-100 dark:bg-stone-800 rounded font-mono">Esc</kbd>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">{t('shortcuts.help') || 'Mostrar atajos'}</span>
              <kbd className="px-2 py-1 text-xs bg-stone-100 dark:bg-stone-800 rounded font-mono">Ctrl+/</kbd>
            </div>
          </div>
        </Modal>
      )}
      <Footer />
    </div>
  );
}
