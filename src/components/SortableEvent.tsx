import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, FileText, ExternalLink, Edit2, Trash2, Clock, MapIcon, Euro } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { eventTypes } from './EventHelpers';
import { type TripEvent } from '../types';
import { useTranslation } from 'react-i18next';

export function SortableEvent({
  event,
  onEdit,
  onAddDetails,
  onDelete,
  onOpenMaps,
  isViewer,
}: {
  event: TripEvent;
  onEdit: () => void;
  onAddDetails: () => void;
  onDelete: () => void;
  onOpenMaps?: () => void;
  isViewer?: boolean;
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: event.id,
    disabled: isViewer,
  });

  const style = isViewer
    ? undefined
    : {
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

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-3 sm:gap-4 pl-0 event-card group relative">
      <div className="timeline-line" />
      <div className="flex flex-col items-center pt-1.5 sm:pt-3">
        {!isViewer && (
          <button
            aria-label="Reordenar evento"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-stone-300 dark:text-stone-600 hover:text-stone-400 transition-colors duration-150 p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
        <div
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-sm ${typeConfig.color} ${isViewer ? 'mt-0' : 'mt-1'}`}
        >
          <EventIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        {event.start_time && (
          <span className="hidden sm:block text-[11px] font-medium text-stone-400 mt-1.5 whitespace-nowrap">
            {event.start_time}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 bg-white dark:bg-stone-800 rounded-xl p-3 sm:p-4 shadow-sm border border-stone-100 dark:border-stone-700 group-hover:shadow-md transition-all duration-150">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h4 className="font-semibold text-stone-800 dark:text-white text-sm sm:text-base">{event.name}</h4>
              {event.booking_status === 'confirmed' && (
                <span className="text-[10px] sm:text-xs bg-orange-100 text-orange-600 px-1.5 sm:px-2 py-0.5 rounded sm:rounded-full font-medium">
                  {t('common.confirmed')}
                </span>
              )}
              {event.booking_status === 'paid' && (
                <span className="text-[10px] sm:text-xs bg-green-100 text-green-600 px-1.5 sm:px-2 py-0.5 rounded sm:rounded-full font-medium">
                  {t('common.paid')}
                </span>
              )}
              {event.event_type === 'transport' && event.end_time && (
                <span className="hidden sm:inline text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                  {event.start_time} - {event.end_time}
                </span>
              )}
            </div>
            {/* Mobile compact info row */}
            <div className="sm:hidden flex items-center gap-2 mt-1 text-xs text-stone-500">
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
            {/* Desktop address */}
            {event.address && (
              <p className="hidden sm:flex text-sm text-stone-500 dark:text-stone-400 mt-1 items-center gap-1">
                <MapIcon className="w-3.5 h-3.5 shrink-0" />
                {event.address}
              </p>
            )}
            {/* Desktop notes */}
            {event.notes && (
              <p className="hidden sm:block text-sm text-stone-400 dark:text-stone-500 mt-1.5 italic">
                "{event.notes}"
              </p>
            )}
            {/* Desktop cost + reference */}
            <div className="hidden sm:flex items-center gap-3 mt-2 text-xs text-stone-400">
              {event.cost_amount && event.cost_amount > 0 && (
                <span className="flex items-center gap-1">
                  <Euro className="w-3 h-3" /> {event.cost_amount} {event.cost_currency}
                  {!event.cost_paid && <span className="text-yellow-500">{t('common.pending')}</span>}
                </span>
              )}
              {event.booking_reference && (
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" /> {t('event.reference.short')} {event.booking_reference}
                </span>
              )}
            </div>
          </div>
          {/* Desktop toolbar */}
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            {event.google_maps_url && (
              <Tooltip content={t('event.googleMaps')}>
                <button
                  onClick={onOpenMaps}
                  aria-label="Abrir en mapa"
                  className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </Tooltip>
            )}
            <Tooltip content={hasDetails ? t('event.details') : t('event.addDetails')}>
              <button
                onClick={onAddDetails}
                aria-label="Añadir detalles"
                className={`p-2 rounded-lg transition-all ${
                  hasDetails
                    ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                    : 'text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                }`}
              >
                <FileText className="w-4 h-4" />
              </button>
            </Tooltip>
            {!isViewer && (
              <>
                <Tooltip content={t('common.edit')}>
                  <button
                    onClick={onEdit}
                    aria-label="Editar evento"
                    className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip content={t('common.delete')}>
                  <button
                    onClick={onDelete}
                    aria-label="Eliminar evento"
                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Tooltip>
              </>
            )}
          </div>
        </div>
        {/* Mobile action bar */}
        <div className="sm:hidden flex items-center gap-1 mt-2 pt-2 border-t border-stone-50 dark:border-stone-700/50">
          <button
            onClick={onAddDetails}
            className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all duration-150 min-h-[44px]"
          >
            <FileText className="w-3 h-3" />
            {hasDetails ? t('event.details') : t('event.complete')}
          </button>
          {event.google_maps_url && (
            <button
              onClick={onOpenMaps}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium min-h-[44px] text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all duration-150"
            >
              <ExternalLink className="w-3 h-3" />
              {t('event.maps')}
            </button>
          )}
          {!isViewer && (
            <>
              <button
                onClick={onEdit}
                className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium min-h-[44px] text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all duration-150"
              >
                <Edit2 className="w-3 h-3" />
                {t('common.edit')}
              </button>
              <button
                onClick={onDelete}
                aria-label="Eliminar evento"
                className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium min-h-[44px] text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-150 ml-auto"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
