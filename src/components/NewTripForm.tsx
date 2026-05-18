import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTrips } from '../hooks/useTrips';
import { CoverSelector } from './CoverSelector';

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
  const { createTrip } = useTrips();
  const navigate = useNavigate();
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
      if (trip) navigate(`/trips/${trip.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear el viaje');
    }
  };

  return (
    <>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            {...register('title')}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Viaje a China"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción (opcional)
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Cuéntanos sobre tu viaje..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inicio</label>
            <input
              {...register('start_date')}
              type="date"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fin</label>
            <input
              {...register('end_date')}
              type="date"
              min={startDate || ''}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>}
          </div>
        </div>
        <CoverSelector value={coverImage} onChange={(url) => setCoverImage(url)} />
        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 active:bg-blue-700 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creando...' : 'Crear Viaje'}
        </button>
      </form>
    </>
  );
}
