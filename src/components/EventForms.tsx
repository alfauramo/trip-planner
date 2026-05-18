import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, MapIcon, Globe, Euro, FileText } from 'lucide-react';
import { type TripEvent, type Attachment } from '../types';
import { FileUploader } from './FileUploader';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { getEventAttachments } from '../lib/attachments';
import { eventTypes, getMemberDisplayName } from './EventHelpers';

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

export function AddEventForm({
  onSave,
}: {
  onSave: (data: { name: string; event_type: string; start_time?: string; end_time?: string }) => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<{ name: string; event_type: string; start_time: string; end_time: string }>({
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
              <button
                key={type.value}
                type="button"
                onClick={() => setValue('event_type', type.value)}
                className={`flex items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${selectedType === type.value ? `${type.color} border-current` : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
              >
                <Icon className="w-4 h-4" /> <span className="text-xs font-medium">{type.label}</span>
              </button>
            );
          })}
        </div>
        <input type="hidden" {...register('event_type')} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          {...register('name', { required: 'El nombre es requerido' })}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={
            selectedType === 'accommodation'
              ? 'Ej: Hotel O Malioboro'
              : selectedType === 'restaurant'
                ? 'Ej: Warung Nusantara'
                : selectedType === 'transport'
                  ? 'Ej: Vuelo Madrid-Yakarta'
                  : 'Ej: Templo Borobudur'
          }
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Clock className="w-4 h-4 inline mr-1" />
            Inicio
          </label>
          <input
            {...register('start_time')}
            type="time"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Clock className="w-4 h-4 inline mr-1" />
            Fin
          </label>
          <input
            {...register('end_time')}
            type="time"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      <button type="submit" className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600">
        Añadir
      </button>
    </form>
  );
}

export function EditEventContent({
  event,
  members,
  onSave,
  onRefreshTrip,
}: {
  event: TripEvent;
  members: {
    id: string;
    user_id?: string;
    email: string;
    profile?: { full_name?: string; alias?: string; avatar_url?: string };
  }[];
  onSave: (data: any, payerId?: string, participants?: string[]) => void;
  onRefreshTrip?: () => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [payerId, setPayerId] = useState<string>(event.payer_id || '');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(event.participants || []);
  const [selectedPlace, setSelectedPlace] = useState<{
    address: string;
    latitude?: number;
    longitude?: number;
    google_maps_url?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PlaceForm>({
    resolver: zodResolver(placeSchema),
    defaultValues: {
      name: event.name,
      address: event.address || '',
      latitude: event.latitude,
      longitude: event.longitude,
      notes: event.notes || '',
      event_type: event.event_type,
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      google_maps_url: event.google_maps_url || '',
      website_url: event.website_url || '',
      cost_amount: event.cost_amount?.toString() || '',
      cost_currency: event.cost_currency || 'EUR',
      cost_paid: event.cost_paid || false,
      booking_reference: event.booking_reference || '',
      booking_status: event.booking_status || '',
      booking_platform: event.booking_platform || '',
      booking_contact_name: event.booking_contact_name || '',
      booking_contact_phone: event.booking_contact_phone || '',
    },
  });

  const selectedType = watch('event_type');

  const loadAttachments = async () => {
    try {
      const data = await getEventAttachments(event.id);
      setAttachments(data);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    loadAttachments();
  }, []);

  const handleSubmitForm = (data: PlaceForm) => {
    const finalData = {
      ...data,
      latitude: selectedPlace?.latitude,
      longitude: selectedPlace?.longitude,
      google_maps_url: selectedPlace?.google_maps_url || data.google_maps_url,
      address: selectedPlace?.address || data.address,
    };
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
              <button
                key={type.value}
                type="button"
                onClick={() => setValue('event_type', type.value)}
                className={`flex items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${selectedType === type.value ? `${type.color} border-current` : 'border-gray-200 dark:border-gray-700'}`}
              >
                <Icon className="w-4 h-4" /> <span className="text-xs font-medium">{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
        <input
          {...register('name')}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Clock className="w-4 h-4 inline mr-1" />
            Inicio
          </label>
          <input
            {...register('start_time')}
            type="time"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Clock className="w-4 h-4 inline mr-1" />
            Fin
          </label>
          <input
            {...register('end_time')}
            type="time"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
        <PlaceAutocomplete
          value={watch('address')}
          onSelect={(place) => {
            setSelectedPlace({
              address: place.address,
              latitude: place.latitude,
              longitude: place.longitude,
              google_maps_url: place.google_maps_url,
            });
            setValue('address', place.address);
          }}
          placeholder="Buscar lugar..."
        />
        <input
          {...register('address')}
          placeholder="O escribe manualmente"
          className="w-full mt-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <MapIcon className="w-4 h-4 inline mr-1" />
            Google Maps
          </label>
          <input
            {...register('google_maps_url')}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Globe className="w-4 h-4 inline mr-1" />
            Web
          </label>
          <input
            {...register('website_url')}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-blue-500 hover:text-blue-600"
      >
        {showAdvanced ? '- Ocultar' : '+ Más opciones'}
      </button>
      {showAdvanced && (
        <div className="space-y-4 pt-2 border-t dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Euro className="w-4 h-4 inline mr-1" />
                Coste
              </label>
              <input
                {...register('cost_amount')}
                type="number"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Moneda</label>
              <select
                {...register('cost_currency')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="IDR">IDR</option>
                <option value="GBP">GBP</option>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <FileText className="w-4 h-4 inline mr-1" />
                Ref. Reserva
              </label>
              <input
                {...register('booking_reference')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
              <select
                {...register('booking_status')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sin reserva</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmado</option>
                <option value="paid">Pagado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
        <textarea
          {...register('notes')}
          rows={2}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>
      {showAdvanced && members.length > 0 && (
        <div className="space-y-4 pt-2 border-t dark:border-gray-700">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Euro className="w-4 h-4 inline mr-1" />
              Pagador
            </label>
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              {members.map((m) => (
                <option key={m.id} value={m.user_id || m.id}>
                  {getMemberDisplayName(m)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Participantes</label>
            <div className="space-y-2">
              {members.map((m) => (
                <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedParticipants.includes(m.user_id || m.id)}
                    onChange={(e) => {
                      const uid = m.user_id || m.id;
                      if (e.target.checked) setSelectedParticipants([...selectedParticipants, uid]);
                      else setSelectedParticipants(selectedParticipants.filter((id) => id !== uid));
                    }}
                    className="w-4 h-4 text-blue-500 rounded"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{getMemberDisplayName(m)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="border-t dark:border-gray-700 pt-4">
        <FileUploader
          eventId={event.id}
          attachments={attachments}
          onAttachmentsChange={() => {
            loadAttachments();
            onRefreshTrip?.();
          }}
        />
      </div>
      <button type="submit" className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600">
        Guardar
      </button>
    </form>
  );
}

export function EventDetailsContent({
  event,
  members,
  onSave,
}: {
  event: TripEvent;
  members: {
    id: string;
    user_id?: string;
    email: string;
    profile?: { full_name?: string; alias?: string; avatar_url?: string };
  }[];
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

  const sharePerPerson =
    costAmount && selectedParticipants.length > 0 ? parseFloat(costAmount) / selectedParticipants.length : null;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Gasto</h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="number"
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={costCurrency}
            onChange={(e) => setCostCurrency(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
          >
            <option value="EUR">€</option>
            <option value="USD">$</option>
            <option value="IDR">Rp</option>
            <option value="GBP">£</option>
          </select>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={costPaid}
              onChange={(e) => setCostPaid(e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded"
            />
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
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
            >
              <option value="">Seleccionar...</option>
              {members.map((m) => (
                <option key={m.id} value={m.user_id || m.id}>
                  {getMemberDisplayName(m)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Participantes</h3>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const id = m.user_id || m.id;
                const selected = selectedParticipants.includes(id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      setSelectedParticipants((prev) => (selected ? prev.filter((p) => p !== id) : [...prev, id]))
                    }
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selected ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}
                  >
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
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Dirección"
          className="w-full mb-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <input
          type="text"
          value={googleMapsUrl}
          onChange={(e) => setGoogleMapsUrl(e.target.value)}
          placeholder="URL Google Maps"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Reserva</h3>
        <input
          type="text"
          value={bookingReference}
          onChange={(e) => setBookingReference(e.target.value)}
          placeholder="Referencia"
          className="w-full mb-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={bookingStatus}
          onChange={(e) => setBookingStatus(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
        >
          <option value="">Sin reserva</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmado</option>
          <option value="paid">Pagado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      <div>
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Notas</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <button
        onClick={() =>
          onSave({
            cost_amount: costAmount ? parseFloat(costAmount) : undefined,
            cost_currency: costCurrency || 'EUR',
            cost_paid: costPaid,
            payer_id: payerId || undefined,
            participants: selectedParticipants.length > 0 ? selectedParticipants : undefined,
            address: address || undefined,
            google_maps_url: googleMapsUrl || undefined,
            website_url: websiteUrl || undefined,
            booking_reference: bookingReference || undefined,
            booking_status: (bookingStatus as any) || undefined,
            notes: notes || undefined,
          })
        }
        className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600"
      >
        Guardar
      </button>
    </div>
  );
}
