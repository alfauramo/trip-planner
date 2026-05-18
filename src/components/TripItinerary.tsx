import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Calendar, Plus, Compass, Pencil, Trash2, GripVertical,
  Sparkles, Route, FileText, ExternalLink, Edit2,
  Clock, Euro, Globe, MapIcon, Hotel, Plane, Utensils,
  ShoppingBag, CheckSquare
} from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TripEvent, Attachment, Day } from '../types';
import { WeatherForecast } from './WeatherForecast';
import { SwipeableRow } from './SwipeableRow';
import { Tooltip } from './Tooltip';
import { FileUploader } from './FileUploader';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { supabase } from '../lib/supabase';
import { getEventAttachments } from '../lib/attachments';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmModal';

const eventTypes = [
  { value: 'activity', label: 'Actividad', icon: MapIcon, color: 'bg-blue-100 text-blue-600' },
  { value: 'accommodation', label: 'Alojamiento', icon: Hotel, color: 'bg-purple-100 text-purple-600' },
  { value: 'transport', label: 'Transporte', icon: Plane, color: 'bg-orange-100 text-orange-600' },
  { value: 'restaurant', label: 'Restaurante', icon: Utensils, color: 'bg-green-100 text-green-600' },
  { value: 'shopping', label: 'Compras', icon: ShoppingBag, color: 'bg-pink-100 text-pink-600' },
  { value: 'todo', label: 'Tarea', icon: CheckSquare, color: 'bg-yellow-100 text-yellow-600' },
] as const;

const placeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
  event_type: z.string(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  google_maps_url: z.string().optional(),
  website_url: z.string().optional(),
  cost_amount: z.string().optional(),
  cost_currency: z.string(),
  cost_paid: z.boolean(),
  booking_reference: z.string().optional(),
  booking_status: z.string().optional(),
  booking_platform: z.string().optional(),
  booking_contact_name: z.string().optional(),
  booking_contact_phone: z.string().optional(),
});

type PlaceForm = z.infer<typeof placeSchema>;

export function getMemberDisplayName(member: { profile?: { full_name?: string; alias?: string }; email: string }): string {
  if (member.profile?.full_name) return member.profile.full_name;
  if (member.profile?.alias) return member.profile.alias;
  return member.email.split('@')[0];
}

