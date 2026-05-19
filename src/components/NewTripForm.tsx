import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useTrips } from '../hooks/useTrips';
import { CoverSelector } from './CoverSelector';
import { useToast } from './Toast';

const tripSchema = z
  .object({
    title: z.string().min(1, 'El título es requerido'),
    description: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) return new Date(data.end_date) >= new Date(data.start_date);
      return true;
    },
    { message: 'La fecha fin no puede ser anterior a la fecha de inicio', path: ['end_date'] },
  );

type TripForm = z.infer<typeof tripSchema>;

export function NewTripForm() {
  const { t } = useTranslation();
  const { createTrip } = useTrips();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [error, setError] = useState('');
  const [coverImage, setCoverImage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<TripForm>({
    resolver: zodResolver(tripSchema),
    mode: 'onChange',
  });

  const startDate = watch('start_date');

  const onSubmit = async (data: TripForm) => {
    try {
      setError('');
      const trip = await createTrip({
        title: data.title,
        description: data.description || undefined,
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
        cover_image: coverImage || undefined,
      });
      if (trip) {
        showToast(t('trip.created') || 'Viaje creado');
        navigate(`/trips/${trip.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear el viaje';
      setError(msg);
      showToast(msg, 'error');
    }
  };

  return (
    <>
      {error && <div className="form-error mb-4">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="form-label">
            Título <span className="form-required">*</span>
          </label>
          <input
            {...register('title')}
            className="w-full px-4 py-3 border border-stone-300 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Ej: Viaje a China"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <label className="form-label">Descripción (opcional)</label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-4 py-3 border border-stone-300 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            placeholder="Cuéntanos sobre tu viaje..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Inicio</label>
            <input
              {...register('start_date')}
              type="date"
              className="w-full px-4 py-3 border border-stone-300 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="form-label">Fin</label>
            <input
              {...register('end_date')}
              type="date"
              min={startDate || ''}
              className="w-full px-4 py-3 border border-stone-300 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>}
          </div>
        </div>
        <CoverSelector value={coverImage} onChange={(url) => setCoverImage(url)} />
        <button type="submit" disabled={isSubmitting || !isValid} className="btn-primary w-full">
          {isSubmitting ? 'Creando...' : 'Crear Viaje'}
        </button>
      </form>
    </>
  );
}
