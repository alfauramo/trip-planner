import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Share2, Plane, Pencil, ImageIcon, LogOut,
  Calendar, Receipt, Users, CheckSquare, Package, MapIcon, Clock
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { Tooltip } from './Tooltip';
import { ExportTripPDF } from './ExportTripPDF';

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
  trip, activeTab, onTabChange, isMobile, displayName, profile,
  onLogout, onEditTrip, onEditCover, members, days
}: {
  trip: { id: string; title: string; description?: string; start_date?: string; end_date?: string; cover_image?: string };
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

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const handleShare = () => {
    const url = `${window.location.origin}/trip-planner/trips/${trip.id}`;
    if (navigator.share) navigator.share({ title: trip.title, url }).catch(() => {});
    else navigator.clipboard.writeText(url);
  };

  if (isMobile) {
    return (
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-20">
        <div className="px-4 py-2.5 flex items-center gap-3">
          <Link to="/" className="p-1.5 -ml-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate">{trip.title}</h1>
            {(trip.start_date || trip.end_date) && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {trip.start_date && formatDateShort(trip.start_date)}
                {trip.start_date && trip.end_date && ' - '}
                {trip.end_date && formatDateShort(trip.end_date)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={handleShare} aria-label="Compartir" className="p-1.5 text-gray-500 hover:text-blue-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Share2 className="w-4 h-4" />
            </button>
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>

        {trip.cover_image && (
          <div className="relative h-36">
            <img
              src={trip.cover_image}
              alt={trip.title}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        <div className="px-4 py-1.5 flex items-center gap-1 border-t dark:border-gray-700 overflow-x-auto no-scrollbar">
          {tabConfig.map((tab) => {
            const TabIcon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                  active
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
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
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <Plane className="w-7 h-7 text-blue-500" />
            <span className="text-lg font-bold text-gray-800 dark:text-white hidden sm:block">Trip Planner</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
          <Tooltip content="Mi perfil">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} loading="lazy" className="w-8 h-8 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{displayName}</span>
            </button>
          </Tooltip>
          <Tooltip content="Cerrar sesión">
            <button type="button" onClick={onLogout} aria-label="Cerrar sesión" className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>
      </div>
      {trip.cover_image ? (
        <div className="relative h-48 md:h-56">
          <img src={trip.cover_image} alt={trip.title} loading="lazy" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="max-w-4xl mx-auto flex items-center gap-4">
              <Link to="/" className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm">
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">{trip.title}</h1>
                {(trip.start_date || trip.end_date) && (
                  <p className="text-white/80 text-sm">
                    {trip.start_date && formatDateShort(trip.start_date)}
                    {trip.start_date && trip.end_date && ' - '}
                    {trip.end_date && formatDateShort(trip.end_date)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">{trip.title}</h1>
            {(trip.start_date || trip.end_date) && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {trip.start_date && formatDateShort(trip.start_date)}
                {trip.start_date && trip.end_date && ' - '}
                {trip.end_date && formatDateShort(trip.end_date)}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-2">
        <button
          type="button"
          onClick={onEditTrip}
          aria-label="Editar viaje"
          className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Pencil className="w-4 h-4" />
          <span className="hidden sm:inline">Editar viaje</span>
        </button>
        <button
          type="button"
          onClick={onEditCover}
          aria-label="Editar portada"
          className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ImageIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Portada</span>
        </button>
        <ExportTripPDF trip={{ ...trip, days, members } as any} />
      </div>

      <div className="max-w-4xl mx-auto px-4 flex border-t overflow-x-auto no-scrollbar">
        {tabConfig.map((tab) => {
          const TabIcon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors shrink-0 ${
                active
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              <span className="font-medium whitespace-nowrap">{tab.label}</span>
              {tab.key === 'members' && members.length > 0 && (
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-1.5 py-0.5 rounded-full">{members.length}</span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
