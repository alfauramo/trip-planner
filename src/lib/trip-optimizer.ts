const toRad = (deg: number) => (deg * Math.PI) / 180;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Coordinated {
  id: string;
  latitude: number;
  longitude: number;
}

export function optimizeRoute<T extends Coordinated>(points: T[]): T[] {
  if (points.length < 2) return points;
  const visited = new Array(points.length).fill(false);
  const order: number[] = [0];
  visited[0] = true;
  let current = 0;
  while (order.length < points.length) {
    let nearestIdx = -1;
    let nearestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      if (!visited[i]) {
        const dist = haversineDistance(
          points[current].latitude,
          points[current].longitude,
          points[i].latitude,
          points[i].longitude,
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
  return order.map((idx) => points[idx]);
}

interface Locatable {
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  google_maps_url?: string | null;
}

function extractCoord(url: string): string | null {
  const match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  return match ? `${match[1]},${match[2]}` : null;
}

export function buildGoogleMapsRoute(points: Locatable[]): string {
  if (points.length === 0) return 'https://www.google.com/maps';
  let url = 'https://www.google.com/maps/dir/';
  url += points
    .map((p) => {
      if (p.latitude && p.longitude) return `${p.latitude},${p.longitude}`;
      if (p.google_maps_url) {
        const coord = extractCoord(p.google_maps_url);
        if (coord) return coord;
      }
      return encodeURIComponent(p.address || p.name);
    })
    .join('/');
  return url;
}
