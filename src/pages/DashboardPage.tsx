import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NewTripForm } from '../components/NewTripForm';
import { Plus, Calendar, Plane, Share2, Compass, RefreshCw, Trash2 } from 'lucide-react';
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
import { formatDate } from '../lib/date-utils';
import { ImageWithFallback } from '../components/ImageWithFallback';

export function DashboardPage() {
  const { t } = useTranslation();
  const { trips, loading, error, deleteTrip, fetchTrips: refreshTrips } = useTrips();
  const { user, profile } = useAuth();
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

  const displayName = profile?.alias || profile?.full_name || user?.email?.split('@')[0] || t('profile.user');

  const handleShare = async (trip: { id: string; title: string; description?: string }) => {
    const url = `${window.location.origin}/trip-planner/trips/${trip.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: trip.title,
          text: trip.description || t('trip.share.via', { title: trip.title }),
          url,
        });
        hapticLight();
      } catch {
        /* user cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showToast(t('trip.shared'));
      } catch {
        showToast(t('common.error'), 'error');
      }
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    hapticMedium();
    if (await confirm(t('trip.delete.confirm'))) {
      deleteTrip(tripId);
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
        <header className="nav-header">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="nav-logo">
                <Plane className="nav-logo-icon" />
              </div>
              <span className="nav-title">{t('app.name')}</span>
            </div>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {profileIncomplete && (
          <div className="profile-banner mx-4 mt-4">
            <div className="flex-1 min-w-0">
              <p className="profile-banner-text">{t('auth.completeProfile')}</p>
              <p className="profile-banner-desc">{t('auth.completeProfile.desc')}</p>
            </div>
            <button type="button" onClick={() => navigate('/profile')} className="profile-banner-btn">
              {t('common.go')}
            </button>
          </div>
        )}

        <div ref={containerRef} className="flex-1 overflow-y-auto">
          <div className="relative">
            {pullDistance > 0 && (
              <div
                className="flex items-center justify-center py-3 text-emerald-500"
                style={{ height: Math.min(pullDistance, 60) }}
              >
                <RefreshCw
                  className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                  style={{ transform: `rotate(${pullDistance * 3}deg)` }}
                />
              </div>
            )}
            <div className="px-4 pt-6 pb-24">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="page-title">{t('trip.myTrips')}</h1>
                  <p className="page-subtitle">{t('trip.count', { count: trips.length })}</p>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  <LoadingCard variant="compact" />
                  <LoadingCard variant="compact" />
                </div>
              ) : error ? (
                <div className="error-page">
                  <p className="error-message">{t('trip.error')}</p>
                  <button type="button" onClick={() => refreshTrips()} className="btn-primary">
                    <RefreshCw className="w-5 h-5" /> {t('common.retry')}
                  </button>
                </div>
              ) : trips.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon-bg">
                    <Compass className="empty-state-icon text-emerald-400" />
                  </div>
                  <p className="empty-state-title">{t('trip.empty')}</p>
                  <p className="empty-state-desc">{t('trip.empty.desc')}</p>
                  <button
                    type="button"
                    onClick={() => {
                      hapticMedium();
                      setShowNewTrip(true);
                    }}
                    className="btn-primary px-8 py-3.5"
                  >
                    <Plus className="w-5 h-5" />
                    {t('trip.create')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {trips.map((trip) => (
                    <div key={trip.id} className="list-enter">
                      <SwipeableRow onDelete={() => handleDeleteTrip(trip.id)} disabled={!isMobile}>
                        <div className="card card-interactive overflow-hidden">
                          <Link to={`/trips/${trip.id}`} className="block" onClick={() => hapticLight()}>
                            <div className="relative h-40 bg-gradient-to-br from-emerald-600 to-teal-800">
                              {trip.cover_image ? (
                                <ImageWithFallback
                                  src={trip.cover_image}
                                  alt={trip.title}
                                  loading="lazy"
                                  className="w-full h-full object-cover"
                                  fallback={null}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Plane className="w-14 h-14 text-white/15" />
                                </div>
                              )}
                              <div className="trip-cover-overlay" />
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
                              <h3 className="card-title">{trip.title}</h3>
                              {trip.description && (
                                <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-1 mt-1">
                                  {trip.description}
                                </p>
                              )}
                              {trip.trip_members && trip.trip_members.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-3">
                                  <div className="avatar-stack">
                                    {trip.trip_members.slice(0, 3).map((m: TripMember, i: number) => (
                                      <div
                                        key={i}
                                        className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-[9px] font-medium shadow-sm ring-2 ring-white dark:ring-stone-900"
                                      >
                                        {(m.email || '?').charAt(0).toUpperCase()}
                                      </div>
                                    ))}
                                  </div>
                                  <span className="text-xs text-stone-400">
                                    {trip.trip_members.length} {t('trip.members')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </Link>
                        </div>
                      </SwipeableRow>
                    </div>
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
          aria-label={t('trip.new')}
          className="btn-fab right-5 bottom-28"
          style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <Plus className="w-6 h-6" />
        </button>

        {showNewTrip && (
          <BottomSheet title={t('trip.new')} onClose={() => setShowNewTrip(false)}>
            <NewTripForm />
          </BottomSheet>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      <header className="nav-header">
        <div className="nav-header-inner">
          <div className="nav-brand">
            <div className="nav-logo">
              <Plane className="nav-logo-icon" />
            </div>
            <span className="nav-title">{t('app.name')}</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            <Tooltip content={t('nav.profile')}>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
              >
                {profile?.avatar_url ? (
                  <ImageWithFallback
                    src={profile.avatar_url}
                    alt={displayName}
                    loading="lazy"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-stone-100 dark:ring-stone-700"
                    fallback={null}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium ring-2 ring-stone-100 dark:ring-stone-700">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-stone-700 dark:text-stone-200 hidden sm:block">
                  {displayName}
                </span>
              </button>
            </Tooltip>
          </div>
        </div>
      </header>

      <main className="page-container flex-1 py-10 w-full">
        {profileIncomplete && (
          <div className="profile-banner mb-10">
            <div>
              <p className="profile-banner-text font-semibold">{t('auth.completeProfile')}</p>
              <p className="profile-banner-desc mt-0.5">{t('auth.completeProfile.descAlt')}</p>
            </div>
            <button onClick={() => navigate('/profile')} className="profile-banner-btn">
              {t('auth.goToProfile')}
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="page-title">{t('trip.myTrips')}</h1>
            <p className="page-subtitle">{t('trip.count', { count: trips.length })}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              hapticMedium();
              setShowNewTrip(true);
            }}
            className="btn-primary"
          >
            <Plus className="w-5 h-5" /> {t('trip.new')}
          </button>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <LoadingCard />
            <LoadingCard />
          </div>
        ) : error ? (
          <div className="error-page">
            <p className="error-message">{t('trip.error')}</p>
            <button type="button" onClick={() => refreshTrips()} className="btn-primary">
              <RefreshCw className="w-5 h-5" /> {t('common.retry')}
            </button>
          </div>
        ) : trips.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon-bg">
              <Compass className="empty-state-icon text-emerald-400" />
            </div>
            <p className="empty-state-title">{t('trip.empty.descAlt')}</p>
            <p className="empty-state-desc">{t('trip.empty.desc')}</p>
            <button type="button" onClick={() => setShowNewTrip(true)} className="btn-primary">
              <Plus className="w-5 h-5" /> {t('trip.create')}
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {trips.map((trip) => (
              <div key={trip.id} className="card card-interactive overflow-hidden group list-enter">
                <Link to={`/trips/${trip.id}`} className="block">
                  <div className="trip-cover aspect-[16/9]">
                    {trip.cover_image ? (
                      <ImageWithFallback
                        src={trip.cover_image}
                        alt={trip.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        fallback={null}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Plane className="w-20 h-20 text-white/15" />
                      </div>
                    )}
                    <div className="trip-cover-overlay" />
                    {(trip.start_date || trip.end_date) && (
                      <div className="date-badge">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {trip.start_date && formatDate(trip.start_date)}
                        {trip.start_date && trip.end_date && ' - '}
                        {trip.end_date && formatDate(trip.end_date)}
                      </div>
                    )}
                    <div className="trip-cover-hover-actions">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleShare(trip);
                        }}
                        aria-label={t('common.share')}
                        className="p-2 bg-white/90 dark:bg-stone-800/90 rounded-xl text-stone-600 dark:text-stone-300 hover:text-emerald-500 backdrop-blur-sm"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteTrip(trip.id);
                        }}
                        aria-label={t('trip.delete.title')}
                        className="p-2 bg-white/90 dark:bg-stone-800/90 rounded-xl text-stone-600 dark:text-stone-300 hover:text-red-500 backdrop-blur-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="section-title">{trip.title}</h3>
                    {trip.description && (
                      <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {trip.description}
                      </p>
                    )}
                    {trip.trip_members && trip.trip_members.length > 0 && (
                      <div className="flex items-center gap-2 mt-4">
                        <div className="avatar-stack">
                          {trip.trip_members.slice(0, 3).map((m: TripMember, i: number) => (
                            <div
                              key={i}
                              className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-[10px] font-medium shadow-sm ring-2 ring-white dark:ring-stone-900"
                            >
                              {(m.email || '?').charAt(0).toUpperCase()}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-stone-400">
                          {trip.trip_members.length} {t('trip.members')}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
