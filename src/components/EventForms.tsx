import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, MapIcon, Globe, Euro, FileText, Loader2 } from 'lucide-react';
import { type TripEvent, type Attachment } from '../types';
import { FileUploader } from './FileUploader';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { getEventAttachments } from '../lib/attachments';
import { eventTypes, getMemberDisplayName } from './EventHelpers';
import { useTranslation } from 'react-i18next';
import { useToast } from './Toast';
import i18n from '../lib/i18n';
import { CURRENCIES } from '../lib/currencies';

const placeSchema = z.object({
  name: z.string().min(1, i18n.t('errors.nameRequired')),
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

export type PlaceForm = z.infer<typeof placeSchema>;

export function AddEventForm({
  onSave,
}: {
  onSave: (data: { name: string; event_type: string; start_time?: string; end_time?: string }) => void;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
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
    <form
      onSubmit={handleSubmit(async (data) => {
        setSaving(true);
        try {
          await onSave(data);
          showToast(t('common.saved'), 'success');
        } catch {
          showToast(t('errors.save'), 'error');
        } finally {
          setSaving(false);
        }
      })}
      className="space-y-4"
    >
      <div>
        <label className="form-label">{t('event.type')}</label>
        <div className="grid grid-cols-3 gap-2">
          {eventTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => setValue('event_type', type.value)}
                className={`flex items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${selectedType === type.value ? `${type.color} border-current` : 'border-stone-200 dark:border-stone-700 hover:border-stone-300'}`}
              >
                <Icon className="w-4 h-4" /> <span className="text-xs font-medium">{type.label}</span>
              </button>
            );
          })}
        </div>
        <input type="hidden" {...register('event_type')} />
      </div>
      <div>
        <label className="form-label">
          {t('event.name')} <span className="form-required">*</span>
        </label>
        <input
          {...register('name', { required: t('errors.nameRequired') })}
          className="input"
          placeholder={
            selectedType === 'accommodation'
              ? t('event.name.accommodation')
              : selectedType === 'restaurant'
                ? t('event.name.restaurant')
                : selectedType === 'transport'
                  ? t('event.name.transport')
                  : t('event.name.activity')
          }
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">
            <Clock className="w-4 h-4 inline mr-1" />
            {t('event.start')}
          </label>
          <input {...register('start_time')} type="time" className="input" />
        </div>
        <div>
          <label className="form-label">
            <Clock className="w-4 h-4 inline mr-1" />
            {t('event.end')}
          </label>
          <input {...register('end_time')} type="time" className="input" />
        </div>
      </div>
      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('event.add')}
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
  onSave: (data: PlaceForm, payerId?: string, participants?: string[]) => void;
  onRefreshTrip?: () => void;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
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

  const handleSubmitForm = async (data: PlaceForm) => {
    setSaving(true);
    try {
      const finalData = {
        ...data,
        latitude: selectedPlace?.latitude,
        longitude: selectedPlace?.longitude,
        google_maps_url: selectedPlace?.google_maps_url || data.google_maps_url,
        address: selectedPlace?.address || data.address,
      };
      await onSave(finalData, payerId, selectedParticipants);
      showToast(t('common.saved'), 'success');
    } catch {
      showToast(t('errors.save'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4">
      <div>
        <label className="form-label">{t('event.type')}</label>
        <div className="grid grid-cols-3 gap-2">
          {eventTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => setValue('event_type', type.value)}
                className={`flex items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${selectedType === type.value ? `${type.color} border-current` : 'border-stone-200 dark:border-stone-700'}`}
              >
                <Icon className="w-4 h-4" /> <span className="text-xs font-medium">{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="form-label">{t('event.name')}</label>
        <input {...register('name')} className="input" />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">
            <Clock className="w-4 h-4 inline mr-1" />
            {t('event.start')}
          </label>
          <input {...register('start_time')} type="time" className="input" />
        </div>
        <div>
          <label className="form-label">
            <Clock className="w-4 h-4 inline mr-1" />
            {t('event.end')}
          </label>
          <input {...register('end_time')} type="time" className="input" />
        </div>
      </div>
      <div>
        <label className="form-label">{t('event.address')}</label>
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
          placeholder={t('event.searchPlace')}
        />
        <input {...register('address')} placeholder={t('event.manualAddress')} className="input mt-2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">
            <MapIcon className="w-4 h-4 inline mr-1" />
            {t('event.googleMaps')}
          </label>
          <input {...register('google_maps_url')} className="input" />
        </div>
        <div>
          <label className="form-label">
            <Globe className="w-4 h-4 inline mr-1" />
            {t('event.website')}
          </label>
          <input {...register('website_url')} className="input" />
        </div>
      </div>
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-emerald-600 hover:text-emerald-700"
      >
        {showAdvanced ? t('common.hide') : t('common.more')}
      </button>
      {showAdvanced && (
        <div className="space-y-4 pt-2 border-t dark:border-stone-700">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">
                <Euro className="w-4 h-4 inline mr-1" />
                {t('event.cost')}
              </label>
              <input {...register('cost_amount')} type="number" step="0.01" className="input" placeholder="0.00" />
            </div>
            <div>
              <label className="form-label">{t('event.currency')}</label>
              <select {...register('cost_currency')} className="input">
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="IDR">IDR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('cost_paid')} className="w-4 h-4 text-emerald-600 rounded" />
                <span className="text-sm text-stone-600 dark:text-stone-300">{t('event.paid')}</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">
                <FileText className="w-4 h-4 inline mr-1" />
                {t('event.reference')}
              </label>
              <input {...register('booking_reference')} className="input" />
            </div>
            <div>
              <label className="form-label">{t('event.status')}</label>
              <select {...register('booking_status')} className="input">
                <option value="">{t('common.noBooking')}</option>
                <option value="pending">{t('common.pending')}</option>
                <option value="confirmed">{t('common.confirmed')}</option>
                <option value="paid">{t('common.paid')}</option>
                <option value="cancelled">{t('common.cancelled')}</option>
              </select>
            </div>
          </div>
        </div>
      )}
      <div>
        <label className="form-label">{t('event.notes')}</label>
        <textarea {...register('notes')} rows={2} className="textarea" />
      </div>
      {showAdvanced && members.length > 0 && (
        <div className="space-y-4 pt-2 border-t dark:border-stone-700">
          <div>
            <label className="form-label">
              <Euro className="w-4 h-4 inline mr-1" />
              {t('event.payer')}
            </label>
            <select value={payerId} onChange={(e) => setPayerId(e.target.value)} className="input">
              <option value="">{t('common.select')}</option>
              {members.map((m) => (
                <option key={m.id} value={m.user_id || m.id}>
                  {getMemberDisplayName(m)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">{t('event.participants')}</label>
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
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-sm text-stone-600 dark:text-stone-300">{getMemberDisplayName(m)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="border-t dark:border-stone-700 pt-4">
        <FileUploader
          eventId={event.id}
          attachments={attachments}
          onAttachmentsChange={() => {
            loadAttachments();
            onRefreshTrip?.();
          }}
        />
      </div>
      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('common.save')}
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
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
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
        <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">{t('event.expense')}</h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="number"
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="input"
            />
          </div>
          <select
            value={costCurrency}
            onChange={(e) => setCostCurrency(e.target.value)}
            className="px-4 py-3 border border-stone-300 dark:border-stone-600 rounded-xl dark:bg-stone-700 dark:text-white"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={costPaid}
              onChange={(e) => setCostPaid(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <span className="text-sm text-stone-600 dark:text-stone-300">{t('event.paid')}</span>
          </label>
          {costAmount && selectedParticipants.length > 0 && (
            <span className="text-xs text-stone-500">{sharePerPerson?.toFixed(2)}€/pers.</span>
          )}
        </div>
      </div>

      {members.length > 0 && (
        <>
          <div>
            <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">{t('event.payer')}</h3>
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="w-full px-4 py-3 border border-stone-300 dark:border-stone-600 rounded-xl dark:bg-stone-700 dark:text-white"
            >
              <option value="">{t('common.select')}</option>
              {members.map((m) => (
                <option key={m.id} value={m.user_id || m.id}>
                  {getMemberDisplayName(m)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
              {t('event.participants')}
            </h3>
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
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selected ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300'}`}
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
        <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">{t('event.location')}</h3>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t('event.address')}
          className="input mb-2"
        />
        <input
          type="text"
          value={googleMapsUrl}
          onChange={(e) => setGoogleMapsUrl(e.target.value)}
          placeholder={t('event.googleMaps.url')}
          className="input"
        />
      </div>

      <div>
        <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">{t('event.booking')}</h3>
        <input
          type="text"
          value={bookingReference}
          onChange={(e) => setBookingReference(e.target.value)}
          placeholder={t('event.bookingRef')}
          className="input mb-2"
        />
        <select
          value={bookingStatus}
          onChange={(e) => setBookingStatus(e.target.value)}
          className="w-full px-4 py-3 border border-stone-300 dark:border-stone-600 rounded-xl dark:bg-stone-700 dark:text-white"
        >
          <option value="">{t('common.noBooking')}</option>
          <option value="pending">{t('common.pending')}</option>
          <option value="confirmed">{t('common.confirmed')}</option>
          <option value="paid">{t('common.paid')}</option>
          <option value="cancelled">{t('common.cancelled')}</option>
        </select>
      </div>

      <div>
        <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">{t('event.notes')}</h3>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="textarea" />
      </div>

      <button
        onClick={async () => {
          setSaving(true);
          try {
            await onSave({
              cost_amount: costAmount ? parseFloat(costAmount) : undefined,
              cost_currency: costCurrency || 'EUR',
              cost_paid: costPaid,
              payer_id: payerId || undefined,
              participants: selectedParticipants.length > 0 ? selectedParticipants : undefined,
              address: address || undefined,
              google_maps_url: googleMapsUrl || undefined,
              website_url: websiteUrl || undefined,
              booking_reference: bookingReference || undefined,
              booking_status: (bookingStatus as 'pending' | 'confirmed' | 'paid' | 'cancelled') || undefined,
              notes: notes || undefined,
            });
            showToast(t('common.saved'), 'success');
          } catch {
            showToast(t('errors.save'), 'error');
          } finally {
            setSaving(false);
          }
        }}
        disabled={saving}
        className="btn-primary w-full"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('common.save')}
      </button>
    </div>
  );
}
