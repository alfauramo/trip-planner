import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, FileText, ExternalLink, Edit2, Trash2, Clock, MapIcon, Euro } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { eventTypes } from './EventHelpers';
import { type TripEvent } from '../types';

export function SortableEvent({
  event,
  onEdit,
  onAddDetails,
  onDelete,
  onOpenMaps,
  isMobile,
}: {
  event: TripEvent;
  onEdit: () => void;
  onAddDetails: () => void;
  onDelete: () => void;
  onOpenMaps?: () => void;
  isMobile: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeConfig = eventTypes.find((t) => t.value === event.event_type) || eventTypes[0];
  const EventIcon = typeConfig.icon;

  const hasDetails =
    event.cost_amount ||
    event.address ||
    event.google_maps_url ||
    event.booking_reference ||
    event.participants?.length ||
    event.notes;

  if (isMobile) {
    return (
      <div ref={setNodeRef} style={style} className="flex items-start gap-3 pl-0 event-card relative">
        <div className="timeline-line" />
        <div className="flex flex-col items-center pt-1.5">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-400"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${typeConfig.color}`}>
            <EventIcon className="w-4 h-4" />
          </div>
        </div>
        <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-semibold text-gray-800 dark:text-white text-sm">{event.name}</p>
                {event.booking_status === 'confirmed' && (
                  <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium">
                    Confirmado
                  </span>
                )}
                {event.booking_status === 'paid' && (
                  <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-medium">
                    Pagado
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                {event.start_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {event.start_time}
                    {event.end_time && `-${event.end_time}`}
                  </span>
                )}
                {event.address && <span className="truncate max-w-[140px]">{event.address}</span>}
                {event.cost_amount && event.cost_amount > 0 && (
                  <span>
                    {event.cost_amount}€{!event.cost_paid && '*'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-50 dark:border-gray-700/50">
            <button
              onClick={onAddDetails}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <FileText className="w-3 h-3" />
              {hasDetails ? 'Detalles' : 'Completar'}
            </button>
            {event.google_maps_url && (
              <button
                onClick={onOpenMaps}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Maps
              </button>
            )}
            <button
              onClick={onEdit}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              Editar
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-auto"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-4 event-card group relative">
      <div className="timeline-line" />
      <div className="flex flex-col items-center pt-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-400 mb-1"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${typeConfig.color}`}>
          <EventIcon className="w-5 h-5" />
        </div>
        {event.start_time && (
          <span className="text-[11px] font-medium text-gray-400 mt-1.5 whitespace-nowrap">{event.start_time}</span>
        )}
      </div>
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 group-hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-gray-800 dark:text-white">{event.name}</h4>
              {event.booking_status === 'confirmed' && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                  Confirmado
                </span>
              )}
              {event.booking_status === 'paid' && (
                <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">Pagado</span>
              )}
              {event.event_type === 'transport' && event.end_time && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                  {event.start_time} - {event.end_time}
                </span>
              )}
            </div>
            {event.address && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                <MapIcon className="w-3.5 h-3.5 shrink-0" />
                {event.address}
              </p>
            )}
            {event.notes && <p className="text-sm text-gray-400 dark:text-gray-500 mt-1.5 italic">"{event.notes}"</p>}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              {event.cost_amount && event.cost_amount > 0 && (
                <span className="flex items-center gap-1">
                  <Euro className="w-3 h-3" /> {event.cost_amount} {event.cost_currency}
                  {!event.cost_paid && <span className="text-yellow-500">(pendiente)</span>}
                </span>
              )}
              {event.booking_reference && (
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Ref: {event.booking_reference}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {event.google_maps_url && (
              <Tooltip content="Google Maps">
                <button
                  onClick={onOpenMaps}
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </Tooltip>
            )}
            <Tooltip content={hasDetails ? 'Detalles' : 'Añadir detalles'}>
              <button
                onClick={onAddDetails}
                className={`p-2 rounded-lg transition-all ${
                  hasDetails
                    ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                    : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                <FileText className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip content="Editar">
              <button
                onClick={onEdit}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip content="Eliminar">
              <button
                onClick={onDelete}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
