import { Calendar, Plus, Compass, Pencil, Trash2, Sparkles, Route } from 'lucide-react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmModal';
import { Tooltip } from './Tooltip';
import { SwipeableRow } from './SwipeableRow';
import { WeatherForecast } from './WeatherForecast';
import { EventComments } from './EventComments';
import { SortableEvent } from './SortableEvent';
import { formatDate } from './EventHelpers';
import { type TripEvent, type Day } from '../types';

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
}: {
  trip: { id: string; description?: string; start_date?: string };
  days: (Day & { events: TripEvent[] })[];
  members: any[];
  isMobile: boolean;
  onAddDayClick: () => void;
  onAddEventClick: (dayId: string) => void;
  onEditEventClick: (event: TripEvent) => void;
  onViewEventDetails: (event: TripEvent) => void;
  onEditDayClick: (day: any) => void;
  onDeleteDay: (dayId: string) => Promise<void>;
  onDeleteEvent: (eventId: string, dayId: string) => Promise<void>;
  onReorderEvents: (dayId: string, eventIds: string[]) => Promise<void>;
  onRefresh: () => void;
}) {
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const handleDragEnd = async (event: any, dayId: string) => {
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

  const optimizeDayOrder = async (day: any) => {
    const eventsWithCoords = day.events.filter((e: any) => e.latitude && e.longitude);
    if (eventsWithCoords.length < 2) {
      showToast('Se necesitan al menos 2 eventos con ubicación', 'error');
      return;
    }
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    const optimize = (points: any[]) => {
      const visited: boolean[] = new Array(points.length).fill(false);
      const order: number[] = [0];
      visited[0] = true;
      let current = 0;
      while (order.length < points.length) {
        let nearestIdx = -1;
        let nearestDist = Infinity;
        for (let i = 0; i < points.length; i++) {
          if (!visited[i]) {
            const dist = haversineDistance(
              points[current].latitude,
              points[current].longitude,
              points[i].latitude,
              points[i].longitude,
            );
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestIdx = i;
            }
          }
        }
        if (nearestIdx !== -1) {
          order.push(nearestIdx);
          visited[nearestIdx] = true;
          current = nearestIdx;
        }
      }
      return order.map((idx) => points[idx]);
    };
    const optimizedOrder = optimize(eventsWithCoords);
    const updates = optimizedOrder.map((event: any, idx: number) => ({
      id: event.id,
      order: idx,
    }));
    for (const update of updates) {
      await supabase.from('events').update({ order: update.order }).eq('id', update.id);
    }
    showToast('Ruta optimizada');
    onRefresh();
  };

  const openDayInMaps = (day: any) => {
    const eventsWithLocation = day.events.filter(
      (e: any) => (e.latitude && e.longitude) || e.google_maps_url || e.address,
    );
    if (eventsWithLocation.length === 0) {
      showToast('No hay eventos con ubicación', 'error');
      return;
    }
    let mapsUrl = 'https://www.google.com/maps/dir/';
    eventsWithLocation.forEach((event: any, idx: number) => {
      if (event.latitude && event.longitude) {
        mapsUrl += `${event.latitude},${event.longitude}`;
      } else if (event.google_maps_url) {
        const match = event.google_maps_url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (match) {
          mapsUrl += `${match[1]},${match[2]}`;
        } else {
          mapsUrl += encodeURIComponent(event.name);
        }
      } else if (event.address) {
        mapsUrl += encodeURIComponent(event.address);
      }
      if (idx < eventsWithLocation.length - 1) mapsUrl += '/';
    });
    window.open(mapsUrl, '_blank');
  };

  const renderDayCard = (day: any) => (
    <div
      key={day.id}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700/50"
    >
      <div className="relative px-4 py-3.5 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {day.day_number}
          </div>
          <div>
            <h3 className={`font-semibold text-gray-800 dark:text-white ${isMobile ? 'text-sm' : 'text-base'}`}>
              {formatDate(day.date)}
            </h3>
            {day.notes && (
              <p className={`text-gray-500 dark:text-gray-400 ${isMobile ? 'text-xs mt-0.5' : 'text-sm mt-0.5'}`}>
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
                className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700 transition-colors"
                aria-label="Editar día"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={async () => {
                  if (await confirm('¿Eliminar este día?')) {
                    try {
                      await onDeleteDay(day.id);
                      showToast('Día eliminado');
                    } catch (err: any) {
                      showToast(err.message || 'Error', 'error');
                    }
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700 transition-colors"
                aria-label="Eliminar día"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <Tooltip content="Editar día">
                <button
                  onClick={() => onEditDayClick(day)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-500 hover:bg-white/50 dark:hover:bg-gray-700 rounded-lg transition-all"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="Eliminar día">
                <button
                  onClick={async () => {
                    if (await confirm('¿Eliminar este día?')) {
                      try {
                        await onDeleteDay(day.id);
                        showToast('Día eliminado');
                      } catch (err: any) {
                        showToast(err.message || 'Error al eliminar el día', 'error');
                      }
                    }
                  }}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-white/50 dark:hover:bg-gray-700 rounded-lg transition-all"
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
          <p className={`text-gray-400 dark:text-gray-500 text-center ${isMobile ? 'text-xs py-4' : 'text-sm py-6'}`}>
            No hay eventos en este día
          </p>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, day.id)}>
            <SortableContext items={day.events.map((ev: TripEvent) => ev.id)} strategy={verticalListSortingStrategy}>
              <div className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
                {day.events.map((event: TripEvent) => {
                  const eventContent = (
                    <>
                      <SortableEvent
                        key={event.id}
                        event={event}
                        isMobile={isMobile}
                        onEdit={() => onEditEventClick(event)}
                        onAddDetails={() => onViewEventDetails(event)}
                        onDelete={async () => {
                          if (await confirm('¿Eliminar este evento?')) {
                            await onDeleteEvent(event.id, day.id);
                            showToast('Evento eliminado');
                          }
                        }}
                        onOpenMaps={() => event.google_maps_url && window.open(event.google_maps_url, '_blank')}
                      />
                      <details className="ml-12">
                        <summary className="text-xs text-gray-400 cursor-pointer hover:text-blue-500 select-none py-1">
                          Comentarios
                        </summary>
                        <EventComments eventId={event.id} />
                      </details>
                    </>
                  );
                  if (isMobile) {
                    return (
                      <SwipeableRow
                        key={event.id}
                        onDelete={async () => {
                          if (await confirm('¿Eliminar este evento?')) {
                            await onDeleteEvent(event.id, day.id);
                            showToast('Evento eliminado');
                          }
                        }}
                      >
                        {eventContent}
                      </SwipeableRow>
                    );
                  }
                  return eventContent;
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
        <button
          onClick={() => onAddEventClick(day.id)}
          className={`w-full border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all flex items-center justify-center gap-1.5 font-medium ${
            isMobile ? 'mt-3 py-3 rounded-xl text-sm' : 'mt-4 py-2.5 rounded-xl'
          }`}
        >
          <Plus className="w-4 h-4" />
          Añadir Evento
        </button>
        {day.events.length >= 2 && (
          <div className={`flex gap-2 ${isMobile ? 'mt-3' : 'mt-3'}`}>
            <button
              onClick={() => optimizeDayOrder(day)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600 hover:from-purple-100 hover:to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 dark:text-purple-400 transition-all font-medium ${
                isMobile ? 'rounded-xl text-xs' : 'rounded-xl text-sm'
              }`}
            >
              <Sparkles className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
              {isMobile ? 'Optimizar' : 'Optimizar orden'}
            </button>
            <button
              onClick={() => openDayInMaps(day)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 dark:text-blue-400 transition-all font-medium ${
                isMobile ? 'rounded-xl text-xs' : 'rounded-xl text-sm'
              }`}
            >
              <Route className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} /> {isMobile ? 'Maps' : 'Ver en Maps'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const emptyState = (
    <div className={`bg-white dark:bg-gray-800 rounded-xl text-center shadow-sm ${isMobile ? 'p-8' : 'p-8'}`}>
      <div
        className={`bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 ${isMobile ? 'w-14 h-14' : 'w-16 h-16'}`}
      >
        <Compass className={`text-blue-400 ${isMobile ? 'w-7 h-7' : 'w-8 h-8'}`} />
      </div>
      <p className={`text-gray-500 dark:text-gray-400 font-medium ${isMobile ? 'text-sm mb-1' : 'mb-2'}`}>
        {isMobile ? 'Itinerario vacío' : 'No hay días en el itinerario'}
      </p>
      <p className={`text-gray-400 mb-4 ${isMobile ? 'text-xs' : 'text-sm'}`}>Empieza añadiendo los días de tu viaje</p>
      <button onClick={onAddDayClick} className="text-blue-500 font-medium text-sm hover:underline">
        Añade el primer día
      </button>
    </div>
  );

  return (
    <>
      {trip.description && !isMobile && <p className="text-gray-600 dark:text-gray-300 mb-8">{trip.description}</p>}
      {trip.description && isMobile && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{trip.description}</p>
      )}
      <WeatherForecast trip={{ ...trip, days, members } as any} />
      <div className={`flex items-center justify-between ${isMobile ? 'mb-4 mt-4' : 'mb-6'}`}>
        <h2
          className={`font-semibold text-gray-800 dark:text-white flex items-center gap-1.5 ${isMobile ? 'text-base' : 'text-lg gap-2'}`}
        >
          <Calendar className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
          Itinerario
        </h2>
        <button
          onClick={onAddDayClick}
          className={`flex items-center gap-1 text-blue-500 font-medium ${isMobile ? 'text-sm' : 'hover:underline'}`}
        >
          <Plus className="w-4 h-4" />
          Añadir Día
        </button>
      </div>

      {days.length === 0 ? (
        emptyState
      ) : (
        <div className={isMobile ? 'space-y-3' : 'space-y-6 w-full'}>{days.map(renderDayCard)}</div>
      )}
    </>
  );
}
