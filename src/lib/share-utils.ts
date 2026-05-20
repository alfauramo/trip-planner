import { appUrl } from './urls';

export function shareTrip(trip: { id: string; title: string; description?: string }): Promise<void> {
  const url = appUrl(`/trips/${trip.id}`);
  if (navigator.share) {
    return navigator.share({ title: trip.title, text: trip.description || trip.title, url });
  }
  return navigator.clipboard.writeText(url);
}