export function formatDateShort(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

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
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeConfig = eventTypes.find(t => t.value === event.event_type) || eventTypes[0];
  const EventIcon = typeConfig.icon;

  const hasDetails = event.cost_amount || event.address || event.google_maps_url ||
                     event.booking_reference || event.participants?.length || event.notes;

  if (isMobile) {
    return (
      <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl group">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-300">
          <GripVertical className="w-4 h-4" />
        </button>
        <div className={`p-1.5 rounded-lg ${typeConfig.color}`}>
          <EventIcon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-gray-800 dark:text-white text-sm truncate">{event.name}</p>
            {event.start_time && (
              <span className="shrink-0 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                {event.start_time}
              </span>
            )}
          </div>
          {event.address && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{event.address}</p>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={onAddDetails} className="p-1.5 text-gray-400 hover:text-blue-500">
            <FileText className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg group">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-300">
        <GripVertical className="w-4 h-4" />
      </button>
      <div className={`p-2 rounded-lg ${typeConfig.color}`}>
        <EventIcon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-800 dark:text-white">{event.name}</p>
          {event.start_time && (
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
              {event.start_time}{event.end_time && ` - ${event.end_time}`}
            </span>
          )}
          {event.booking_status && event.booking_status !== 'pending' && (
            <span className={`text-xs px-2 py-0.5 rounded ${
              event.booking_status === 'paid' ? 'bg-green-100 text-green-600' :
              event.booking_status === 'confirmed' ? 'bg-orange-100 text-orange-600' :
              'bg-red-100 text-red-600'
            }`}>
              {event.booking_status === 'paid' ? 'Pagado' :
               event.booking_status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
            </span>
          )}
        </div>
        {event.address && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{event.address}</p>
        )}
        {event.notes && (
          <p className="text-sm text-gray-400 mt-1">{event.notes}</p>
        )}
        {(event.cost_amount && event.cost_amount > 0) && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {event.cost_amount} {event.cost_currency} {!event.cost_paid && '(pendiente)'}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {event.google_maps_url && (
          <Tooltip content="Abrir en Google Maps">
            <button onClick={onOpenMaps} className="p-1 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="w-4 h-4" />
            </button>
          </Tooltip>
        )}
        <Tooltip content={hasDetails ? 'Ver/editar detalles' : 'Añadir detalles'}>
          <button onClick={onAddDetails} className={`p-1 opacity-0 group-hover:opacity-100 transition-opacity ${
            hasDetails ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-blue-500'
          }`}>
            <FileText className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip content="Editar nombre u hora">
          <button onClick={onEdit} className="p-1 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit2 className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip content="Eliminar evento">
          <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

export function AddDayForm({ startDate, lastDate, onSave }: { startDate?: string; lastDate?: string; onSave: (date: string, notes?: string) => void }) {
  const getDefaultDate = () => {
    if (lastDate) { const d = new Date(lastDate); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; }
    if (startDate) return startDate;
    return new Date().toISOString().split('T')[0];
  };
  const [date, setDate] = useState(getDefaultDate());
  const [notes, setNotes] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha del día</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción (opcional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" placeholder="Notas sobre este día..." />
      </div>
      <button onClick={() => onSave(date, notes || undefined)} className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 active:bg-blue-700">
        Añadir Día
      </button>
    </div>
  );
}

export function EditDayForm({ day, onSave }: { day: { id: string; date: string; notes?: string }; onSave: (updates: { date: string; notes?: string }) => void }) {
  const [date, setDate] = useState(day.date);
  const [notes, setNotes] = useState(day.notes || '');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha del día</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción (opcional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" placeholder="Notas sobre este día..." />
      </div>
      <button onClick={() => onSave({ date, notes: notes || undefined })} className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600">
        Guardar
      </button>
    </div>
  );
}

export function AddEventForm({ onSave }: { onSave: (data: { name: string; event_type: string; start_time?: string; end_time?: string }) => void }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<{ name: string; event_type: string; start_time: string; end_time: string }>({
    defaultValues: { event_type: 'activity', start_time: '', end_time: '' },
  });
  const selectedType = watch('event_type');

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de evento</label>
        <div className="grid grid-cols-3 gap-2">
          {eventTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button key={type.value} type="button" onClick={() => setValue('event_type', type.value)} className={`flex items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${selectedType === type.value ? `${type.color} border-current` : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                <Icon className="w-4 h-4" /> <span className="text-xs font-medium">{type.label}</span>
              </button>
            );
          })}
        </div>
        <input type="hidden" {...register('event_type')} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre <span className="text-red-500">*</span></label>
        <input {...register('name', { required: 'El nombre es requerido' })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={selectedType === 'accommodation' ? 'Ej: Hotel O Malioboro' : selectedType === 'restaurant' ? 'Ej: Warung Nusantara' : selectedType === 'transport' ? 'Ej: Vuelo Madrid-Yakarta' : 'Ej: Templo Borobudur'} />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Clock className="w-4 h-4 inline mr-1" />Inicio</label>
          <input {...register('start_time')} type="time" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Clock className="w-4 h-4 inline mr-1" />Fin</label>
          <input {...register('end_time')} type="time" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
      </div>
      <button type="submit" className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600">Añadir</button>
    </form>
  );
}

export function EditEventContent({ event, members, onSave, onRefreshTrip }: {
  event: TripEvent;
  members: { id: string; user_id?: string; email: string; profile?: { full_name?: string; alias?: string; avatar_url?: string } }[];
  onSave: (data: any, payerId?: string, participants?: string[]) => void;
  onRefreshTrip?: () => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [payerId, setPayerId] = useState<string>(event.payer_id || '');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(event.participants || []);
  const [selectedPlace, setSelectedPlace] = useState<{ address: string; latitude?: number; longitude?: number; google_maps_url?: string } | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PlaceForm>({
    resolver: zodResolver(placeSchema),
    defaultValues: {
      name: event.name, address: event.address || '', latitude: event.latitude, longitude: event.longitude,
      notes: event.notes || '', event_type: event.event_type, start_time: event.start_time || '',
      end_time: event.end_time || '', google_maps_url: event.google_maps_url || '', website_url: event.website_url || '',
      cost_amount: event.cost_amount?.toString() || '', cost_currency: event.cost_currency || 'EUR',
      cost_paid: event.cost_paid || false, booking_reference: event.booking_reference || '',
      booking_status: event.booking_status || '', booking_platform: event.booking_platform || '',
      booking_contact_name: event.booking_contact_name || '', booking_contact_phone: event.booking_contact_phone || '',
    },
  });

  const selectedType = watch('event_type');

  const loadAttachments = async () => {
    try { const data = await getEventAttachments(event.id); setAttachments(data); } catch (err) { console.error(err); }
  };
  useEffect(() => { loadAttachments(); }, []);

  const handleSubmitForm = (data: PlaceForm) => {
    const finalData = { ...data, latitude: selectedPlace?.latitude, longitude: selectedPlace?.longitude, google_maps_url: selectedPlace?.google_maps_url || data.google_maps_url, address: selectedPlace?.address || data.address };
    onSave(finalData, payerId, selectedParticipants);
  };

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de evento</label>
        <div className="grid grid-cols-3 gap-2">
          {eventTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button key={type.value} type="button" onClick={() => setValue('event_type', type.value)} className={`flex items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${selectedType === type.value ? `${type.color} border-current` : 'border-gray-200 dark:border-gray-700'}`}>
                <Icon className="w-4 h-4" /> <span className="text-xs font-medium">{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
        <input {...register('name')} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Clock className="w-4 h-4 inline mr-1" />Inicio</label>
          <input {...register('start_time')} type="time" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Clock className="w-4 h-4 inline mr-1" />Fin</label>
          <input {...register('end_time')} type="time" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
        <PlaceAutocomplete value={watch('address')} onSelect={(place) => { setSelectedPlace({ address: place.address, latitude: place.latitude, longitude: place.longitude, google_maps_url: place.google_maps_url }); setValue('address', place.address); }} placeholder="Buscar lugar..." />
        <input {...register('address')} placeholder="O escribe manualmente" className="w-full mt-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><MapIcon className="w-4 h-4 inline mr-1" />Google Maps</label>
          <input {...register('google_maps_url')} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Globe className="w-4 h-4 inline mr-1" />Web</label>
          <input {...register('website_url')} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
      </div>
      <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-blue-500 hover:text-blue-600">{showAdvanced ? '- Ocultar' : '+ Más opciones'}</button>
      {showAdvanced && (
        <div className="space-y-4 pt-2 border-t dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Euro className="w-4 h-4 inline mr-1" />Coste</label>
              <input {...register('cost_amount')} type="number" step="0.01" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Moneda</label>
              <select {...register('cost_currency')} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="EUR">EUR</option><option value="USD">USD</option><option value="IDR">IDR</option><option value="GBP">GBP</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('cost_paid')} className="w-4 h-4 text-blue-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Pagado</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><FileText className="w-4 h-4 inline mr-1" />Ref. Reserva</label>
              <input {...register('booking_reference')} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
              <select {...register('booking_status')} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Sin reserva</option><option value="pending">Pendiente</option><option value="confirmed">Confirmado</option><option value="paid">Pagado</option><option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
        <textarea {...register('notes')} rows={2} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
      </div>
      {showAdvanced && members.length > 0 && (
        <div className="space-y-4 pt-2 border-t dark:border-gray-700">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"><Euro className="w-4 h-4 inline mr-1" />Pagador</label>
            <select value={payerId} onChange={(e) => setPayerId(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Seleccionar...</option>
              {members.map((m) => (<option key={m.id} value={m.user_id || m.id}>{getMemberDisplayName(m)}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Participantes</label>
            <div className="space-y-2">
              {members.map((m) => (<label key={m.id} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={selectedParticipants.includes(m.user_id || m.id)} onChange={(e) => { const uid = m.user_id || m.id; if (e.target.checked) setSelectedParticipants([...selectedParticipants, uid]); else setSelectedParticipants(selectedParticipants.filter(id => id !== uid)); }} className="w-4 h-4 text-blue-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-300">{getMemberDisplayName(m)}</span>
              </label>))}
            </div>
          </div>
        </div>
      )}
      <div className="border-t dark:border-gray-700 pt-4">
        <FileUploader eventId={event.id} attachments={attachments} onAttachmentsChange={() => { loadAttachments(); onRefreshTrip?.(); }} />
      </div>
      <button type="submit" className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600">Guardar</button>
    </form>
  );
}

export function EventDetailsContent({ event, members, onSave }: {
  event: TripEvent;
  members: { id: string; user_id?: string; email: string; profile?: { full_name?: string; alias?: string; avatar_url?: string } }[];
  onSave: (updates: Partial<TripEvent>) => void;
}) {
  const [costAmount, setCostAmount] = useState(event.cost_amount?.toString() || '');
  const [costCurrency, setCostCurrency] = useState(event.cost_currency || 'EUR');
  const [costPaid, setCostPaid] = useState(event.cost_paid || false);
  const [payerId, setPayerId] = useState(event.payer_id || '');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(event.participants || []);
  const [address, setAddress] = useState(event.address || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(event.google_maps_url || '');
  const [websiteUrl] = useState(event.website_url || '');
  const [bookingReference, setBookingReference] = useState(event.booking_reference || '');
  const [bookingStatus, setBookingStatus] = useState(event.booking_status || '');
  const [notes, setNotes] = useState(event.notes || '');

  const sharePerPerson = costAmount && selectedParticipants.length > 0 ? parseFloat(costAmount) / selectedParticipants.length : null;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Gasto</h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <input type="number" value={costAmount} onChange={(e) => setCostAmount(e.target.value)} placeholder="0.00" step="0.01" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <select value={costCurrency} onChange={(e) => setCostCurrency(e.target.value)} className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white">
            <option value="EUR">€</option><option value="USD">$</option><option value="IDR">Rp</option><option value="GBP">£</option>
          </select>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={costPaid} onChange={(e) => setCostPaid(e.target.checked)} className="w-4 h-4 text-blue-500 rounded" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Pagado</span>
          </label>
          {costAmount && selectedParticipants.length > 0 && (
            <span className="text-xs text-gray-500">{sharePerPerson?.toFixed(2)}€/pers.</span>
          )}
        </div>
      </div>

      {members.length > 0 && (
        <>
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Pagador</h3>
            <select value={payerId} onChange={(e) => setPayerId(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white">
              <option value="">Seleccionar...</option>
              {members.map(m => (<option key={m.id} value={m.user_id || m.id}>{getMemberDisplayName(m)}</option>))}
            </select>
          </div>
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Participantes</h3>
            <div className="flex flex-wrap gap-2">
              {members.map(m => {
                const id = m.user_id || m.id;
                const selected = selectedParticipants.includes(id);
                return (
                  <button key={m.id} type="button" onClick={() => setSelectedParticipants(prev => selected ? prev.filter(p => p !== id) : [...prev, id])} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selected ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                    {getMemberDisplayName(m)}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div>
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Ubicación</h3>
        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección" className="w-full mb-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        <input type="text" value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} placeholder="URL Google Maps" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>

      <div>
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Reserva</h3>
        <input type="text" value={bookingReference} onChange={(e) => setBookingReference(e.target.value)} placeholder="Referencia" className="w-full mb-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        <select value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white">
          <option value="">Sin reserva</option><option value="pending">Pendiente</option><option value="confirmed">Confirmado</option><option value="paid">Pagado</option><option value="cancelled">Cancelado</option>
        </select>
      </div>

      <div>
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Notas</h3>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
      </div>

      <button onClick={() => onSave({
        cost_amount: costAmount ? parseFloat(costAmount) : undefined, cost_currency: costCurrency || 'EUR', cost_paid: costPaid,
        payer_id: payerId || undefined, participants: selectedParticipants.length > 0 ? selectedParticipants : undefined,
        address: address || undefined, google_maps_url: googleMapsUrl || undefined, website_url: websiteUrl || undefined,
        booking_reference: bookingReference || undefined, booking_status: bookingStatus as any || undefined, notes: notes || undefined,
      })} className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600">
        Guardar
      </button>
    </div>
  );
}

export function TripItinerary({
  trip, days, members, isMobile,
  onAddDayClick, onAddEventClick, onEditEventClick, onViewEventDetails,
  onEditDayClick, onDeleteDay, onDeleteEvent, onReorderEvents, onRefresh,
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

  const handleDragEnd = async (event: DragEndEvent, dayId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const day = days.find(d => d.id === dayId);
    if (!day) return;
    const oldIndex = day.events.findIndex(e => e.id === active.id);
    const newIndex = day.events.findIndex(e => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newEvents = [...day.events];
    const [movedItem] = newEvents.splice(oldIndex, 1);
    newEvents.splice(newIndex, 0, movedItem);
    await onReorderEvents(dayId, newEvents.map(e => e.id));
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
              points[current].latitude, points[current].longitude,
              points[i].latitude, points[i].longitude
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
      return order.map(idx => points[idx]);
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
    const eventsWithLocation = day.events.filter((e: any) =>
      (e.latitude && e.longitude) || e.google_maps_url || e.address
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
    <div key={day.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden ${isMobile ? '' : ''}`}>
      <div className={`bg-blue-50 dark:bg-gray-700/50 ${isMobile ? 'px-4 py-2.5' : 'px-5 py-3'} flex items-center justify-between`}>
        <div className={`${isMobile ? 'min-w-0 flex-1' : ''}`}>
          <span className={`text-blue-600 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Día {day.day_number}</span>
          <h3 className={`font-semibold text-gray-800 dark:text-white ${isMobile ? 'text-sm capitalize' : 'capitalize'}`}>
            {formatDate(day.date)}
          </h3>
          {day.notes && (
            <p className={`text-gray-500 dark:text-gray-400 ${isMobile ? 'text-xs mt-0.5 truncate' : 'text-sm mt-1'}`}>{day.notes}</p>
          )}
        </div>
        <div className={`flex items-center ${isMobile ? 'gap-0.5 shrink-0' : 'gap-1'}`}>
          {isMobile ? (
            <>
              <button onClick={() => onEditDayClick(day)} className="p-1.5 text-gray-400 hover:text-blue-500">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={async () => {
                if (await confirm('¿Eliminar este día?')) {
                  try { await onDeleteDay(day.id); showToast('Día eliminado'); } catch (err: any) { showToast(err.message || 'Error', 'error'); }
                }
              }} className="p-1.5 text-gray-400 hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <Tooltip content="Editar día">
                <button onClick={() => onEditDayClick(day)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-500 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="Eliminar día">
                <button onClick={async () => {
                  if (await confirm('¿Eliminar este día?')) {
                    try { await onDeleteDay(day.id); showToast('Día eliminado'); } catch (err: any) { showToast(err.message || 'Error al eliminar el día', 'error'); }
                  }
                }} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </Tooltip>
            </>
          )}
        </div>
      </div>
      <div className={isMobile ? 'p-3' : 'p-5'}>
        {day.events.length === 0 ? (
          <p className={`text-gray-400 dark:text-gray-500 text-center ${isMobile ? 'text-xs py-3' : 'text-sm py-4'}`}>
            {isMobile ? 'No hay eventos en este día' : 'No hay eventos añadidos a este día'}
          </p>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, day.id)}>
            <SortableContext items={day.events.map((ev: TripEvent) => ev.id)} strategy={verticalListSortingStrategy}>
              <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
                {day.events.map((event: TripEvent) => {
                  const eventContent = (
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
                  );
                  if (isMobile) {
                    return (
                      <SwipeableRow key={event.id} onDelete={async () => {
                        if (await confirm('¿Eliminar este evento?')) {
                          await onDeleteEvent(event.id, day.id);
                          showToast('Evento eliminado');
                        }
                      }}>
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
          className={`w-full border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-1.5 ${
            isMobile ? 'mt-2 py-2.5 rounded-xl text-sm' : 'mt-4 py-2 rounded-lg'
          }`}
        >
          <Plus className="w-4 h-4" />
          Añadir Evento
        </button>
        {day.events.length >= 2 && (
          <div className={`flex gap-2 ${isMobile ? 'mt-2' : 'mt-3'}`}>
            <button onClick={() => optimizeDayOrder(day)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors font-medium ${
              isMobile ? 'rounded-xl text-xs' : 'rounded-lg text-sm'
            }`}>
              <Sparkles className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} /> {isMobile ? 'Optimizar' : 'Optimizar orden'}
            </button>
            <button onClick={() => openDayInMaps(day)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium ${
              isMobile ? 'rounded-xl text-xs' : 'rounded-lg text-sm'
            }`}>
              <Route className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} /> {isMobile ? 'Maps' : 'Ver en Maps'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const emptyState = (
    <div className={`bg-white dark:bg-gray-800 rounded-xl text-center shadow-sm ${isMobile ? 'p-8' : 'p-8'}`}>
      <div className={`bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 ${isMobile ? 'w-14 h-14' : 'w-16 h-16'}`}>
        <Compass className={`text-blue-400 ${isMobile ? 'w-7 h-7' : 'w-8 h-8'}`} />
      </div>
      <p className={`text-gray-500 dark:text-gray-400 font-medium ${isMobile ? 'text-sm mb-1' : 'mb-2'}`}>
        {isMobile ? 'Itinerario vacío' : 'No hay días en el itinerario'}
      </p>
      <p className={`text-gray-400 mb-4 ${isMobile ? 'text-xs' : 'text-sm'}`}>
        {isMobile ? 'Empieza añadiendo los días de tu viaje' : 'Empieza añadiendo los días de tu viaje'}
      </p>
      <button onClick={onAddDayClick} className="text-blue-500 font-medium text-sm hover:underline">
        Añade el primer día
      </button>
    </div>
  );

  return (
    <>
      {trip.description && !isMobile && (
        <p className="text-gray-600 dark:text-gray-300 mb-8">{trip.description}</p>
      )}
      {trip.description && isMobile && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{trip.description}</p>
      )}
      <WeatherForecast trip={{ ...trip, days, members } as any} />
      <div className={`flex items-center justify-between ${isMobile ? 'mb-4 mt-4' : 'mb-6'}`}>
        <h2 className={`font-semibold text-gray-800 dark:text-white flex items-center gap-1.5 ${isMobile ? 'text-base' : 'text-lg gap-2'}`}>
          <Calendar className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
          Itinerario
        </h2>
        <button
          onClick={onAddDayClick}
          className={`flex items-center gap-1 text-blue-500 font-medium ${isMobile ? 'text-sm' : 'hover:underline'}`}
        >
          <Plus className="w-4 h-4" />
          {isMobile ? 'Añadir Día' : 'Añadir Día'}
        </button>
      </div>

      {days.length === 0 ? emptyState : (
        <div className={isMobile ? 'space-y-3' : 'space-y-6 w-full'}>
          {days.map(renderDayCard)}
        </div>
      )}
    </>
  );
}
