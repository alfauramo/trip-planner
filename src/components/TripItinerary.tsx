import { Calendar, Plus, Compass, Pencil, Trash2, Sparkles, Route, Loader2 } from 'lucide-react';
import { optimizeRoute, buildGoogleMapsRoute } from '../lib/trip-optimizer';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmModal';
import { Tooltip } from './Tooltip';
import { SwipeableRow } from './SwipeableRow';
import { WeatherForecast } from './WeatherForecast';
import { EventComments } from './EventComments';
import { SortableEvent } from './SortableEvent';
import { ActivityTimeline } from './ActivityTimeline';
import { formatDate } from './EventHelpers';
import { type TripEvent, type Day, type TripMember, type TripWithDetails } from '../types';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { AIItineraryGenerator } from './AIItineraryGenerator';
import type { AIItineraryResult } from '../hooks/useAIItinerary';

export { AddDayForm, EditDayForm } from './DayForms';
export { AddEventForm, EditEventContent, EventDetailsContent } from './EventForms';
export { getMemberDisplayName, formatDateShort } from './EventHelpers';

export function TripItinerary({
  trip,
  days,
  members,
  isMobile,
  onAddDayClick,
  onAddEventClick,
  onEditEventClick,
  onViewEventDetails,
  onEditDayClick,
  onDeleteDay,
  onDeleteEvent,
  onReorderEvents,
  onRefresh,
  onBulkCreate,
}: {
  trip: { id: string; description?: string; start_date?: string };
  days: (Day & { events: TripEvent[] })[];
  members: TripMember[];
  isMobile: boolean;
  onAddDayClick: () => void;
  onAddEventClick: (dayId: string) => void;
  onEditEventClick: (event: TripEvent) => void;
  onViewEventDetails: (event: TripEvent) => void;
  onEditDayClick: (day: Day) => void;
  onDeleteDay: (dayId: string) => Promise<void>;
  onDeleteEvent: (eventId: string, dayId: string) => Promise<void>;
  onReorderEvents: (dayId: string, eventIds: string[]) => Promise<void>;
  onRefresh: () => void;
  onBulkCreate?: (result: AIItineraryResult) => Promise<void>;
}) {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { t } = useTranslation();
  const [optimizingDay, setOptimizingDay] = useState<string | null>(null);
  const [routingDay, setRoutingDay] = useState<string | null>(null);

  const handleDragEnd = async (event: DragEndEvent, dayId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    const oldIndex = day.events.findIndex((e) => e.id === active.id);
    const newIndex = day.events.findIndex((e) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newEvents = [...day.events];
    const [movedItem] = newEvents.splice(oldIndex, 1);
    newEvents.splice(newIndex, 0, movedItem);
    await onReorderEvents(
      dayId,
      newEvents.map((e) => e.id),
    );
  };

  const optimizeDayOrder = async (day: Day & { events: TripEvent[] }) => {
    const eventsWithCoords = day.events.filter(
      (e): e is TripEvent & { latitude: number; longitude: number } => !!e.latitude && !!e.longitude,
    );
    if (eventsWithCoords.length < 2) {
      showToast(t('trip.optimize.needsLocations'), 'error');
      return;
    }
    setOptimizingDay(day.id);
    try {
      const optimized = optimizeRoute(eventsWithCoords);
      const updates = optimized.map((event, idx) => ({ id: event.id, order: idx }));
      for (const update of updates) {
        await supabase.from('events').update({ order: update.order }).eq('id', update.id);
      }
      showToast(t('trip.optimize.result'));
      onRefresh();
    } finally {
      setOptimizingDay(null);
    }
  };

  const openDayInMaps = (day: Day & { events: TripEvent[] }) => {
    const eventsWithLocation = day.events.filter((e) => (e.latitude && e.longitude) || e.google_maps_url || e.address);
    if (eventsWithLocation.length === 0) {
      showToast(t('trip.optimize.noLocations'), 'error');
      return;
    }
    setRoutingDay(day.id);
    window.open(buildGoogleMapsRoute(eventsWithLocation), '_blank');
    setTimeout(() => setRoutingDay(null), 500);
  };

  const renderDayCard = (day: Day & { events: TripEvent[] }) => (
    <div
      key={day.id}
      className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm overflow-hidden border border-stone-100 dark:border-stone-700/50"
    >
      <div className="relative px-4 py-3.5 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-emerald-50/50 dark:from-stone-800 dark:to-stone-800 border-b border-stone-100 dark:border-stone-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {day.day_number}
          </div>
          <div>
            <h3 className={`font-semibold text-stone-800 dark:text-white ${isMobile ? 'text-sm' : 'text-base'}`}>
              {formatDate(day.date)}
            </h3>
            {day.notes && (
              <p className={`text-stone-500 dark:text-stone-400 ${isMobile ? 'text-xs mt-0.5' : 'text-sm mt-0.5'}`}>
                {day.notes}
              </p>
            )}
          </div>
        </div>
        <div className={`flex items-center ${isMobile ? 'gap-0.5 shrink-0' : 'gap-1'}`}>
          {isMobile ? (
            <>
              <button
                onClick={() => onEditDayClick(day)}
                className="p-1.5 text-stone-400 hover:text-emerald-600 rounded-lg hover:bg-white/50 dark:hover:bg-stone-700 transition-colors"
                aria-label={t('day.edit')}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={async () => {
                  if (await confirm(t('day.delete.confirm'))) {
                    try {
                      await onDeleteDay(day.id);
                      showToast(t('day.deleted'));
                    } catch (err: unknown) {
                      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
                    }
                  }
                }}
                className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-white/50 dark:hover:bg-stone-700 transition-colors"
                aria-label={t('day.delete')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <Tooltip content={t('day.edit')}>
                <button
                  onClick={() => onEditDayClick(day)}
                  aria-label="Editar día"
                  className="p-2 text-stone-400 dark:text-stone-500 hover:text-emerald-600 hover:bg-white/50 dark:hover:bg-stone-700 rounded-lg transition-all"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content={t('day.delete')}>
                <button
                  onClick={async () => {
                    if (await confirm(t('day.delete.confirm'))) {
                      try {
                        await onDeleteDay(day.id);
                        showToast(t('day.deleted'));
                      } catch (err: unknown) {
                        showToast(err instanceof Error ? err.message : t('day.delete.error'), 'error');
                      }
                    }
                  }}
                  aria-label="Eliminar día"
                  className="p-2 text-stone-400 dark:text-stone-500 hover:text-red-500 hover:bg-white/50 dark:hover:bg-stone-700 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </Tooltip>
            </>
          )}
        </div>
      </div>
      <div className={`${isMobile ? 'p-4' : 'p-5'}`}>
        {day.events.length === 0 ? (
          <p className={`text-stone-400 dark:text-stone-500 text-center ${isMobile ? 'text-xs py-4' : 'text-sm py-6'}`}>
            {t('event.empty')}
          </p>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, day.id)}>
            <SortableContext items={day.events.map((ev: TripEvent) => ev.id)} strategy={verticalListSortingStrategy}>
              <div className={`${isMobile ? 'space-y-3' : 'space-y-4'} overflow-hidden`}>
                {day.events.map((event: TripEvent) => {
                  const eventContent = (
                    <>
                      <SortableEvent
                        key={event.id}
                        event={event}
                        onEdit={() => onEditEventClick(event)}
                        onAddDetails={() => onViewEventDetails(event)}
                        onDelete={async () => {
                          if (await confirm(t('event.delete.confirm'))) {
                            await onDeleteEvent(event.id, day.id);
                            showToast(t('event.deleted'));
                          }
                        }}
                        onOpenMaps={() => event.google_maps_url && window.open(event.google_maps_url, '_blank')}
                      />
                      <details className="ml-12">
                        <summary className="text-xs text-stone-400 cursor-pointer hover:text-emerald-600 select-none py-1">
                          {t('comments.title')}
                        </summary>
                        <EventComments eventId={event.id} />
                      </details>
                    </>
                  );
                  if (isMobile) {
                    return (
                      <div key={event.id} className="list-enter">
                        <SwipeableRow
                          onDelete={async () => {
                            if (await confirm(t('event.delete.confirm'))) {
                              await onDeleteEvent(event.id, day.id);
                              showToast(t('event.deleted'));
                            }
                          }}
                        >
                          {eventContent}
                        </SwipeableRow>
                      </div>
                    );
                  }
                  return (
                    <div key={event.id} className="list-enter">
                      {eventContent}
                    </div>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
        <button
          onClick={() => onAddEventClick(day.id)}
          className={`w-full border-2 border-dashed border-stone-200 dark:border-stone-700 text-stone-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all flex items-center justify-center gap-1.5 font-medium ${
            isMobile ? 'mt-3 py-3 rounded-xl text-sm' : 'mt-4 py-2.5 rounded-xl'
          }`}
        >
          <Plus className="w-4 h-4" />
          {t('event.add')}
        </button>
        {day.events.length >= 2 && (
          <div className={`flex gap-2 ${isMobile ? 'mt-3' : 'mt-3'}`}>
            <button
              onClick={() => optimizeDayOrder(day)}
              disabled={optimizingDay === day.id}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600 hover:from-purple-100 hover:to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 dark:text-purple-400 transition-all font-medium ${
                isMobile ? 'rounded-xl text-xs' : 'rounded-xl text-sm'
              } ${optimizingDay === day.id ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {optimizingDay === day.id ? (
                <Loader2 className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} animate-spin`} />
              ) : (
                <Sparkles className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
              )}
              {isMobile ? t('trip.optimize') : t('trip.optimize.title')}
            </button>
            <button
              onClick={() => openDayInMaps(day)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-emerald-50 to-emerald-50/50 text-emerald-700 hover:from-emerald-100 hover:to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/20 dark:text-emerald-400 transition-all font-medium ${
                isMobile ? 'rounded-xl text-xs' : 'rounded-xl text-sm'
              }`}
            >
              {routingDay === day.id ? (
                <Loader2 className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} animate-spin`} />
              ) : (
                <Route className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
              )}
              {isMobile ? t('event.maps') : t('event.viewMaps')}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const emptyState = (
    <div className="empty-state">
      <div className="empty-state-icon-bg">
        <Compass className="empty-state-icon text-emerald-400" />
      </div>
      <p className="empty-state-title">{isMobile ? t('itinerary.empty') : t('itinerary.empty.desc')}</p>
      <p className="empty-state-desc">{t('itinerary.empty.action')}</p>
      <button onClick={onAddDayClick} className="text-emerald-600 font-medium text-sm hover:underline">
        {t('itinerary.addFirstDay')}
      </button>
    </div>
  );

  return (
    <>
      {trip.description && !isMobile && <p className="text-stone-600 dark:text-stone-300 mb-8">{trip.description}</p>}
      {trip.description && isMobile && (
        <p className="text-sm text-stone-600 dark:text-stone-300 mb-4">{trip.description}</p>
      )}
      <WeatherForecast trip={{ ...trip, days, members } as TripWithDetails} />
      {days.length > 0 && <ActivityTimeline tripId={trip.id} />}
      <div className={`flex items-center justify-between ${isMobile ? 'mb-4 mt-4' : 'mb-6'}`}>
        <h2
          className={`font-semibold text-stone-800 dark:text-white flex items-center gap-1.5 ${isMobile ? 'text-base' : 'text-lg gap-2'}`}
        >
          <Calendar className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
          {t('itinerary.title')}
        </h2>
        <button
          onClick={onAddDayClick}
          className={`flex items-center gap-1 text-emerald-600 font-medium ${isMobile ? 'text-sm' : 'hover:underline'}`}
        >
          <Plus className="w-4 h-4" />
          {t('day.add')}
        </button>
      </div>

      {days.length === 0 ? (
        <div className="space-y-6">
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold">{t('trip.gettingStarted')}</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <span className="text-sm">{t('trip.step1')}</span>
                <button onClick={onAddDayClick} className="ml-auto text-sm text-emerald-600 font-medium">
                  {t('trip.addDays')}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <span className="text-sm">{t('trip.step2')}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <span className="text-sm">{t('trip.step3')}</span>
              </div>
            </div>
          </div>
          {onBulkCreate ? (
            <div className="card-widget p-4 sm:p-6">
              <AIItineraryGenerator onSelect={onBulkCreate} />
            </div>
          ) : (
            emptyState
          )}
        </div>
      ) : (
        <div className={isMobile ? 'space-y-3' : 'space-y-6 w-full'}>{days.map(renderDayCard)}</div>
      )}
    </>
  );
}
