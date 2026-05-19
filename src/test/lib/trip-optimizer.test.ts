import { describe, it, expect } from 'vitest';
import { optimizeRoute, buildGoogleMapsRoute } from '../../lib/trip-optimizer';

describe('optimizeRoute', () => {
  const points = [
    { id: 'a', latitude: 40.4165, longitude: -3.7026 },
    { id: 'b', latitude: 41.3874, longitude: 2.1686 },
    { id: 'c', latitude: 48.8566, longitude: 2.3522 },
    { id: 'd', latitude: 51.5074, longitude: -0.1278 },
  ];

  it('returns the same array if less than 2 points', () => {
    const single = [{ id: 'x', latitude: 0, longitude: 0 }];
    expect(optimizeRoute(single)).toEqual(single);
    expect(optimizeRoute([])).toEqual([]);
  });

  it('returns all points (same length)', () => {
    const result = optimizeRoute(points);
    expect(result).toHaveLength(points.length);
  });

  it('always starts with the first point', () => {
    const result = optimizeRoute(points);
    expect(result[0].id).toBe('a');
  });

  it('returns points with same id set (no loss)', () => {
    const result = optimizeRoute(points);
    const ids = result.map((p) => p.id).sort();
    const expectedIds = points.map((p) => p.id).sort();
    expect(ids).toEqual(expectedIds);
  });

  it('handles points with same starting coordinates', () => {
    const dup = [
      { id: 'x', latitude: 10, longitude: 20 },
      { id: 'y', latitude: 10, longitude: 20 },
      { id: 'z', latitude: 30, longitude: 40 },
    ];
    const result = optimizeRoute(dup);
    expect(result).toHaveLength(3);
  });
});

describe('buildGoogleMapsRoute', () => {
  it('returns base URL for empty input', () => {
    expect(buildGoogleMapsRoute([])).toBe('https://www.google.com/maps');
  });

  it('uses lat/lng coordinates when available', () => {
    const points = [
      { name: 'A', latitude: 40.4165, longitude: -3.7026 },
      { name: 'B', latitude: 41.3874, longitude: 2.1686 },
    ];
    const url = buildGoogleMapsRoute(points);
    expect(url).toContain('40.4165,-3.7026');
    expect(url).toContain('41.3874,2.1686');
    expect(url.startsWith('https://www.google.com/maps/dir/')).toBe(true);
  });

  it('extracts coordinates from google_maps_url', () => {
    const points = [
      {
        name: 'Place',
        google_maps_url: 'https://maps.google.com/?q=loc:40.5,-3.7&@40.5,-3.7,15z',
      },
    ];
    const url = buildGoogleMapsRoute(points);
    expect(url).toContain('40.5,-3.7');
  });

  it('falls back to address encoding', () => {
    const points = [{ name: 'Gran Vía, Madrid', address: 'Gran Vía, Madrid' }];
    const url = buildGoogleMapsRoute(points);
    expect(url).toContain('Gran%20V%C3%ADa%2C%20Madrid');
  });

  it('falls back to name when no coordinates or address', () => {
    const points = [{ name: 'My Place' }];
    const url = buildGoogleMapsRoute(points);
    expect(url).toContain('My%20Place');
  });

  it('handles multiple points with mixed data', () => {
    const points = [
      { name: 'A', latitude: 1, longitude: 2 },
      { name: 'B', address: 'Some Street', google_maps_url: 'https://maps.google.com/@3,4,15z' },
      { name: 'C' },
    ];
    const url = buildGoogleMapsRoute(points);
    const segments = url.replace('https://www.google.com/maps/dir/', '').split('/');
    expect(segments).toHaveLength(3);
  });
});
