import { MapIcon, Hotel, Plane, Utensils, ShoppingBag, CheckSquare } from 'lucide-react';
import i18n from '../lib/i18n';
import { formatDate as formatDateFull, formatDateShort } from '../lib/date-utils';

export const eventTypes = [
  { value: 'activity', label: i18n.t('event.type.activity'), icon: MapIcon, color: 'bg-blue-100 text-blue-600' },
  {
    value: 'accommodation',
    label: i18n.t('event.type.accommodation'),
    icon: Hotel,
    color: 'bg-purple-100 text-purple-600',
  },
  { value: 'transport', label: i18n.t('event.type.transport'), icon: Plane, color: 'bg-orange-100 text-orange-600' },
  { value: 'restaurant', label: i18n.t('event.type.restaurant'), icon: Utensils, color: 'bg-green-100 text-green-600' },
  { value: 'shopping', label: i18n.t('event.type.shopping'), icon: ShoppingBag, color: 'bg-pink-100 text-pink-600' },
  { value: 'todo', label: i18n.t('event.type.task'), icon: CheckSquare, color: 'bg-yellow-100 text-yellow-600' },
] as const;

export function getMemberDisplayName(member: {
  profile?: { full_name?: string; alias?: string };
  email: string;
}): string {
  if (member.profile?.full_name) return member.profile.full_name;
  if (member.profile?.alias) return member.profile.alias;
  return member.email.split('@')[0];
}

export { formatDateShort };
export const formatDate = formatDateFull;
