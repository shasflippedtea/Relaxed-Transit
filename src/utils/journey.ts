import type { Station } from '../types/station'

const EARTH_RADIUS_KM = 6371

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function haversineDistanceKm(a: Station, b: Station): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

/**
 * Rough National Rail journey estimate: a short boarding/dwell base plus
 * ~80 km/h average. The low floor keeps short hops distinct (e.g. a 1 km and a
 * 4 km journey differ) so quick focus sessions work, instead of everything
 * flattening to a 15-minute minimum.
 */
export function estimateJourneyMinutes(from: Station, to: Station): number {
  const km = haversineDistanceKm(from, to)
  const minutes = Math.round(2 + (km / 80) * 60)
  return Math.max(3, Math.min(180, minutes))
}

/**
 * Rank stations by how closely their estimated rail journey from `origin`
 * matches `minutes`, closest first. Used by the interactive focus-duration
 * control so the chosen time can suggest a set of candidate destinations.
 */
export function nearestStationsByMinutes(
  origin: Station,
  minutes: number,
  stations: Station[],
  count = 4,
): Station[] {
  return stations
    .filter((s) => s.crs !== origin.crs)
    .map((s) => ({ s, diff: Math.abs(estimateJourneyMinutes(origin, s) - minutes) }))
    .sort((a, b) => a.diff - b.diff)
    .slice(0, count)
    .map((x) => x.s)
}

/**
 * Pick the single station whose estimated rail journey from `origin` is closest
 * to `minutes`.
 */
export function nearestStationByMinutes(
  origin: Station,
  minutes: number,
  stations: Station[],
): Station | null {
  return nearestStationsByMinutes(origin, minutes, stations, 1)[0] ?? null
}

export function interpolatePosition(
  from: Station,
  to: Station,
  progress: number,
): [number, number] {
  const t = Math.max(0, Math.min(1, progress))
  return [from.lat + (to.lat - from.lat) * t, from.lng + (to.lng - from.lng) * t]
}

export function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`
}
