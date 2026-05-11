import { useState, useEffect } from 'react';
import { useConfirm } from '../components/ConfirmModal';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Calendar, MapPin, Trash2, GripVertical,
  Image as ImageIcon, Users, Pencil, Hotel, Plane, Utensils,
  ShoppingBag, CheckSquare, Map as MapIcon, Clock, Euro, FileText, Globe, Edit2,
  Receipt, ArrowRight, TrendingUp, ExternalLink, LogOut, Paperclip, ChevronDown, X, Download, Check, Route, Sparkles, Package
} from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTripDetail } from '../hooks/useTrips';
import { useTrips } from '../hooks/useTrips';
import { CoverSelector } from '../components/CoverSelector';
import { TripMembersManager } from '../components/TripMembersManager';
import { FileUploader } from '../components/FileUploader';
import { useToast } from '../components/Toast';
import { LoadingOverlay } from '../components/Loading';
import { Tooltip } from '../components/Tooltip';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TripEvent, Attachment, Day, EXPENSE_CATEGORIES, ExpenseCategory } from '../types';
import { getEventAttachments } from '../lib/attachments';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Footer } from '../components/Footer';
import { NotificationBell } from '../components/NotificationBell';
import { TripMap } from '../components/TripMap';
import { PlaceAutocomplete } from '../components/PlaceAutocomplete';
import { ExportTripPDF } from '../components/ExportTripPDF';
import { WeatherForecast } from '../components/WeatherForecast';
import { PackingList } from '../components/PackingList';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { ThemeToggle } from '../components/ThemeToggle';

const tripSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  total_budget: z.string().optional(),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.end_date) >= new Date(data.start_date);
  }
  return true;
}, {
  message: 'La fecha fin no puede ser anterior a la fecha de inicio',
  path: ['end_date'],
});

const placeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
  event_type: z.string(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  google_maps_url: z.string().optional(),
  website_url: z.string().optional(),
  cost_amount: z.string().optional(),
  cost_currency: z.string(),
  cost_paid: z.boolean(),
  booking_reference: z.string().optional(),
  booking_status: z.string().optional(),
  booking_platform: z.string().optional(),
  booking_contact_name: z.string().optional(),
  booking_contact_phone: z.string().optional(),
});

type TripForm = z.infer<typeof tripSchema>;
type PlaceForm = z.infer<typeof placeSchema>;

const eventTypes = [
  { value: 'activity', label: 'Actividad', icon: MapIcon, color: 'bg-blue-100 text-blue-600' },
  { value: 'accommodation', label: 'Alojamiento', icon: Hotel, color: 'bg-purple-100 text-purple-600' },
  { value: 'transport', label: 'Transporte', icon: Plane, color: 'bg-orange-100 text-orange-600' },
  { value: 'restaurant', label: 'Restaurante', icon: Utensils, color: 'bg-green-100 text-green-600' },
  { value: 'shopping', label: 'Compras', icon: ShoppingBag, color: 'bg-pink-100 text-pink-600' },
  { value: 'todo', label: 'Tarea', icon: CheckSquare, color: 'bg-yellow-100 text-yellow-600' },
] as const;

