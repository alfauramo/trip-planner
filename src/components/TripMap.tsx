import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, ExternalLink } from 'lucide-react';
import { TripEvent } from '../types';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface TripMapProps {
  events: TripEvent[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onEventClick?: (event: TripEvent) => void;
}

const defaultCenter = { lat: 40.416775, lng: -3.70379 };

const eventTypeColors: Record<string, string> = {
  activity: '#3B82F6',
  accommodation: '#8B5CF6',
  transport: '#F97316',
  restaurant: '#22C55E',
  shopping: '#EC4899',
  todo: '#EAB308',
};

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

function MapBoundsUpdater({ events }: { events: TripEvent[] }) {
  const map = useMap();

  useEffect(() => {
    const validEvents = events.filter((e) => e.latitude && e.longitude);
    if (validEvents.length > 0) {
      const bounds = L.latLngBounds(validEvents.map((e) => [e.latitude!, e.longitude!] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [events, map]);

  return null;
}

export function TripMap({ events, center, zoom = 12, onEventClick }: TripMapProps) {
  const { t } = useTranslation();
  const eventsWithCoords = useMemo(() => events.filter((e) => e.latitude && e.longitude), [events]);

  const mapCenter = useMemo(() => {
    if (center) return center;
    if (eventsWithCoords.length > 0) {
      const avgLat = eventsWithCoords.reduce((sum, e) => sum + (e.latitude || 0), 0) / eventsWithCoords.length;
      const avgLng = eventsWithCoords.reduce((sum, e) => sum + (e.longitude || 0), 0) / eventsWithCoords.length;
      return { lat: avgLat, lng: avgLng };
    }
    return defaultCenter;
  }, [eventsWithCoords, center]);

  const handleMarkerClick = (event: TripEvent) => {
    onEventClick?.(event);
  };

  if (eventsWithCoords.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-stone-100 dark:bg-stone-700 rounded-lg">
        <div className="text-center p-6">
          <MapPin className="w-12 h-12 text-stone-400 dark:text-stone-500 mx-auto mb-3" />
          <p className="text-stone-600 dark:text-stone-300 font-medium">{t('event.noLocations')}</p>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{t('event.noLocations.desc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative">
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsUpdater events={eventsWithCoords} />

        {eventsWithCoords.map((event) => (
          <Marker
            key={event.id}
            position={[event.latitude!, event.longitude!]}
            icon={createCustomIcon(eventTypeColors[event.event_type] || '#666')}
            eventHandlers={{
              click: () => handleMarkerClick(event),
            }}
          >
            <Popup>
              <div className="min-w-[180px]">
                <h3 className="font-semibold text-stone-900">{event.name}</h3>
                {event.address && <p className="text-sm text-stone-600 mt-1">{event.address}</p>}
                {event.start_time && (
                  <p className="text-sm text-stone-500 mt-1">
                    {event.start_time}
                    {event.end_time && ` - ${event.end_time}`}
                  </p>
                )}
                {event.google_maps_url && (
                  <a
                    href={event.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 mt-2"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {t('event.viewOSM')}
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="absolute top-3 left-3 bg-white dark:bg-stone-800 rounded-lg shadow-md p-3 z-[1000]">
        <div className="text-xs font-medium text-stone-600 dark:text-stone-400 mb-2">{t('event.legend')}</div>
        <div className="space-y-1">
          {Object.entries(eventTypeColors)
            .slice(0, 5)
            .map(([type, color]) => (
              <div key={type} className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="capitalize text-stone-700 dark:text-stone-300">{type}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
