import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, MapPin, Calendar, LogOut, Plane } from 'lucide-react';
import { useTrips } from '../hooks/useTrips';
import { useAuth } from '../context/AuthContext';
import { CoverSelector } from '../components/CoverSelector';
import { useConfirm } from '../components/ConfirmModal';
import { LoadingCard } from '../components/Loading';
import { Tooltip } from '../components/Tooltip';
import { Footer } from '../components/Footer';
import { NotificationBell } from '../components/NotificationBell';
import { ThemeToggle } from '../components/ThemeToggle';

export function DashboardPage() {
  const { trips, loading, deleteTrip } = useTrips();
  const { signOut, user, profile } = useAuth();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const [showNewTrip, setShowNewTrip] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('justRegistered') === 'true') {
      sessionStorage.removeItem('justRegistered');
      navigate('/profile', { replace: true });
    }
  }, [profile]);

  const profileIncomplete = profile && !profile.full_name && !profile.alias;

  const handleLogout = async () => {
    await signOut();
  };

  const displayName = profile?.alias || profile?.full_name || user?.email?.split('@')[0] || 'Usuario';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Plane className="w-8 h-8 text-blue-500" />
            <span className="ml-2 text-xl font-bold text-gray-800 dark:text-white">Trip Planner</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <ThemeToggle />
            <Tooltip content="Mi perfil">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">{displayName}</span>
              </button>
            </Tooltip>
            <Tooltip content="Cerrar sesión">
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </Tooltip>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8">
        {profileIncomplete && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 mb-6 flex items-center justify-between text-white">
            <div>
              <p className="font-medium">¡Completa tu perfil!</p>
              <p className="text-sm opacity-80">Añade tu nombre para que tus compañeros te reconozcan</p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Ir al perfil
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Mis Viajes</h1>
          <button
            onClick={() => setShowNewTrip(true)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Viaje
          </button>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <LoadingCard />
            <LoadingCard />
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">Aún no tienes viajes planificados</p>
            <button
              onClick={() => setShowNewTrip(true)}
              className="text-blue-500 hover:underline"
            >
              Crea tu primer viaje
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <Link to={`/trips/${trip.id}`} className="block">
                  {trip.cover_image ? (
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <img
                        src={trip.cover_image}
                        alt={trip.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <Plane className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{trip.title}</h3>
                        {trip.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{trip.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                      {(trip.start_date || trip.end_date) && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {trip.start_date && formatDate(trip.start_date)}
                            {trip.start_date && trip.end_date && ' - '}
                            {trip.end_date && formatDate(trip.end_date)}
                          </span>
                        </div>
                      )}
                      {trip.trip_members && trip.trip_members.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span>{trip.trip_members.length}</span>
                          <span className="text-xs">miembro(es)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="border-t dark:border-gray-700 px-5 py-3 flex justify-end">
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      if (await confirm('¿Estás seguro de eliminar este viaje?')) {
                        deleteTrip(trip.id);
                      }
                    }}
                    className="text-sm text-red-500 dark:text-red-400 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {showNewTrip && <NewTripModal onClose={() => setShowNewTrip(false)} />}
    </div>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const tripSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.end_date) >= new Date(data.start_date);
  }
  return true;
}, {
  message: 'La fecha fin no puede ser anterior a la fecha de inicio',
  path: ['end_date'],
});

type TripForm = z.infer<typeof tripSchema>;

function NewTripModal({ onClose }: { onClose: () => void }) {
  const { createTrip } = useTrips();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [coverImage, setCoverImage] = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting, isValid } } = useForm<TripForm>({
    resolver: zodResolver(tripSchema),
    mode: 'onChange',
  });

  const startDate = watch('start_date');

  const onSubmit = async (data: TripForm) => {
    try {
      setError('');
      const tripData = {
        title: data.title,
        description: data.description || undefined,
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
        cover_image: coverImage || undefined,
      };
      const trip = await createTrip(tripData);
      if (trip) {
        navigate(`/trips/${trip.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear el viaje');
    }
  };

  const handleCoverChange = (url: string) => {
    setCoverImage(url);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Nuevo Viaje</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título del viaje <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Viaje a China"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Cuéntanos sobre tu viaje..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio (año)</label>
              <input
                {...register('start_date')}
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin (año)</label>
              <input
                {...register('end_date')}
                type="date"
                min={startDate || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.end_date && (
                <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <CoverSelector
            value={coverImage}
            onChange={handleCoverChange}
          />

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creando...' : 'Crear Viaje'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
