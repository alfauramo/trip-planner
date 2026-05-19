import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { NewTripForm } from '../components/NewTripForm';
import { Plus, Calendar, Plane, Share2, RefreshCw, Trash2, Search, Clock } from 'lucide-react';
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
import { Modal } from '../components/Modal';
import { SwipeableRow } from '../components/SwipeableRow';
import { useIsMobile } from '../hooks/useMediaQuery';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { hapticLight, hapticMedium } from '../lib/haptic';
import { useToast } from '../components/Toast';
import { formatDate } from '../lib/date-utils';
import { ImageWithFallback } from '../components/ImageWithFallback';

function getTripStatus(
  startDate?: string,
  endDate?: string,
  t?: (key: string, opts?: Record<string, unknown>) => string,
): { label: string; color: string } | null {
  if (!startDate && !endDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (end && now > end)
    return {
      label: t?.('trip.status.past') || 'Finalizado',
      color: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
    };
  if (start && now >= start)
    return {
      label: t?.('trip.status.ongoing') || 'En curso',
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    };
  if (start && now < start) {
    const daysUntil = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 7)
      return {
        label: t?.('trip.status.upcomingSoon', { days: daysUntil }) || `In ${daysUntil} days`,
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      };
    return {
      label: t?.('trip.status.upcoming') || 'Upcoming',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
  }
  return null;
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { trips, loading, error, deleteTrip, fetchTrips: refreshTrips } = useTrips();
  const { user, profile } = useAuth();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { showToast } = useToast();
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  useKeyboardShortcuts(
    useMemo(
      () => [
        {
          key: 'n',
          ctrl: true,
          handler: () => {
            hapticMedium();
            setShowNewTrip(true);
          },
          description: t('trip.new'),
        },
        { key: 'Escape', handler: () => setShowNewTrip(false), description: t('shortcuts.closeSheets') || 'Cerrar' },
        {
          key: '/',
          ctrl: true,
          handler: () => setShowKeyboardHelp((prev) => !prev),
          description: t('shortcuts.help') || 'Mostrar atajos',
        },
      ],
      [t],
    ),
  );

  const filteredTrips = useMemo(() => {
    if (!searchQuery.trim()) return trips;
    const q = searchQuery.toLowerCase();
    return trips.filter(
      (t) => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)),
    );
  }, [trips, searchQuery]);

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

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      <Helmet>
        <title>Mis Viajes | Trip Planner</title>
      </Helmet>
      <header className="nav-header">
        <div className="px-4 py-3 flex items-center justify-between sm:hidden">
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
        <div className="nav-header-inner hidden sm:flex">
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

      {profileIncomplete && (
        <div className="profile-banner mx-4 mt-4 sm:mt-0 sm:mb-10 sm:max-w-6xl sm:mx-auto sm:px-4 md:px-6">
          <div className="flex-1 min-w-0">
            <p className="profile-banner-text sm:font-semibold">{t('auth.completeProfile')}</p>
            <p className="profile-banner-desc sm:mt-0.5">
              <span className="sm:hidden">{t('auth.completeProfile.desc')}</span>
              <span className="hidden sm:inline">{t('auth.completeProfile.descAlt')}</span>
            </p>
          </div>
          <button type="button" onClick={() => navigate('/profile')} className="profile-banner-btn">
            <span className="sm:hidden">{t('common.go')}</span>
            <span className="hidden sm:inline">{t('auth.goToProfile')}</span>
          </button>
        </div>
      )}

      <div ref={containerRef} className="flex-1 overflow-y-auto sm:overflow-visible">
        <div className="relative">
          {pullDistance > 0 && (
            <div
              className="flex items-center justify-center py-3 text-emerald-500 sm:hidden"
              style={{ height: Math.min(pullDistance, 60) }}
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                style={{ transform: `rotate(${pullDistance * 3}deg)` }}
              />
            </div>
          )}

          <main className="px-4 pt-6 pb-24 sm:page-container sm:py-10 sm:w-full">
            <div className="flex items-center justify-between mb-6 sm:mb-10">
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
                className="hidden sm:flex btn-primary"
              >
                <Plus className="w-5 h-5" /> {t('trip.new')}
              </button>
            </div>

            {trips.length > 3 && (
              <div className="relative mb-4 sm:mb-6 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  className="input pl-9"
                  placeholder={t('trip.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}

            {loading ? (
              <>
                <div className="space-y-4 sm:hidden">
                  <LoadingCard variant="compact" />
                  <LoadingCard variant="compact" />
                </div>
                <div className="hidden sm:grid gap-6 md:grid-cols-2">
                  <LoadingCard />
                  <LoadingCard />
                </div>
              </>
            ) : error ? (
              <div className="error-page">
                <p className="error-message">{t('trip.error')}</p>
                <button type="button" onClick={() => refreshTrips()} className="btn-primary">
                  <RefreshCw className="w-5 h-5" /> {t('common.retry')}
                </button>
              </div>
            ) : trips.length === 0 ? (
              <div className="card p-6 text-center space-y-5">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                  <Plane className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{t('onboarding.title')}</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-300 mt-1">{t('onboarding.subtitle')}</p>
                </div>
                <div className="space-y-2 text-left max-w-xs mx-auto">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-emerald-600 text-lg">1</span>
                    <span className="text-stone-700 dark:text-stone-200">{t('onboarding.step1')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-emerald-600 text-lg">2</span>
                    <span className="text-stone-700 dark:text-stone-200">{t('onboarding.step2')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-emerald-600 text-lg">3</span>
                    <span className="text-stone-700 dark:text-stone-200">{t('onboarding.step3')}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    hapticMedium();
                    setShowNewTrip(true);
                  }}
                  className="btn-primary px-8 py-3.5"
                >
                  <Plus className="w-5 h-5" />
                  {t('onboarding.createFirst')}
                </button>
              </div>
            ) : (
              <>
                {/* Mobile trip cards */}
                <div className="space-y-4 sm:hidden">
                  {filteredTrips.map((trip) => (
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
                              <div className="flex items-center gap-2">
                                <h3 className="card-title">{trip.title}</h3>
                                {getTripStatus(trip.start_date, trip.end_date, t) && (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${getTripStatus(trip.start_date, trip.end_date, t)!.color}`}
                                  >
                                    <Clock className="w-2.5 h-2.5" />
                                    {getTripStatus(trip.start_date, trip.end_date, t)!.label}
                                  </span>
                                )}
                              </div>
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

                {/* Desktop trip cards */}
                <div className="hidden sm:grid gap-6 md:grid-cols-2">
                  {filteredTrips.map((trip) => (
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
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="section-title">{trip.title}</h3>
                            {getTripStatus(trip.start_date, trip.end_date, t) && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${getTripStatus(trip.start_date, trip.end_date, t)!.color}`}
                              >
                                <Clock className="w-2.5 h-2.5" />
                                {getTripStatus(trip.start_date, trip.end_date, t)!.label}
                              </span>
                            )}
                          </div>
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
              </>
            )}
          </main>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          hapticMedium();
          setShowNewTrip(true);
        }}
        aria-label={t('trip.new')}
        className="btn-fab right-5 bottom-28 sm:hidden"
        style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <Plus className="w-6 h-6" />
      </button>

      <div className="hidden sm:block">
        <Footer />
      </div>

      {showNewTrip && (
        <BottomSheet title={t('trip.new')} onClose={() => setShowNewTrip(false)}>
          <NewTripForm />
        </BottomSheet>
      )}

      {showKeyboardHelp && (
        <Modal title={t('shortcuts.title') || 'Atajos de teclado'} onClose={() => setShowKeyboardHelp(false)}>
          <div className="space-y-3">
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">{t('shortcuts.available')}</p>
            <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
              <span className="text-sm">{t('trip.new')}</span>
              <kbd className="px-2 py-1 text-xs bg-stone-100 dark:bg-stone-800 rounded font-mono">Ctrl+N</kbd>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
              <span className="text-sm">{t('shortcuts.closeSheets') || 'Cerrar formulario'}</span>
              <kbd className="px-2 py-1 text-xs bg-stone-100 dark:bg-stone-800 rounded font-mono">Esc</kbd>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">{t('shortcuts.help') || 'Mostrar atajos'}</span>
              <kbd className="px-2 py-1 text-xs bg-stone-100 dark:bg-stone-800 rounded font-mono">Ctrl+/</kbd>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
