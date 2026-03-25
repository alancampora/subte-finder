import { LINE_STATIONS } from './station-order';

interface StationArrival {
  stationName: string;
  arrivalTime: number;
}

interface TrackedFormation {
  id: string;
  line: string;
  direction: number;
  stationName: string;
  stationIndex: number;
  updatedAt: number;
}

export interface ActiveFormation {
  id: string;
  line: string;
  direction: number;
  stationName: string;
  stationIndex: number;
  totalStations: number;
  progress: number;
  updatedAt: number;
}

export interface FormationsResponse {
  formations: ActiveFormation[];
  lastPoll: number;
}

function normalize(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function makeKey(line: string, direction: number): string {
  return `${line}_${direction}`;
}

// Expire formations not updated in 5 minutes (likely completed their trip)
const STALE_TTL = 5 * 60 * 1000;
// Minimum time jump at terminal to consider a new departure (90 seconds)
const NEW_DEPARTURE_THRESHOLD = 90;

export class FormationTracker {
  private formations = new Map<string, TrackedFormation[]>();
  private lastArrivals = new Map<string, StationArrival[]>();
  private _lastPoll = 0;

  get lastPoll(): number {
    return this._lastPoll;
  }

  processSnapshot(data: { Entity?: any[] }): void {
    const now = Date.now();
    this._lastPoll = now;
    const entities = data.Entity || [];

    for (const entity of entities) {
      const line: string = entity.Linea.Route_Id;
      const direction: number = entity.Linea.Direction_ID;
      const key = makeKey(line, direction);
      const stationOrder = LINE_STATIONS[line];
      if (!stationOrder) continue;

      // Build arrivals ordered by station sequence in the line
      const arrivals = this.buildOrderedArrivals(entity.Linea.Estaciones, stationOrder);
      if (arrivals.length === 0) continue;

      const nowSec = Math.floor(now / 1000);

      // For direction 0: train goes index 0 → last (left to right)
      // For direction 1: train goes last → index 0 (right to left)
      // Find the lead position: the last station the train has passed
      // (last station with arrival time in the past)
      const leadIdx = this.findLeadPosition(arrivals, nowSec, direction);

      // Detect new departures by checking if the origin terminal time changed
      const originIdx = direction === 0 ? 0 : arrivals.length - 1;
      const prevArrivals = this.lastArrivals.get(key);

      if (prevArrivals && prevArrivals.length > 0) {
        const prevOriginTime = prevArrivals[originIdx]?.arrivalTime ?? 0;
        const currOriginTime = arrivals[originIdx]?.arrivalTime ?? 0;

        if (currOriginTime - prevOriginTime > NEW_DEPARTURE_THRESHOLD) {
          const existing = this.formations.get(key) || [];
          const newFormation: TrackedFormation = {
            id: `${line}_${direction}_${currOriginTime}`,
            line,
            direction,
            stationName: arrivals[originIdx].stationName,
            stationIndex: originIdx,
            updatedAt: now,
          };
          existing.push(newFormation);
          this.formations.set(key, existing);
        }
      }

      // Update lead formation position
      if (leadIdx >= 0) {
        const existing = this.formations.get(key) || [];
        const leadStation = arrivals[leadIdx];

        // Find the formation closest to the lead position to update
        let closestFormation: TrackedFormation | undefined;
        let closestDist = Infinity;
        for (const f of existing) {
          const dist = Math.abs(f.stationIndex - leadIdx);
          if (dist < closestDist) {
            closestDist = dist;
            closestFormation = f;
          }
        }

        if (closestFormation && closestDist <= 3) {
          closestFormation.stationName = leadStation.stationName;
          closestFormation.stationIndex = leadIdx;
          closestFormation.updatedAt = now;
        } else if (existing.length === 0) {
          existing.push({
            id: `${line}_${direction}_${nowSec}`,
            line,
            direction,
            stationName: leadStation.stationName,
            stationIndex: leadIdx,
            updatedAt: now,
          });
          this.formations.set(key, existing);
        }
      }

      this.lastArrivals.set(key, arrivals);
    }

    this.expireFormations(now);
  }

  getFormations(): FormationsResponse {
    const formations: ActiveFormation[] = [];

    for (const [_key, tracked] of this.formations) {
      for (const t of tracked) {
        const stationOrder = LINE_STATIONS[t.line];
        if (!stationOrder) continue;
        const total = stationOrder.length - 1;
        formations.push({
          id: t.id,
          line: t.line,
          direction: t.direction,
          stationName: t.stationName,
          stationIndex: t.stationIndex,
          totalStations: stationOrder.length,
          progress: total > 0 ? t.stationIndex / total : 0,
          updatedAt: t.updatedAt,
        });
      }
    }

    return { formations, lastPoll: this._lastPoll };
  }

  private buildOrderedArrivals(estaciones: any[], stationOrder: string[]): StationArrival[] {
    const arrivals: StationArrival[] = [];

    for (const name of stationOrder) {
      const nameNorm = normalize(name);
      const match = estaciones.find((e: any) => normalize(e.stop_name) === nameNorm);
      if (match) {
        arrivals.push({
          stationName: name,
          arrivalTime: match.arrival.time,
        });
      }
    }

    return arrivals;
  }

  private findLeadPosition(arrivals: StationArrival[], nowSec: number, direction: number): number {
    // The API shows the NEXT arrival at each station.
    // Stations with time in the past = the train already passed them.
    // We want to find the "front" of the train:
    // - For dir 0 (going 0→last): the highest index with time <= now
    // - For dir 1 (going last→0): the lowest index with time <= now

    if (direction === 0) {
      // Train moves left to right (increasing index)
      // Find the furthest station the train has reached (time in past)
      let leadIdx = -1;
      for (let i = 0; i < arrivals.length; i++) {
        if (arrivals[i].arrivalTime <= nowSec) {
          leadIdx = i;
        }
      }
      // If no past stations, train hasn't arrived yet — use first future station
      if (leadIdx < 0) {
        for (let i = 0; i < arrivals.length; i++) {
          if (arrivals[i].arrivalTime > nowSec) return i;
        }
      }
      return leadIdx;
    } else {
      // Train moves right to left (decreasing index)
      // Find the lowest index station the train has reached (time in past)
      let leadIdx = -1;
      for (let i = arrivals.length - 1; i >= 0; i--) {
        if (arrivals[i].arrivalTime <= nowSec) {
          leadIdx = i;
        }
      }
      if (leadIdx < 0) {
        for (let i = arrivals.length - 1; i >= 0; i--) {
          if (arrivals[i].arrivalTime > nowSec) return i;
        }
      }
      return leadIdx;
    }
  }

  private expireFormations(now: number): void {
    for (const [key, tracked] of this.formations) {
      const alive = tracked.filter(t => {
        const age = now - t.updatedAt;
        // Expire if not updated recently (train likely completed trip)
        if (age > STALE_TTL) return false;
        return true;
      });

      if (alive.length === 0) {
        this.formations.delete(key);
      } else {
        this.formations.set(key, alive);
      }
    }
  }
}
