import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  Plane,
  Pencil,
  ImageIcon,
  LogOut,
  Calendar,
  Receipt,
  Users,
  CheckSquare,
  Package,
  MapIcon,
  Clock,
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { Tooltip } from './Tooltip';
import { ExportTripPDF } from './ExportTripPDF';
import { useToast } from './Toast';

const tabConfig = [
  { key: 'itinerary', label: 'Itinerario', icon: Calendar },
  { key: 'expenses', label: 'Gastos', icon: Receipt },
  { key: 'members', label: 'Miembros', icon: Users },
  { key: 'checklist', label: 'Checklist', icon: CheckSquare },
  { key: 'packing', label: 'Equipaje', icon: Package },
  { key: 'map', label: 'Mapa', icon: MapIcon },
  { key: 'activity', label: 'Actividad', icon: Clock },
] as const;

export function TripDetailHeader({
  trip,
  activeTab,
  onTabChange,
  isMobile,
  displayName,
  profile,
  onLogout,
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
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMobile: boolean;
  displayName: string;
  profile?: { avatar_url?: string } | null;
  onLogout: () => void;
  onEditTrip: () => void;
  onEditCover: () => void;
  members: any[];
  days: any[];
}) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleShare = () => {
    const url = `${window.location.origin}/trip-planner/trips/${trip.id}`;
    if (navigator.share) navigator.share({ title: trip.title, url }).catch(() => {});
    else {
      navigator.clipboard.writeText(url);
      showToast('Enlace copiado al portapapeles');
    }
  };

  if (isMobile) {
    return (
      <header className="sticky top-0 z-20 bg-white dark:bg-gray-900">
        <div className="relative h-36 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
          {trip.cover_image && (
            <>
              <img
                src={trip.cover_image}
                alt={trip.title}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute top-0 left-0 right-0 px-4 pt-3 flex items-center justify-between">
            <Link to="/" className="p-2 -ml-2 rounded-xl bg-white/20 backdrop-blur-sm text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleShare}
                aria-label="Compartir"
                className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <ThemeToggle />
            </div>
          </div>
          <div className="absolute bottom-3 left-4 right-4">
            <h1 className="text-xl font-bold text-white drop-shadow-sm">{trip.title}</h1>
            {(trip.start_date || trip.end_date) && (
              <p className="text-sm text-white/80 mt-0.5">
                {trip.start_date && formatDateShort(trip.start_date)}
                {trip.start_date && trip.end_date && ' — '}
                {trip.end_date && formatDateShort(trip.end_date)}
              </p>
            )}
          </div>
        </div>

        <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b dark:border-gray-800">
          {tabConfig.map((tab) => {
            const TabIcon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                  active
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-800 dark:text-white">Trip Planner</span>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
          <Tooltip content="Mi perfil">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  loading="lazy"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium ring-2 ring-gray-100 dark:ring-gray-700">
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
              onClick={onLogout}
              aria-label="Cerrar sesión"
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="relative h-56 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
        {trip.cover_image && (
          <>
            <img
              src={trip.cover_image}
              alt={trip.title}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-5xl mx-auto px-4 pb-5">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white drop-shadow-sm">{trip.title}</h1>
                {trip.description && (
                  <p className="text-sm text-white/70 mt-1 max-w-xl line-clamp-1">{trip.description}</p>
                )}
                {(trip.start_date || trip.end_date) && (
                  <p className="text-sm text-white/80 mt-1">
                    {trip.start_date && formatDateShort(trip.start_date)}
                    {trip.start_date && trip.end_date && ' — '}
                    {trip.end_date && formatDateShort(trip.end_date)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        {!trip.cover_image && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Plane className="w-20 h-20 text-white/20" />
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-2 border-b dark:border-gray-800">
        <button
          type="button"
          onClick={onEditTrip}
          aria-label="Editar viaje"
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          <Pencil className="w-4 h-4" />
          <span className="hidden sm:inline">Editar viaje</span>
        </button>
        <button
          type="button"
          onClick={onEditCover}
          aria-label="Editar portada"
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          <ImageIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Portada</span>
        </button>
        <ExportTripPDF trip={{ ...trip, days, members } as any} />
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleShare}
          aria-label="Compartir"
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Compartir</span>
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 flex overflow-x-auto no-scrollbar">
        {tabConfig.map((tab) => {
          const TabIcon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all shrink-0 ${
                active
                  ? 'border-blue-500 text-blue-600 font-medium'
                  : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              <span className="whitespace-nowrap text-sm">{tab.label}</span>
              {tab.key === 'members' && members.length > 0 && (
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-1.5 py-0.5 rounded-full font-medium">
                  {members.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
