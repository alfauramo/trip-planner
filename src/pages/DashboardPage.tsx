import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NewTripForm } from '../components/NewTripForm';
import { Plus, Calendar, LogOut, Plane, ArrowRight, Share2, Compass, RefreshCw, Trash2 } from 'lucide-react';
import { type TripMember } from '../types';
import { useTrips } from '../hooks/useTrips';
import { useAuth } from '../context/AuthContext';
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
import { useToast } from '../components/Toast';

export function DashboardPage() {
  const { trips, loading, deleteTrip, fetchTrips: refreshTrips } = useTrips();
  const { signOut, user, profile } = useAuth();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { showToast } = useToast();
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
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleShare = async (trip: { id: string; title: string; description?: string }) => {
    const url = `${window.location.origin}/trip-planner/trips/${trip.id}`;
    const shareData = { title: trip.title, text: trip.description || `Viaje: ${trip.title}`, url };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        hapticLight();
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Enlace copiado al portapapeles');
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
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
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
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="shrink-0 px-3 py-1.5 bg-white text-blue-600 rounded-lg text-xs font-medium"
            >
              Ir
            </button>
          </div>
        )}

        <div ref={containerRef} className="flex-1 overflow-y-auto">
          <div className="relative">
            {pullDistance > 0 && (
              <div
                className="flex items-center justify-center py-3 text-blue-500"
                style={{ height: Math.min(pullDistance, 60) }}
              >
                <RefreshCw
                  className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                  style={{ transform: `rotate(${pullDistance * 3}deg)` }}
                />
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
                    onClick={() => {
                      hapticMedium();
                      setShowNewTrip(true);
                    }}
                    className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
                  >
                    <Plus className="w-5 h-5" />
                    Crear Viaje
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {trips.map((trip) => (
                    <SwipeableRow key={trip.id} onDelete={() => handleDeleteTrip(trip.id)} disabled={!isMobile}>
                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden card-hover">
                        <Link to={`/trips/${trip.id}`} className="block" onClick={() => hapticLight()}>
                          <div className="relative h-36 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                            {trip.cover_image ? (
                              <img
                                src={trip.cover_image}
                                alt={trip.title}
                                loading="lazy"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Plane className="w-12 h-12 text-white/30" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            {(trip.start_date || trip.end_date) && (
                              <div className="date-badge">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {trip.start_date && formatDate(trip.start_date)}
                                {trip.start_date && trip.end_date && ' - '}
                                {trip.end_date && formatDate(trip.end_date)}
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-800 dark:text-white">{trip.title}</h3>
                            {trip.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                                {trip.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-3">
                              <div>
                                {trip.trip_members && trip.trip_members.length > 0 && (
                                  <div className="avatar-stack">
                                    {trip.trip_members.slice(0, 4).map((m: TripMember, i: number) => (
                                      <div
                                        key={i}
                                        className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-medium shadow-sm"
                                      >
                                        {(m.email || '?').charAt(0).toUpperCase()}
                                      </div>
                                    ))}
                                    {trip.trip_members.length > 4 && (
                                      <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[10px] font-medium text-gray-500 dark:text-gray-300 shadow-sm">
                                        +{trip.trip_members.length - 4}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                            </div>
                          </div>
                        </Link>
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
          onClick={() => {
            hapticMedium();
            setShowNewTrip(true);
          }}
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
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    loading="lazy"
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
                  {displayName}
                </span>
              </button>
            </Tooltip>
            <Tooltip content="Cerrar sesión">
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
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
            type="button"
            onClick={() => {
              hapticMedium();
              setShowNewTrip(true);
            }}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
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
            <button
              type="button"
              onClick={() => setShowNewTrip(true)}
              className="text-blue-500 hover:underline font-medium"
            >
              Crea tu primer viaje
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden card-hover group"
              >
                <Link to={`/trips/${trip.id}`} className="block">
                  <div className="relative aspect-video bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                    {trip.cover_image ? (
                      <img
                        src={trip.cover_image}
                        alt={trip.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Plane className="w-16 h-16 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {(trip.start_date || trip.end_date) && (
                      <div className="date-badge">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {trip.start_date && formatDate(trip.start_date)}
                        {trip.start_date && trip.end_date && ' - '}
                        {trip.end_date && formatDate(trip.end_date)}
                      </div>
                    )}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleShare(trip);
                        }}
                        aria-label="Compartir"
                        className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg text-gray-600 dark:text-gray-300 hover:text-blue-500 backdrop-blur-sm"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteTrip(trip.id);
                        }}
                        aria-label="Eliminar viaje"
                        className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg text-gray-600 dark:text-gray-300 hover:text-red-500 backdrop-blur-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{trip.title}</h3>
                    {trip.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{trip.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        {trip.trip_members && trip.trip_members.length > 0 && (
                          <div className="avatar-stack">
                            {trip.trip_members.slice(0, 4).map((m: TripMember, i: number) => (
                              <div
                                key={i}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium shadow-sm"
                              >
                                {(m.email || '?').charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {trip.trip_members.length > 4 && (
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-300 shadow-sm">
                                +{trip.trip_members.length - 4}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                    </div>
                  </div>
                </Link>
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
