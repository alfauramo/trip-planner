import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Plane, Pencil, ImageIcon, Calendar } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { Tooltip } from './Tooltip';
import { ExportTripHTML } from './ExportTripHTML';
import { useToast } from './Toast';
import { useTranslation } from 'react-i18next';
import { formatDateShort } from '../lib/date-utils';
import { ImageWithFallback } from './ImageWithFallback';
import type { TripMember, TripEvent, Day } from '../types';

export function TripDetailHeader({
  trip,
  isMobile,
  displayName,
  profile,
  onEditTrip,
  onEditCover,
  members,
  days,
}: {
  trip: {
    id: string;
    title: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    cover_image?: string;
  };
  isMobile: boolean;
  displayName: string;
  profile?: { avatar_url?: string } | null;
  onEditTrip: () => void;
  onEditCover: () => void;
  members: TripMember[];
  days: (Day & { events: TripEvent[] })[];
}) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const handleShare = () => {
    const url = `${window.location.origin}/trip-planner/trips/${trip.id}`;
    if (navigator.share) navigator.share({ title: trip.title, url }).catch(() => {});
    else {
      navigator.clipboard.writeText(url);
      showToast(t('trip.shared'));
    }
  };

  if (isMobile) {
    return (
      <div className="relative h-64 bg-stone-900">
        {trip.cover_image ? (
          <>
            <ImageWithFallback
              src={trip.cover_image}
              alt={trip.title}
              loading="lazy"
              className="w-full h-full object-cover"
              fallback={null}
            />
            <div className="absolute inset-0 hero-gradient" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center">
            <Plane className="w-20 h-20 text-white/15" />
          </div>
        )}
        <div className="absolute top-0 left-0 right-0 px-4 pt-5 flex items-center justify-between">
          <Link
            to="/"
            className="w-10 h-10 flex items-center justify-center rounded-full glass-light text-white active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              aria-label={t('common.share')}
              className="w-10 h-10 flex items-center justify-center rounded-full glass-light text-white active:scale-90 transition-transform"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <div className="glass-light rounded-full p-1.5">
              <ThemeToggle />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg leading-tight">{trip.title}</h1>
          {(trip.start_date || trip.end_date) && (
            <div className="flex items-center gap-2 mt-2">
              <Calendar className="w-4 h-4 text-white/50" />
              <p className="text-sm text-white/70 font-medium">
                {trip.start_date && formatDateShort(trip.start_date)}
                {trip.start_date && trip.end_date && ' — '}
                {trip.end_date && formatDateShort(trip.end_date)}
              </p>
            </div>
          )}
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditTrip();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 text-white/80 text-xs font-medium backdrop-blur-sm active:bg-white/25"
            >
              <Pencil className="w-3 h-3" />
              {t('trip.edit')}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditCover();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 text-white/80 text-xs font-medium backdrop-blur-sm active:bg-white/25"
            >
              <ImageIcon className="w-3 h-3" />
              {t('trip.cover')}
            </button>
          </div>
          {trip.description && <p className="text-xs text-white/50 mt-2 line-clamp-1">{trip.description}</p>}
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="nav-header">
        <div className="nav-header-inner">
          <Link to="/" className="nav-brand">
            <div className="nav-logo">
              <Plane className="nav-logo-icon" />
            </div>
            <span className="nav-title">{t('app.name')}</span>
          </Link>
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

      <div className="relative h-80 bg-stone-900">
        {trip.cover_image ? (
          <>
            <ImageWithFallback
              src={trip.cover_image}
              alt={trip.title}
              loading="lazy"
              className="w-full h-full object-cover"
              fallback={null}
            />
            <div className="absolute inset-0 hero-gradient" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center">
            <Plane className="w-28 h-28 text-white/15" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="page-container pb-8">
            <div className="flex items-start gap-5">
              <Link
                to="/"
                className="w-10 h-10 flex items-center justify-center rounded-full glass-light text-white hover:bg-white/30 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white drop-shadow-lg leading-tight">{trip.title}</h1>
                {trip.description && (
                  <p className="text-sm text-white/60 mt-2 max-w-xl leading-relaxed">{trip.description}</p>
                )}
                {(trip.start_date || trip.end_date) && (
                  <div className="flex items-center gap-2 mt-3">
                    <Calendar className="w-4 h-4 text-white/50" />
                    <p className="text-sm text-white/70 font-medium">
                      {trip.start_date && formatDateShort(trip.start_date)}
                      {trip.start_date && trip.end_date && ' — '}
                      {trip.end_date && formatDateShort(trip.end_date)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-950 border-b border-stone-100 dark:border-stone-800">
        <div className="page-container py-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={onEditTrip}
            aria-label={t('trip.edit')}
            className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400 hover:text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
          >
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">{t('trip.edit')}</span>
          </button>
          <button
            type="button"
            onClick={onEditCover}
            aria-label={t('trip.editCover')}
            className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400 hover:text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('trip.cover')}</span>
          </button>
          <ExportTripHTML trip={{ ...trip, days, members } as import('../types').TripWithDetails} />
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleShare}
            aria-label={t('common.share')}
            className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400 hover:text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common.share')}</span>
          </button>
        </div>
      </div>
    </>
  );
}
