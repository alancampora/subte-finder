import type { Station, NearestResult, DelayInfo, SubteEntity, RelevantTrip } from './types';
import { STATIONS } from './stations';

function normalize(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestStation(lat: number, lng: number): NearestResult {
  let nearest: Station = STATIONS[0];
  let minDist = Infinity;
  STATIONS.forEach(s => {
    const d = haversine(lat, lng, s.lat, s.lng);
    if (d < minDist) { minDist = d; nearest = s; }
  });
  return { station: nearest, distance: Math.round(minDist) };
}

export function formatTime(unixTs: number): string {
  const d = new Date(unixTs * 1000);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatDelay(seconds: number): DelayInfo {
  if (seconds <= 30) return { label: 'A TIEMPO', cls: 'delay-ok' };
  if (seconds < 180) return { label: `+${Math.round(seconds / 60)} MIN`, cls: 'delay-warn' };
  return { label: `+${Math.round(seconds / 60)} MIN`, cls: 'delay-danger' };
}

export function minutesUntil(unixTs: number): number {
  const now = Math.floor(Date.now() / 1000);
  const diff = unixTs - now;
  if (diff <= 0) return 0;
  return Math.round(diff / 60);
}

export function lineFriendlyName(routeId: string): string {
  return routeId.replace('Linea', 'Linea ');
}

export function getDirectionLabel(entity: SubteEntity): string {
  const ests = entity.Linea.Estaciones;
  const destination = ests[ests.length - 1].stop_name;
  return `→ ${destination}`;
}

export function formatDistance(meters: number): string {
  return meters < 1000
    ? `${meters} m`
    : `${(meters / 1000).toFixed(1)} km`;
}

export function findRelevantTrips(entities: SubteEntity[], station: Station): RelevantTrip[] {
  const trips: RelevantTrip[] = [];
  const nameNorm = normalize(station.name);

  entities.forEach(entity => {
    const match = entity.Linea.Estaciones.find(e =>
      normalize(e.stop_name) === nameNorm &&
      entity.Linea.Route_Id === station.line
    );
    if (match) trips.push({ entity, stop: match });
  });

  if (trips.length === 0) {
    entities.forEach(entity => {
      const match = entity.Linea.Estaciones.find(e =>
        normalize(e.stop_name) === nameNorm
      );
      if (match) trips.push({ entity, stop: match });
    });
  }

  trips.sort((a, b) => a.stop.arrival.time - b.stop.arrival.time);
  return trips;
}
