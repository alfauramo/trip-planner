export function shareTrip(trip: { id: string; title: string; description?: string }): void {
  const url = `${window.location.origin}/trip-planner/trips/${trip.id}`;
  if (navigator.share) {
    navigator.share({ title: trip.title, text: trip.description || trip.title, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).catch(() => {});
  }
}
