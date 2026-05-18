import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Calendar, LogOut, Plane, ArrowRight, Share2, Compass, RefreshCw } from 'lucide-react';
import { useTrips } from '../hooks/useTrips';
import { useAuth } from '../context/AuthContext';
import { CoverSelector } from '../components/CoverSelector';
import { useConfirm } from '../components/ConfirmModal';
import { LoadingCard } from '../components/Loading';
import { Tooltip } from '../components/Tooltip';
import { Footer } from '../components/Footer';
import { NotificationBell } from '../components/NotificationBell';
import { ThemeToggle } from '../components/ThemeToggle';
import { BottomSheet } from '../components/BottomSheet';
import { SwipeableRow } from '../components/SwipeableRow';
import { useIsMobile } from '../hooks/useMediaQuery';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { hapticLight, hapticMedium } from '../lib/haptic';

export function DashboardPage() {
  const { trips, loading, deleteTrip, fetchTrips: refreshTrips } = useTrips();
  const { signOut, user, profile } = useAuth();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showNewTrip, setShowNewTrip] = useState(false);

  const handleRefresh = useCallback(async () => {
    hapticLight();
    await refreshTrips();
  }, [refreshTrips]);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
    disabled: !isMobile || loading,
  });

  useEffect(() => {
    if (sessionStorage.getItem('justRegistered') === 'true') {
      sessionStorage.removeItem('justRegistered');
      navigate('/profile', { replace: true });
    }
  }, [profile]);

  const profileIncomplete = profile && !profile.full_name && !profile.alias;

  const handleLogout = async () => {
    hapticMedium();
    await signOut();
  };

  const displayName = profile?.alias || profile?.full_name || user?.email?.split('@')[0] || 'Usuario';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const handleShare = async (trip: any) => {
    const url = `${window.location.origin}/trip-planner/trips/${trip.id}`;
    const shareData = { title: trip.title, text: trip.description || `Viaje: ${trip.title}`, url };
    if (navigator.share) {
      try { await navigator.share(shareData); hapticLight(); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    hapticMedium();
    if (await confirm('¿Estás seguro de eliminar este viaje?')) {
      deleteTrip(tripId);
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plane className="w-6 h-6 text-blue-500" />
              <span className="text-lg font-bold text-gray-800 dark:text-white">Trip Planner</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell />
              <button type="button" onClick={handleLogout} aria-label="Cerrar sesión" className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {profileIncomplete && (
          <div className="mx-4 mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 flex items-center justify-between text-white">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">¡Completa tu perfil!</p>
              <p className="text-xs opacity-80 truncate">Añade tu nombre para que te reconozcan</p>
            </div>
            <button type="button" onClick={() => navigate('/profile')} className="shrink-0 px-3 py-1.5 bg-white text-blue-600 rounded-lg text-xs font-medium">
              Ir
            </button>
          </div>
        )}

        <div ref={containerRef} className="flex-1 overflow-y-auto">
          <div className="relative">
            {pullDistance > 0 && (
              <div className="flex items-center justify-center py-3 text-blue-500" style={{ height: Math.min(pullDistance, 60) }}>
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 3}deg)` }} />
              </div>
            )}
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-bold text-gray-800 dark:text-white">Mis Viajes</h1>
                <span className="text-sm text-gray-400">{trips.length} viajes</span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <LoadingCard variant="compact" />
                  <LoadingCard variant="compact" />
                </div>
              ) : trips.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Compass className="w-10 h-10 text-blue-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">Aún no tienes viajes</p>
                  <p className="text-sm text-gray-400 mb-6">Crea tu primer viaje y empieza a planificar</p>
              <button
                type="button"
                onClick={() => { hapticMedium(); setShowNewTrip(true); }}
                className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
              >
                <Plus className="w-5 h-5" />
                Crear Viaje
              </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {trips.map((trip) => (
                    <SwipeableRow key={trip.id} onDelete={() => handleDeleteTrip(trip.id)} disabled={!isMobile}>
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden active:scale-[0.98] transition-transform">
                        <Link to={`/trips/${trip.id}`} className="flex gap-3 p-3" onClick={() => hapticLight()}>
                          {trip.cover_image ? (
                            <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden shrink-0">
                              <img src={trip.cover_image} alt={trip.title} loading="lazy" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
                              <Plane className="w-8 h-8 text-white/50" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-800 dark:text-white truncate">{trip.title}</h3>
                            {trip.description && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{trip.description}</p>}
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                              {(trip.start_date || trip.end_date) && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {trip.start_date && formatDate(trip.start_date).split(' ').slice(0, 2).join(' ')}
                                    {trip.start_date && trip.end_date && ' - '}
                                    {trip.end_date && formatDate(trip.end_date).split(' ').slice(0, 2).join(' ')}
                                  </span>
                                </div>
                              )}
                              {trip.trip_members && trip.trip_members.length > 0 && <span>{trip.trip_members.length} miembros</span>}
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-300 dark:text-gray-600 self-center" />
                        </Link>
                        <div className="px-3 pb-2 flex justify-end gap-2">
                          <button type="button" onClick={() => handleShare(trip)} aria-label="Compartir" className="text-xs text-gray-400 hover:text-blue-500 px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => handleDeleteTrip(trip.id)} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </SwipeableRow>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { hapticMedium(); setShowNewTrip(true); }}
          aria-label="Nuevo viaje"
          className="fixed right-5 bottom-20 z-30 w-14 h-14 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all active:scale-90"
        >
          <Plus className="w-6 h-6" />
        </button>

        {showNewTrip && (
          <BottomSheet title="Nuevo Viaje" onClose={() => setShowNewTrip(false)}>
            <NewTripForm />
          </BottomSheet>
        )}
      </div>
    );
  }

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
              <button type="button" onClick={() => navigate('/profile')} className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={displayName} loading="lazy" className="w-8 h-8 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">{displayName}</span>
              </button>
            </Tooltip>
            <Tooltip content="Cerrar sesión">
              <button type="button" onClick={handleLogout} aria-label="Cerrar sesión" className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors">
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
            <button onClick={() => navigate('/profile')} className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors">Ir al perfil</button>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Mis Viajes</h1>
          <button type="button" onClick={() => { hapticMedium(); setShowNewTrip(true); }} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors">
            <Plus className="w-5 h-5" /> Nuevo Viaje
          </button>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <LoadingCard />
            <LoadingCard />
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <Compass className="w-10 h-10 text-blue-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">Aún no tienes viajes planificados</p>
            <p className="text-sm text-gray-400 mb-6">Crea tu primer viaje para empezar a organizar tu aventura</p>
            <button type="button" onClick={() => setShowNewTrip(true)} className="text-blue-500 hover:underline font-medium">Crea tu primer viaje</button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {trips.map((trip) => (
              <div key={trip.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                <Link to={`/trips/${trip.id}`} className="block">
                  {trip.cover_image ? (
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <img src={trip.cover_image} alt={trip.title} loading="lazy" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <Plane className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{trip.title}</h3>
                    {trip.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{trip.description}</p>}
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                      {(trip.start_date || trip.end_date) && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{trip.start_date && formatDate(trip.start_date)}{trip.start_date && trip.end_date && ' - '}{trip.end_date && formatDate(trip.end_date)}</span>
                        </div>
                      )}
                      {trip.trip_members && trip.trip_members.length > 0 && <span>{trip.trip_members.length} miembro(s)</span>}
                    </div>
                  </div>
                </Link>
                <div className="border-t dark:border-gray-700 px-5 py-3 flex justify-end gap-2">
                  <button type="button" onClick={() => handleShare(trip)} aria-label="Compartir" className="text-sm text-gray-400 hover:text-blue-500 transition-colors flex items-center gap-1">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => handleDeleteTrip(trip.id)} className="text-sm text-red-500 dark:text-red-400 hover:underline">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {showNewTrip && (
        <BottomSheet title="Nuevo Viaje" onClose={() => setShowNewTrip(false)}>
          <NewTripForm />
        </BottomSheet>
      )}
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
  if (data.start_date && data.end_date) return new Date(data.end_date) >= new Date(data.start_date);
  return true;
}, { message: 'La fecha fin no puede ser anterior a la fecha de inicio', path: ['end_date'] });

type TripForm = z.infer<typeof tripSchema>;

function NewTripForm() {
  const { createTrip } = useTrips();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [coverImage, setCoverImage] = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting, isValid } } = useForm<TripForm>({
    resolver: zodResolver(tripSchema), mode: 'onChange',
  });

  const startDate = watch('start_date');

  const onSubmit = async (data: TripForm) => {
    try {
      setError('');
      const trip = await createTrip({
        title: data.title, description: data.description || undefined,
        start_date: data.start_date || undefined, end_date: data.end_date || undefined,
        cover_image: coverImage || undefined,
      });
      if (trip) navigate(`/trips/${trip.id}`);
    } catch (err: any) {
      setError(err.message || 'Error al crear el viaje');
    }
  };

  return (
    <>
      {error && <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título <span className="text-red-500">*</span></label>
          <input {...register('title')} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ej: Viaje a China" />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción (opcional)</label>
          <textarea {...register('description')} rows={3} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" placeholder="Cuéntanos sobre tu viaje..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inicio</label>
            <input {...register('start_date')} type="date" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fin</label>
            <input {...register('end_date')} type="date" min={startDate || ''} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>}
          </div>
        </div>
        <CoverSelector value={coverImage} onChange={(url) => setCoverImage(url)} />
        <button type="submit" disabled={isSubmitting || !isValid} className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 active:bg-blue-700 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
          {isSubmitting ? 'Creando...' : 'Crear Viaje'}
        </button>
      </form>
    </>
  );
}
