import { MapIcon, Hotel, Plane, Utensils, ShoppingBag, CheckSquare } from 'lucide-react';

export const eventTypes = [
  { value: 'activity', label: 'Actividad', icon: MapIcon, color: 'bg-blue-100 text-blue-600' },
  { value: 'accommodation', label: 'Alojamiento', icon: Hotel, color: 'bg-purple-100 text-purple-600' },
  { value: 'transport', label: 'Transporte', icon: Plane, color: 'bg-orange-100 text-orange-600' },
  { value: 'restaurant', label: 'Restaurante', icon: Utensils, color: 'bg-green-100 text-green-600' },
  { value: 'shopping', label: 'Compras', icon: ShoppingBag, color: 'bg-pink-100 text-pink-600' },
  { value: 'todo', label: 'Tarea', icon: CheckSquare, color: 'bg-yellow-100 text-yellow-600' },
] as const;

export function getMemberDisplayName(member: {
  profile?: { full_name?: string; alias?: string };
  email: string;
}): string {
  if (member.profile?.full_name) return member.profile.full_name;
  if (member.profile?.alias) return member.profile.alias;
  return member.email.split('@')[0];
}

export function formatDateShort(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
