export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name?: string;
  alias?: string;
  avatar_url?: string;
  bio?: string;
  birth_date?: string;
  location?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export type EventType = 'accommodation' | 'transport' | 'activity' | 'restaurant' | 'shopping' | 'todo';

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  cover_image?: string;
  cover_type?: 'country' | 'custom';
  country_code?: string;
  currency?: string;
  total_budget?: number;
  created_at: string;
  updated_at: string;
  trip_members?: TripMember[];
}

export interface Day {
  id: string;
  trip_id: string;
  date: string;
  day_number: number;
  notes?: string;
  created_at: string;
}

export interface TripEvent {
  id: string;
  day_id: string;
  event_type: EventType;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  google_maps_url?: string;
  website_url?: string;
  start_time?: string;
  end_time?: string;
  all_day?: boolean;
  cost_amount?: number;
  cost_currency?: string;
  cost_paid?: boolean;
  expense_category?: ExpenseCategory;
  booking_reference?: string;
  booking_status?: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  booking_platform?: string;
  booking_contact_name?: string;
  booking_contact_phone?: string;
  notes?: string;
  order: number;
  payer_id?: string;
  participants?: string[];
  split_type?: 'equal' | 'custom' | 'full';
  created_at: string;
}

export type ExpenseCategory = 'food' | 'transport' | 'accommodation' | 'activities' | 'shopping' | 'other';

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; icon: string; color: string }> = {
  food: { label: 'Comida', icon: '🍽️', color: 'bg-orange-100 text-orange-600' },
  transport: { label: 'Transporte', icon: '🚗', color: 'bg-blue-100 text-blue-600' },
  accommodation: { label: 'Alojamiento', icon: '🏨', color: 'bg-purple-100 text-purple-600' },
  activities: { label: 'Actividades', icon: '🎭', color: 'bg-green-100 text-green-600' },
  shopping: { label: 'Compras', icon: '🛍️', color: 'bg-pink-100 text-pink-600' },
  other: { label: 'Otros', icon: '📦', color: 'bg-stone-100 text-stone-600' },
};

export interface Attachment {
  id: string;
  event_id: string;
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'ticket' | 'other';
  created_at: string;
}

export interface TripMember {
  id: string;
  trip_id: string;
  user_id?: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'pending' | 'accepted' | 'declined';
  user?: {
    id: string;
    email: string;
  };
  profile?: {
    id: string;
    full_name?: string;
    alias?: string;
    avatar_url?: string;
  };
}

export interface TripInvitation {
  id: string;
  trip_id: string;
  email: string;
  role: 'viewer' | 'editor';
  status: 'pending' | 'accepted' | 'declined';
  expires_at: string;
}

export interface TodoItem {
  id: string;
  trip_id: string;
  description: string;
  completed: boolean;
  due_date?: string;
  event_id?: string;
  created_at: string;
}

export interface EventWithAttachments extends TripEvent {
  attachments: Attachment[];
}

export interface DayWithEvents extends Day {
  events: EventWithAttachments[];
}

export interface TripWithDetails extends Trip {
  days: DayWithEvents[];
  members: TripMember[];
  todo_items?: TodoItem[];
  attachments?: Attachment[];
}

export interface ExpenseSummary {
  userId: string;
  email: string;
  totalPaid: number;
  totalOwed: number;
  balance: number;
}

export interface Settlement {
  from: string;
  fromEmail: string;
  to: string;
  toEmail: string;
  amount: number;
}