function SortableEvent({
  event,
  onEdit,
  onAddDetails,
  onDelete,
  onOpenMaps,
}: {
  event: TripEvent;
  onEdit: () => void;
  onAddDetails: () => void;
  onDelete: () => void;
  onOpenMaps?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeConfig = eventTypes.find(t => t.value === event.event_type) || eventTypes[0];
  const EventIcon = typeConfig.icon;

  const hasDetails = event.cost_amount || event.address || event.google_maps_url || 
                     event.booking_reference || event.participants?.length || event.notes;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg group"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-300"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className={`p-2 rounded-lg ${typeConfig.color}`}>
        <EventIcon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-800 dark:text-white">{event.name}</p>
          {event.start_time && (
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
              {event.start_time}{event.end_time && ` - ${event.end_time}`}
            </span>
          )}
          {event.booking_status && event.booking_status !== 'pending' && (
            <span className={`text-xs px-2 py-0.5 rounded ${
              event.booking_status === 'paid' ? 'bg-green-100 text-green-600' :
              event.booking_status === 'confirmed' ? 'bg-orange-100 text-orange-600' :
              'bg-red-100 text-red-600'
            }`}>
              {event.booking_status === 'paid' ? 'Pagado' :
               event.booking_status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
            </span>
          )}
        </div>
        {event.address && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{event.address}</p>
        )}
        {event.notes && (
          <p className="text-sm text-gray-400 mt-1">{event.notes}</p>
        )}
        {(event.cost_amount && event.cost_amount > 0) && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {event.cost_amount} {event.cost_currency} {!event.cost_paid && '(pendiente)'}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {event.google_maps_url && (
          <Tooltip content="Abrir en Google Maps">
            <button
              onClick={onOpenMaps}
              className="p-1 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </Tooltip>
        )}
        <Tooltip content={hasDetails ? 'Ver/editar detalles' : 'Añadir detalles'}>
          <button
            onClick={onAddDetails}
            className={`p-1 opacity-0 group-hover:opacity-100 transition-opacity ${
              hasDetails ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-blue-500'
            }`}
          >
            <FileText className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip content="Editar nombre u hora">
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip content="Eliminar evento">
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

export function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { updateTrip } = useTrips();
  const { trip, days, members, loading, error, refresh, addDay, updateDay, addEvent, updateEvent, reorderEvents, deleteEvent, deleteDay } = useTripDetail(id!);
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const { signOut, user, profile } = useAuth();
  const navigate = useNavigate();
  const [showAddDay, setShowAddDay] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<TripEvent | null>(null);
  const [editingDay, setEditingDay] = useState<{ id: string; date: string; notes?: string } | null>(null);
  const [showEditTrip, setShowEditTrip] = useState(false);
  const [showCoverEditor, setShowCoverEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'expenses' | 'members' | 'checklist' | 'map' | 'packing' | 'activity'>('itinerary');
  const [eventDetails, setEventDetails] = useState<TripEvent | null>(null);
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [showQuickAddExpense, setShowQuickAddExpense] = useState(false);

  const handleQuickAddExpense = async (dayId: string, data: any) => {
    await addEvent(dayId, data);
    refresh();
  };

  const displayName = profile?.alias || profile?.full_name || user?.email?.split('@')[0] || 'Usuario';

  const handleLogout = async () => {
    if (await confirm('¿Cerrar sesión?')) {
      await signOut();
      navigate('/');
    }
  };

  const handleDragEnd = async (event: DragEndEvent, dayId: string) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const day = days.find(d => d.id === dayId);
    if (!day) return;

    const oldIndex = day.events.findIndex(e => e.id === active.id);
    const newIndex = day.events.findIndex(e => e.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newEvents = [...day.events];
    const [movedItem] = newEvents.splice(oldIndex, 1);
    newEvents.splice(newIndex, 0, movedItem);

    // Update local state immediately and database in background
    await reorderEvents(dayId, newEvents.map(e => e.id));
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Viaje no encontrado'}</p>
          <Link to="/" className="text-blue-500 hover:underline">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const optimizeDayOrder = async (day: any) => {
    const eventsWithCoords = day.events.filter((e: any) => e.latitude && e.longitude);
    if (eventsWithCoords.length < 2) {
      showToast('Se necesitan al menos 2 eventos con ubicación', 'error');
      return;
    }

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const optimize = (points: any[]) => {
      const visited: boolean[] = new Array(points.length).fill(false);
      const order: number[] = [0];
      visited[0] = true;
      let current = 0;

      while (order.length < points.length) {
        let nearestIdx = -1;
        let nearestDist = Infinity;
        for (let i = 0; i < points.length; i++) {
          if (!visited[i]) {
            const dist = haversineDistance(
              points[current].latitude, points[current].longitude,
              points[i].latitude, points[i].longitude
            );
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestIdx = i;
            }
          }
        }
        if (nearestIdx !== -1) {
          order.push(nearestIdx);
          visited[nearestIdx] = true;
          current = nearestIdx;
        }
      }
      return order.map(idx => points[idx]);
    };

    const optimizedOrder = optimize(eventsWithCoords);
    const updates = optimizedOrder.map((event, idx) => ({
      id: event.id,
      order: idx,
    }));

    for (const update of updates) {
      await supabase.from('events').update({ order: update.order }).eq('id', update.id);
    }
    showToast('Ruta optimizada');
    refresh();
  };

  const openDayInMaps = (day: any) => {
    const eventsWithLocation = day.events.filter((e: any) => 
      (e.latitude && e.longitude) || e.google_maps_url || e.address
    );

    if (eventsWithLocation.length === 0) {
      showToast('No hay eventos con ubicación', 'error');
      return;
    }

    let mapsUrl = 'https://www.google.com/maps/dir/';

    eventsWithLocation.forEach((event: any, idx: number) => {
      if (event.latitude && event.longitude) {
        mapsUrl += `${event.latitude},${event.longitude}`;
      } else if (event.google_maps_url) {
        const match = event.google_maps_url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (match) {
          mapsUrl += `${match[1]},${match[2]}`;
        } else {
          mapsUrl += encodeURIComponent(event.name);
        }
      } else if (event.address) {
        mapsUrl += encodeURIComponent(event.address);
      }

      if (idx < eventsWithLocation.length - 1) {
        mapsUrl += '/';
      }
    });

    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
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
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{displayName}</span>
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
        {trip.cover_image ? (
          <div className="relative h-48 md:h-56">
            <img
              src={trip.cover_image}
              alt={trip.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
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
            onClick={() => setShowEditTrip(true)}
            className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">Editar viaje</span>
          </button>
          <button
            onClick={() => setShowCoverEditor(true)}
            className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Portada</span>
          </button>
          <ExportTripPDF trip={{ ...trip, days, members } as any} />
        </div>

        <div className="max-w-4xl mx-auto px-4 flex border-t">
          <button
            onClick={() => setActiveTab('itinerary')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'itinerary' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Itinerario</span>
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'expenses' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span className="font-medium">Gastos</span>
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'members' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="font-medium">Miembros</span>
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-1.5 py-0.5 rounded-full">{members.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'checklist' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span className="font-medium">Checklist</span>
          </button>
          <button
            onClick={() => setActiveTab('packing')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'packing' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <Package className="w-4 h-4" />
            <span className="font-medium">Equipaje</span>
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'map' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span className="font-medium">Mapa</span>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'activity' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="font-medium">Actividad</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
        {activeTab === 'members' ? (
          <TripMembersManager
            tripId={trip.id}
            tripTitle={trip.title}
            members={members}
            onMembersChange={refresh}
          />
        ) : activeTab === 'expenses' ? (
          <ExpensesSection 
            days={days} 
            members={members}
            onAddExpense={() => setShowQuickAddExpense(true)}
            onAddDay={() => {
              setShowAddDay(true);
              setActiveTab('itinerary');
            }}
            tripBudget={trip.total_budget}
          />
        ) : activeTab === 'checklist' ? (
          <ChecklistSection tripId={trip.id} />
        ) : activeTab === 'packing' ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <PackingList tripId={trip.id} />
          </div>
        ) : activeTab === 'map' ? (
          <div className="h-[600px] bg-white rounded-xl overflow-hidden">
            <TripMap 
              events={days.flatMap(d => d.events)} 
              onEventClick={(event) => {
                const day = days.find(d => d.id === event.day_id);
                if (day) {
                  setActiveTab('itinerary');
                  setTimeout(() => {
                    const eventElement = document.getElementById(`event-${event.id}`);
                    eventElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    eventElement?.classList.add('ring-2', 'ring-blue-500');
                    setTimeout(() => eventElement?.classList.remove('ring-2', 'ring-blue-500'), 2000);
                  }, 100);
                }
              }}
            />
          </div>
        ) : activeTab === 'activity' ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <ActivityTimeline tripId={trip.id} />
          </div>
        ) : (
          <>
            {trip.description && (
              <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300 mb-8">{trip.description}</p>
            )}

            <WeatherForecast trip={{ ...trip, days, members } as any} />

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Itinerario
              </h2>
              <button
                onClick={() => setShowAddDay(true)}
                className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium"
              >
                <Plus className="w-4 h-4" />
                Añadir Día
              </button>
            </div>

            {days.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">No hay días en el itinerario</p>
                <button
                  onClick={() => setShowAddDay(true)}
                  className="text-blue-500 hover:underline"
                >
                  Añade el primer día
                </button>
              </div>
            ) : (
              <div className="space-y-6 w-full">
                {days.map((day) => (
                  <div key={day.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-blue-50 dark:bg-gray-700/50 px-5 py-3 flex items-center justify-between">
                      <div>
                        <span className="text-sm text-blue-600 font-medium">Día {day.day_number}</span>
                        <h3 className="font-semibold text-gray-800 dark:text-white capitalize">
                          {formatDate(day.date)}
                        </h3>
                        {day.notes && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{day.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Tooltip content="Editar día">
                          <button
                            onClick={() => setEditingDay(day)}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-500 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Eliminar día">
                          <button
                            onClick={async () => {
                              if (await confirm('¿Eliminar este día?')) {
                                try {
                                  await deleteDay(day.id);
                                  showToast('Día eliminado');
                                } catch (err: any) {
                                  showToast(err.message || 'Error al eliminar el día', 'error');
                                }
                              }
                            }}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="p-5">
                      {day.events.length === 0 ? (
                        <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">
                          No hay eventos añadidos a este día
                        </p>
                      ) : (
                        <DndContext
                          collisionDetection={closestCenter}
                          onDragEnd={(e) => handleDragEnd(e, day.id)}
                        >
                          <SortableContext
                            items={day.events.map(ev => ev.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-3">
                              {day.events.map((event) => (
                                <SortableEvent
                                  key={event.id}
                                  event={event}
                                  onEdit={() => setEditingEvent(event)}
                                  onAddDetails={() => setEventDetails(event)}
                                  onDelete={async () => {
                                    if (await confirm('¿Eliminar este evento?')) {
                                      await deleteEvent(event.id, day.id);
                                      showToast('Evento eliminado');
                                    }
                                  }}
                                  onOpenMaps={() => event.google_maps_url && window.open(event.google_maps_url, '_blank')}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      )}

                      <button
                        onClick={() => setShowAddEvent(day.id)}
                        className="w-full mt-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Añadir Evento
                      </button>

                      {day.events.length >= 2 && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => optimizeDayOrder(day)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                          >
                            <Sparkles className="w-4 h-4" />
                            Optimizar orden
                          </button>
                          <button
                            onClick={() => openDayInMaps(day)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                          >
                            <Route className="w-4 h-4" />
                            Ver en Maps
                          </button>
                        </div>
                      )}

                      {(() => {
                        const dayAttachments = day.events.flatMap(e => 
                          (e as any).attachments?.map((a: any) => ({ ...a, eventName: e.name })) || []
                        );
                        if (dayAttachments.length === 0) return null;
                        const isExpanded = expandedDocs[day.id] ?? false;
                        return (
                          <div className="mt-4 pt-4 border-t">
                            <button
                              onClick={() => setExpandedDocs(prev => ({ ...prev, [day.id]: !prev[day.id] }))}
                              className="w-full flex items-center justify-between text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-white transition-colors"
                            >
                              <span className="flex items-center gap-2">
                                <Paperclip className="w-4 h-4" />
                                Documentos ({dayAttachments.length})
                              </span>
                              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            {isExpanded && (
                              <div className="mt-3 space-y-2">
                                {dayAttachments.map((att: any) => (
                                  <a
                                    key={att.id}
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    {att.type === 'pdf' ? (
                                      <FileText className="w-4 h-4 text-red-500" />
                                    ) : att.type === 'image' ? (
                                      <ImageIcon className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Paperclip className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-700 truncate">{att.name}</p>
                                      <p className="text-xs text-gray-400 truncate">de {att.eventName}</p>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {showEditTrip && (
        <EditTripModal
          trip={trip}
          onSave={async (data) => {
            await updateTrip(trip.id, data);
            setShowEditTrip(false);
            refresh();
          }}
          onClose={() => setShowEditTrip(false)}
        />
      )}

      {showAddDay && (
        <AddDayModal
          startDate={trip.start_date}
          lastDate={days.length > 0 ? days[days.length - 1].date : undefined}
          onSave={async (date, notes) => {
            await addDay(date, notes);
            setShowAddDay(false);
          }}
          onClose={() => setShowAddDay(false)}
        />
      )}

      {editingDay && (
        <EditDayModal
          day={editingDay}
          onSave={async (updates) => {
            await updateDay(editingDay.id, updates);
            showToast('Día actualizado');
            setEditingDay(null);
            refresh();
          }}
          onClose={() => setEditingDay(null)}
        />
      )}

      {showAddEvent && (
        <AddPlaceModal
          onSave={async (data) => {
            const eventData = {
              name: data.name,
              event_type: data.event_type as any,
              start_time: data.start_time || undefined,
              end_time: data.end_time || undefined,
            };
            await addEvent(showAddEvent, eventData);
            showToast('Evento creado');
            setShowAddEvent(null);
          }}
          onClose={() => setShowAddEvent(null)}
        />
      )}

      {showCoverEditor && (
        <CoverEditorModal
          trip={trip}
          onSave={async (coverImage) => {
            await updateTrip(trip.id, { cover_image: coverImage || undefined });
            setShowCoverEditor(false);
            refresh();
          }}
          onClose={() => setShowCoverEditor(false)}
        />
      )}

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          members={members}
          onSave={async (data, payerId, participants) => {
            try {
              const clean = (val: string | undefined) => val === '' ? undefined : val;
              const updates = {
                name: data.name,
                event_type: data.event_type,
                address: clean(data.address),
                notes: clean(data.notes),
                start_time: clean(data.start_time),
                end_time: clean(data.end_time),
                google_maps_url: clean(data.google_maps_url),
                website_url: clean(data.website_url),
                cost_amount: data.cost_amount ? parseFloat(data.cost_amount as string) : undefined,
                cost_currency: data.cost_currency || 'EUR',
                cost_paid: data.cost_paid || false,
                booking_reference: clean(data.booking_reference),
                booking_status: clean(data.booking_status) as any,
                booking_platform: clean(data.booking_platform),
                booking_contact_name: clean(data.booking_contact_name),
                booking_contact_phone: clean(data.booking_contact_phone),
                payer_id: payerId || undefined,
                participants: participants && participants.length > 0 ? participants : undefined,
              };
              await updateEvent(editingEvent.id, updates);
              showToast('Evento actualizado');
              setEditingEvent(null);
              refresh();
            } catch (err: any) {
              showToast(err.message || 'Error al actualizar', 'error');
            }
          }}
          onClose={() => setEditingEvent(null)}
          onRefreshTrip={refresh}
        />
      )}

      {eventDetails && (
        <EventDetailsModal
          event={eventDetails}
          members={members}
          onSave={async (updates) => {
            try {
              await updateEvent(eventDetails.id, updates);
              showToast('Detalles actualizados');
              setEventDetails(null);
              refresh();
            } catch (err: any) {
              showToast(err.message || 'Error al actualizar', 'error');
            }
          }}
          onClose={() => setEventDetails(null)}
        />
      )}

      {showQuickAddExpense && (
        <QuickAddExpenseModal
          days={days}
          members={members}
          onSave={async (dayId, data) => {
            try {
              await handleQuickAddExpense(dayId, data);
              showToast('Gasto añadido');
              setShowQuickAddExpense(false);
            } catch (err: any) {
              showToast(err.message || 'Error al añadir el gasto', 'error');
            }
          }}
          onClose={() => setShowQuickAddExpense(false)}
        />
      )}
      
      <Footer />
    </div>
  );
}

function ChecklistSection({ tripId }: { tripId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchItems();
  }, [tripId]);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('todo_items')
      .select('*')
      .eq('trip_id', tripId)
      .is('event_id', null)
      .order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  const addItem = async () => {
    if (!newItem.trim()) return;
    
    const { data, error } = await supabase
      .from('todo_items')
      .insert({ trip_id: tripId, description: newItem.trim(), completed: false })
      .select()
      .single();
    
    if (error) {
      showToast('Error al añadir', 'error');
    } else {
      setItems(prev => [data, ...prev]);
      setNewItem('');
    }
  };

  const toggleItem = async (item: any) => {
    const { error } = await supabase
      .from('todo_items')
      .update({ completed: !item.completed })
      .eq('id', item.id);
    
    if (!error) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i));
    }
  };

  const deleteItem = async (id: string) => {
    await supabase.from('todo_items').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const completedCount = items.filter(i => i.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <CheckSquare className="w-5 h-5" />
          Checklist pre-viaje
        </h2>
        {items.length > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completedCount}/{items.length} completados
          </span>
        )}
      </div>

      {items.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-300">Progreso</span>
            <span className="font-medium text-gray-800 dark:text-white">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${progress}%`, minHeight: progress > 0 ? '4px' : '0' }}
            />
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="Añadir tarea..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={addItem}
            disabled={!newItem.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">No hay tareas en tu checklist</p>
          <p className="text-sm text-gray-400">Añade tareas para preparar tu viaje</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm divide-y divide-gray-200 dark:divide-gray-700">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={() => toggleItem(item)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  item.completed 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }`}
              >
                {item.completed && <Check className="w-3 h-3" />}
              </button>
              <span className={`flex-1 ${item.completed ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-white'}`}>
                {item.description}
              </span>
              <button
                onClick={() => deleteItem(item.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditTripModal({
  trip,
  onSave,
  onClose,
}: {
  trip: { id: string; title: string; description?: string; start_date?: string; end_date?: string; total_budget?: number };
  onSave: (data: Partial<{ title: string; description: string; start_date: string; end_date: string; total_budget?: number }>) => void;
  onClose: () => void;
}) {
  const [error, setError] = useState('');
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting, isValid } } = useForm<TripForm>({
    resolver: zodResolver(tripSchema),
    mode: 'onChange',
    defaultValues: {
      title: trip.title,
      description: trip.description || '',
      start_date: trip.start_date || '',
      end_date: trip.end_date || '',
      total_budget: trip.total_budget?.toString() || '',
    },
  });

  const startDate = watch('start_date');

  const onSubmit = async (data: TripForm) => {
    try {
      setError('');
      await onSave({
        title: data.title,
        description: data.description || undefined,
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
        total_budget: data.total_budget ? parseFloat(data.total_budget) : undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Error al guardar los cambios');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Editar Viaje</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título del viaje <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción (opcional)</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha inicio (año)</label>
              <input
                {...register('start_date')}
                type="date"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha fin (año)</label>
              <input
                {...register('end_date')}
                type="date"
                min={startDate || ''}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.end_date && (
                <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Presupuesto total (€)</label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...register('total_budget')}
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej: 1500"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Deja vacío si no quieres establecer un límite</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-medium hover:bg-gray-50 dark:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddDayModal({
  startDate,
  lastDate,
  onSave,
  onClose,
}: {
  startDate?: string;
  lastDate?: string;
  onSave: (date: string, notes?: string) => void;
  onClose: () => void;
}) {
  const getDefaultDate = () => {
    if (lastDate) {
      const date = new Date(lastDate);
      date.setDate(date.getDate() + 1);
      return date.toISOString().split('T')[0];
    }
    if (startDate) {
      return startDate;
    }
    return new Date().toISOString().split('T')[0];
  };

  const [date, setDate] = useState(getDefaultDate());
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Añadir Nuevo Día</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha del día</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Notas sobre este día..."
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-medium hover:bg-gray-50 dark:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(date, notes || undefined)}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600"
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}

function EditDayModal({
  day,
  onSave,
  onClose,
}: {
  day: { id: string; date: string; notes?: string };
  onSave: (updates: { date: string; notes?: string }) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(day.date);
  const [notes, setNotes] = useState(day.notes || '');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Editar Día</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha del día</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Notas sobre este día..."
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-medium hover:bg-gray-50 dark:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave({ date, notes: notes || undefined })}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function AddPlaceModal({
  onSave,
  onClose,
}: {
  onSave: (data: { name: string; event_type: string; start_time?: string; end_time?: string }) => void;
  onClose: () => void;
}) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<{
    name: string;
    event_type: string;
    start_time: string;
    end_time: string;
  }>({
    defaultValues: {
      event_type: 'activity',
      start_time: '',
      end_time: '',
    },
  });

  const selectedType = watch('event_type');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Añadir Evento</h2>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de evento</label>
            <div className="grid grid-cols-3 gap-2">
              {eventTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setValue('event_type', type.value)}
                    className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                      selectedType === type.value 
                        ? `${type.color} border-current` 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
            <input type="hidden" {...register('event_type')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name', { required: 'El nombre es requerido' })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={selectedType === 'accommodation' ? 'Ej: Hotel O Malioboro' : 
                          selectedType === 'restaurant' ? 'Ej: Warung Nusantara' :
                          selectedType === 'transport' ? 'Ej: Vuelo Madrid-Yakarta' :
                          'Ej: Templo Borobudur'}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Hora inicio
              </label>
              <input
                {...register('start_time')}
                type="time"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Hora fin
              </label>
              <input
                {...register('end_time')}
                type="time"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-medium hover:bg-gray-50 dark:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600"
            >
              Añadir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditEventModal({
  event,
  members,
  onSave,
  onClose,
  onRefreshTrip,
}: {
  event: TripEvent;
  members: { id: string; user_id?: string; email: string; profile?: { full_name?: string; alias?: string; avatar_url?: string } }[];
  onSave: (data: any, payerId?: string, participants?: string[]) => void;
  onClose: () => void;
  onRefreshTrip?: () => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [payerId, setPayerId] = useState<string>(event.payer_id || '');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(event.participants || []);
  const [selectedPlace, setSelectedPlace] = useState<{ address: string; latitude?: number; longitude?: number; google_maps_url?: string } | null>(null);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PlaceForm>({
    resolver: zodResolver(placeSchema),
    defaultValues: {
      name: event.name,
      address: event.address || '',
      latitude: event.latitude,
      longitude: event.longitude,
      notes: event.notes || '',
      event_type: event.event_type,
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      google_maps_url: event.google_maps_url || '',
      website_url: event.website_url || '',
      cost_amount: event.cost_amount?.toString() || '',
      cost_currency: event.cost_currency || 'EUR',
      cost_paid: event.cost_paid || false,
      booking_reference: event.booking_reference || '',
      booking_status: event.booking_status || '',
      booking_platform: event.booking_platform || '',
      booking_contact_name: event.booking_contact_name || '',
      booking_contact_phone: event.booking_contact_phone || '',
    },
  });

  const selectedType = watch('event_type');

  const loadAttachments = async () => {
    try {
      const data = await getEventAttachments(event.id);
      setAttachments(data);
    } catch (err) {
      console.error('Error loading attachments:', err);
    }
  };

  useEffect(() => {
    loadAttachments();
  }, []);

  const handleSubmitForm = (data: PlaceForm) => {
    const finalData = {
      ...data,
      latitude: selectedPlace?.latitude,
      longitude: selectedPlace?.longitude,
      google_maps_url: selectedPlace?.google_maps_url || data.google_maps_url,
      address: selectedPlace?.address || data.address,
    };
    onSave(finalData, payerId, selectedParticipants);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Editar Evento</h2>
        <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de evento</label>
            <div className="grid grid-cols-3 gap-2">
              {eventTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setValue('event_type', type.value)}
                    className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                      selectedType === type.value 
                        ? `${type.color} border-current` 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
            <input
              {...register('name')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Hora inicio
              </label>
              <input
                {...register('start_time')}
                type="time"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Hora fin
              </label>
              <input
                {...register('end_time')}
                type="time"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
            <PlaceAutocomplete
              value={watch('address')}
              onSelect={(place) => {
                setSelectedPlace({
                  address: place.address,
                  latitude: place.latitude,
                  longitude: place.longitude,
                  google_maps_url: place.google_maps_url,
                });
                setValue('address', place.address);
              }}
              placeholder="Buscar lugar o escribir dirección..."
              className="mb-2"
            />
            <input
              {...register('address')}
              placeholder="O escribe manualmente"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <MapIcon className="w-4 h-4 inline mr-1" />
                Google Maps
              </label>
              <input
                {...register('google_maps_url')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Globe className="w-4 h-4 inline mr-1" />
                Web
              </label>
              <input
                {...register('website_url')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              {showAdvanced ? '- Ocultar' : '+ Más opciones'}
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Euro className="w-4 h-4 inline mr-1" />
                    Coste
                  </label>
                  <input
                    {...register('cost_amount')}
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Moneda</label>
                  <select
                    {...register('cost_currency')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="IDR">IDR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('cost_paid')}
                      className="w-4 h-4 text-blue-500 rounded"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Pagado</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Ref. Reserva
                  </label>
                  <input
                    {...register('booking_reference')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado reserva</label>
                  <select
                    {...register('booking_status')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sin reserva</option>
                    <option value="pending">Pendiente</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="paid">Pagado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {showAdvanced && members.length > 0 && (
            <div className="space-y-4 pt-2 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Euro className="w-4 h-4 inline mr-1" />
                  Pagador
                </label>
                <select
                  value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.user_id || m.id}>
                      {getMemberDisplayName(m)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Participantes en el gasto
                </label>
                <div className="space-y-2">
                  {members.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(m.user_id || m.id)}
                        onChange={(e) => {
                          const userId = m.user_id || m.id;
                          if (e.target.checked) {
                            setSelectedParticipants([...selectedParticipants, userId]);
                          } else {
                            setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
                          }
                        }}
                        className="w-4 h-4 text-blue-500 rounded"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{getMemberDisplayName(m)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <FileUploader
              eventId={event.id}
              attachments={attachments}
              onAttachmentsChange={() => {
                loadAttachments();
                onRefreshTrip?.();
              }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-medium hover:bg-gray-50 dark:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CoverEditorModal({
  trip,
  onSave,
  onClose,
}: {
  trip: { id: string; cover_image?: string };
  onSave: (coverImage: string) => void;
  onClose: () => void;
}) {
  const [coverImage, setCoverImage] = useState(trip.cover_image || '');

  const handleCoverChange = (url: string) => {
    setCoverImage(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Editar Portada</h2>
        
        <CoverSelector
          value={coverImage}
          onChange={handleCoverChange}
        />

        <div className="flex gap-3 pt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-medium hover:bg-gray-50 dark:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(coverImage)}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function getMemberDisplayName(member: { profile?: { full_name?: string; alias?: string }; email: string }): string {
  if (member.profile?.full_name) return member.profile.full_name;
  if (member.profile?.alias) return member.profile.alias;
  return member.email.split('@')[0];
}

function QuickAddExpenseModal({
  days,
  members,
  onSave,
  onClose,
}: {
  days: { id: string; day_number: number; date: string }[];
  members: { id: string; user_id?: string; email: string; profile?: { full_name?: string; alias?: string } }[];
  onSave: (dayId: string, data: any) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState(days[0]?.id || '');
  const [category, setCategory] = useState<ExpenseCategory>('other');

  const toggleParticipant = (id: string) => {
    setSelectedParticipants(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!name || !amount || !selectedDay || !payerId) return;
    
    onSave(selectedDay, {
      name,
      event_type: 'activity',
      cost_amount: parseFloat(amount),
      cost_currency: 'EUR',
      expense_category: category,
      payer_id: payerId,
      participants: selectedParticipants.length > 0 ? selectedParticipants : undefined,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Añadir gasto rápido</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Concepto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Cena, Taxi, Entradas..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Importe (€) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Día <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {days.map(day => (
                <option key={day.id} value={day.id}>
                  Día {day.day_number} - {formatDate(day.date)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pagado por <span className="text-red-500">*</span>
            </label>
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              {members.map(m => (
                <option key={m.id} value={m.user_id || m.id}>
                  {getMemberDisplayName(m)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoría
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[]).map(cat => {
                const catInfo = EXPENSE_CATEGORIES[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                      category === cat
                        ? `${catInfo.color} ring-2 ring-blue-500 ring-offset-1`
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>{catInfo.icon}</span>
                    <span>{catInfo.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Compartido entre (opcional)
            </label>
            <div className="flex flex-wrap gap-2">
              {members.map(m => {
                const id = m.user_id || m.id;
                const isSelected = selectedParticipants.includes(id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleParticipant(id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isSelected 
                        ? 'bg-blue-500 text-white shadow-sm' 
                        : 'bg-white text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                  >
                    {getMemberDisplayName(m)}
                  </button>
                );
              })}
            </div>
            {selectedParticipants.length > 0 && amount && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {parseFloat(amount) / selectedParticipants.length}€ por persona
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-medium hover:bg-gray-50 dark:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name || !amount || !selectedDay || !payerId}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}

function exportToCSV(
  events: any[], 
  members: any[], 
  days: any[]
) {
  const memberMap = new Map(members.map((m: any) => [m.user_id, getMemberDisplayName(m)]));
  const dayMap = new Map(days.map((d: any) => [d.id, d.date]));

  const headers = ['Fecha', 'Concepto', 'Categoría', 'Importe', 'Moneda', 'Pagado por', 'Participantes', 'Notas'];
  const rows = events.map((e: any) => [
    dayMap.get(e.day_id) || '',
    e.name,
    EXPENSE_CATEGORIES[e.expense_category as ExpenseCategory]?.label || 'Otros',
    e.cost_amount || 0,
    e.cost_currency || 'EUR',
    memberMap.get(e.payer_id) || 'N/A',
    (e.participants || []).map((p: string) => memberMap.get(p) || p).join(', '),
    e.notes || '',
  ]);

  const csvContent = [headers, ...rows]
    .map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const csvBlob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(csvBlob);
  downloadLink.download = `gastos-viaje-${new Date().toISOString().split('T')[0]}.csv`;
  downloadLink.click();
}

function ExpensesSection({
  days,
  members,
  onAddExpense,
  onAddDay,
  tripBudget,
}: {
  days: (Day & { events: TripEvent[] })[];
  members: { id: string; user_id?: string; email: string; role: string; status: string; profile?: { full_name?: string; alias?: string; avatar_url?: string } }[];
  onAddExpense: () => void;
  onAddDay: () => void;
  tripBudget?: number;
}) {
  const allEvents = days.flatMap(d => d.events);
  const eventsWithCost = allEvents.filter(e => e.cost_amount && e.cost_amount > 0);

  const totalExpenses = eventsWithCost.reduce((sum, e) => sum + (e.cost_amount || 0), 0);

  const categoryStats = eventsWithCost.reduce((acc, e) => {
    const cat = e.expense_category || 'other';
    acc[cat] = (acc[cat] || 0) + (e.cost_amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryStats)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => ({
      category: cat as ExpenseCategory,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }));

  const memberStats = members
    .filter(m => m.status === 'accepted' && m.user_id)
    .map(m => {
      const userId = m.user_id!;
      const paidByUser = eventsWithCost
        .filter(e => e.payer_id === userId)
        .reduce((sum, e) => sum + (e.cost_amount || 0), 0);
      
      const owedByUser = eventsWithCost.reduce((sum, e) => {
        const participants = e.participants || [];
        if (participants.length === 0) {
          return sum;
        }
        const share = (e.cost_amount || 0) / participants.length;
        return sum + (participants.includes(userId) ? share : 0);
      }, 0);

      return {
        userId,
        email: m.email,
        displayName: getMemberDisplayName(m),
        paid: paidByUser,
        owed: owedByUser,
        balance: paidByUser - owedByUser,
      };
    });

  const settlements: { from: string; fromName: string; to: string; toName: string; amount: number }[] = [];
  const debtors = memberStats.filter(m => m.balance < 0).sort((a, b) => a.balance - b.balance);
  const creditors = memberStats.filter(m => m.balance > 0).sort((a, b) => b.balance - a.balance);

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
    
    if (amount > 0.01) {
      settlements.push({
        from: debtor.userId,
        fromName: debtor.displayName,
        to: creditor.userId,
        toName: creditor.displayName,
        amount: Math.round(amount * 100) / 100,
      });
    }

    debtor.balance -= amount;
    creditor.balance += amount;

    if (Math.abs(debtor.balance) < 0.01) i++;
    if (Math.abs(creditor.balance) < 0.01) j++;
  }

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Gastos
        </h2>
        <div className="flex items-center gap-2">
          {days.length === 0 ? (
            <button
              onClick={onAddDay}
              className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium"
            >
              <Plus className="w-4 h-4" />
              Crear día
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onAddExpense}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
                Añadir gasto
              </button>
              <button
                onClick={() => exportToCSV(eventsWithCost, members, days)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-opacity ${eventsWithCost.length > 0 ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 opacity-100' : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'}`}
                disabled={eventsWithCost.length === 0}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm opacity-80">Gasto total del viaje</span>
          </div>
          <span className="text-sm opacity-80">{eventsWithCost.length} gastos</span>
        </div>
        <p className="text-3xl font-bold">{formatCurrency(totalExpenses, eventsWithCost[0]?.cost_currency || 'EUR')}</p>
        {tripBudget && tripBudget > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Presupuesto: {formatCurrency(tripBudget)}</span>
              <span>{Math.round((totalExpenses / tripBudget) * 100)}%</span>
            </div>
            <div className="h-3 bg-white/30 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  totalExpenses > tripBudget ? 'bg-red-400' : 'bg-white'
                }`}
                style={{ width: `${Math.min((totalExpenses / tripBudget) * 100, 100)}%`, minWidth: '4px' }}
              />
            </div>
            <p className={`text-sm mt-1 ${totalExpenses > tripBudget ? 'text-red-200' : 'opacity-80'}`}>
              {totalExpenses > tripBudget 
                ? `¡Has superado el presupuesto en ${formatCurrency(totalExpenses - tripBudget)}!`
                : `Te quedan ${formatCurrency(tripBudget - totalExpenses)}`
              }
            </p>
          </div>
        )}
      </div>

      {eventsWithCost.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700 border-b">
            <h3 className="font-semibold text-gray-800 dark:text-white">Gastos por categoría</h3>
          </div>
          <div className="p-5 space-y-4">
            {sortedCategories.map(({ category, amount, percentage }) => {
              const catInfo = EXPENSE_CATEGORIES[category];
              return (
                <div key={category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="flex items-center gap-2">
                      <span>{catInfo.icon}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{catInfo.label}</span>
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {formatCurrency(amount)} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${percentage}%`,
                        minWidth: percentage > 0 ? '4px' : '0',
                        backgroundColor: category === 'food' ? '#f97316' : 
                          category === 'transport' ? '#3b82f6' : 
                          category === 'accommodation' ? '#a855f7' : 
                          category === 'activities' ? '#22c55e' : 
                          category === 'shopping' ? '#ec4899' : '#6b7280'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700 border-b">
          <h3 className="font-semibold text-gray-800 dark:text-white">Resumen por persona</h3>
        </div>
        {memberStats.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No hay suficientes datos para calcular el resumen
          </div>
        ) : (
          <div className="divide-y">
            {memberStats.map(stat => (
              <div key={stat.userId} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{stat.displayName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Pagado: {formatCurrency(stat.paid)} · Debe: {formatCurrency(stat.owed)}
                  </p>
                </div>
                <div className={`text-right ${stat.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <p className="font-semibold">
                    {stat.balance >= 0 ? '+' : ''}{formatCurrency(stat.balance)}
                  </p>
                  <p className="text-xs">
                    {stat.balance >= 0 ? 'Le deben' : 'Debe'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {settlements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700 border-b">
            <h3 className="font-semibold text-gray-800 dark:text-white">Liquidación de deudas</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Transferencias necesarias para equilibrar los gastos
            </p>
          </div>
          <div className="divide-y">
            {settlements.map((s, idx) => (
              <div key={idx} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-red-600 font-medium">{s.fromName}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span className="text-green-600 font-medium">{s.toName}</span>
                </div>
                <span className="font-semibold text-gray-800 dark:text-white">
                  {formatCurrency(s.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {eventsWithCost.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700 border-b">
            <h3 className="font-semibold text-gray-800 dark:text-white">Detalle de gastos</h3>
          </div>
          <div className="divide-y">
            {eventsWithCost.map(event => {
              const payer = members.find(m => m.user_id === event.payer_id);
              const participants = event.participants || [];
              return (
                <div key={event.id} className="px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{event.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {payer ? `Pagado por ${getMemberDisplayName(payer)}` : 'Gasto sin pagador'}
                        {participants.length > 0 && ` · Compartido entre ${participants.length} personas`}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {formatCurrency(event.cost_amount!, event.cost_currency)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function EventDetailsModal({
  event,
  members,
  onSave,
  onClose,
}: {
  event: TripEvent;
  members: { id: string; user_id?: string; email: string; profile?: { full_name?: string; alias?: string; avatar_url?: string } }[];
  onSave: (updates: Partial<TripEvent>) => void;
  onClose: () => void;
}) {
  const [costAmount, setCostAmount] = useState(event.cost_amount?.toString() || '');
  const [costCurrency, setCostCurrency] = useState(event.cost_currency || 'EUR');
  const [costPaid, setCostPaid] = useState(event.cost_paid || false);
  const [payerId, setPayerId] = useState(event.payer_id || '');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(event.participants || []);
  const [address, setAddress] = useState(event.address || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(event.google_maps_url || '');
  const [websiteUrl, setWebsiteUrl] = useState(event.website_url || '');
  const [bookingReference, setBookingReference] = useState(event.booking_reference || '');
  const [bookingStatus, setBookingStatus] = useState(event.booking_status || '');
  const [notes, setNotes] = useState(event.notes || '');

  const handleSave = () => {
    onSave({
      cost_amount: costAmount ? parseFloat(costAmount) : undefined,
      cost_currency: costCurrency || 'EUR',
      cost_paid: costPaid,
      payer_id: payerId || undefined,
      participants: selectedParticipants.length > 0 ? selectedParticipants : undefined,
      address: address || undefined,
      google_maps_url: googleMapsUrl || undefined,
      website_url: websiteUrl || undefined,
      booking_reference: bookingReference || undefined,
      booking_status: bookingStatus as any || undefined,
      notes: notes || undefined,
    });
  };

  const formatCurrency = (amount: number | undefined, currency: string) => {
    if (!amount) return '';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
  };

  const toggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  const sharePerPerson = costAmount && selectedParticipants.length > 0 
    ? parseFloat(costAmount) / selectedParticipants.length 
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{event.name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Edita los detalles del evento</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Gasto</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cantidad</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costAmount}
                    onChange={(e) => setCostAmount(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-lg font-medium"
                    placeholder="0.00"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Moneda</label>
                  <select
                    value={costCurrency}
                    onChange={(e) => setCostCurrency(e.target.value)}
                    className="w-full px-2 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="IDR">IDR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="THB">THB</option>
                  </select>
                </div>
              </div>

              {costAmount && (
                <>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={costPaid}
                      onChange={(e) => setCostPaid(e.target.checked)}
                      className="w-5 h-5 text-blue-500 rounded"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-700">Pagado</span>
                      {costPaid && costCurrency && (
                        <span className="ml-2 text-green-600 font-medium">
                          {formatCurrency(parseFloat(costAmount), costCurrency)}
                        </span>
                      )}
                    </div>
                  </label>

                  {members.length > 0 && (
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Pagado por</span>
                        <select
                          value={payerId}
                          onChange={(e) => setPayerId(e.target.value)}
                          className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Seleccionar...</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.user_id || m.id}>
                              {getMemberDisplayName(m)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Dividir entre</span>
                          {selectedParticipants.length > 0 && sharePerPerson && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {formatCurrency(sharePerPerson, costCurrency)} / persona
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {members.map((m) => {
                            const userId = m.user_id || m.id;
                            const isSelected = selectedParticipants.includes(userId);
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => toggleParticipant(userId)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                  isSelected 
                                    ? 'bg-blue-500 text-white shadow-sm' 
                                    : 'bg-white text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                }`}
                              >
                                {getMemberDisplayName(m)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Ubicación</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Dirección</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Calle, número, ciudad..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Google Maps</label>
                  <input
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="maps.app.goo.gl..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Web</label>
                  <input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="www.ejemplo.com"
                  />
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Reserva</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Referencia</label>
                <input
                  value={bookingReference}
                  onChange={(e) => setBookingReference(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="#ABC123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
                <select
                  value={bookingStatus}
                  onChange={(e) => setBookingStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sin reserva</option>
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="paid">Pagado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Notas</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notas sobre el evento..."
            />
          </section>
        </div>

        <div className="p-6 border-t bg-gray-50 dark:bg-gray-700 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-sm"
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
