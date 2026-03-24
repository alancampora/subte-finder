// Last train departure times (the later of both directions per line)
// After this time + BUFFER_MINUTES, the line is considered out of service.
interface LineSchedule {
  weekday: string;  // HH:MM
  saturday: string;
  sunday: string;
}

const LAST_TRAINS: Record<string, LineSchedule> = {
  LineaA: { weekday: '23:26', saturday: '23:57', sunday: '22:36' },
  LineaB: { weekday: '23:32', saturday: '23:56', sunday: '22:31' },
  LineaC: { weekday: '23:33', saturday: '23:54', sunday: '22:34' },
  LineaD: { weekday: '23:32', saturday: '00:01', sunday: '22:31' },
  LineaE: { weekday: '23:30', saturday: '23:58', sunday: '22:28' },
  LineaH: { weekday: '23:51', saturday: '00:20', sunday: '22:51' },
};

// Service start times (same for all lines)
const SERVICE_START: Record<string, string> = {
  weekday:  '05:30',
  saturday: '06:00',
  sunday:   '08:00',
};

// Minutes after last departure to consider service fully ended
const BUFFER_MINUTES = 40;

type DayType = 'weekday' | 'saturday' | 'sunday';

function getDayType(date: Date): DayType {
  const day = date.getDay();
  if (day === 0) return 'sunday';
  if (day === 6) return 'saturday';
  return 'weekday';
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function nowMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function isSubteInService(date: Date = new Date()): boolean {
  const dayType = getDayType(date);
  const now = nowMinutes(date);
  const start = timeToMinutes(SERVICE_START[dayType]);

  // Find the latest last train across all lines for this day type
  let latestEnd = 0;
  for (const line of Object.values(LAST_TRAINS)) {
    let endMin = timeToMinutes(line[dayType]) + BUFFER_MINUTES;
    // Handle past-midnight times (e.g. 00:20 + 40 = 01:00)
    if (timeToMinutes(line[dayType]) < 120) endMin += 24 * 60;
    if (endMin > latestEnd) latestEnd = endMin;
  }

  // Normalize for past-midnight comparison
  const nowNorm = now < start ? now + 24 * 60 : now;

  return nowNorm >= start && nowNorm <= latestEnd;
}

export function getNextServiceStart(date: Date = new Date()): string {
  const now = nowMinutes(date);
  const dayType = getDayType(date);
  const start = timeToMinutes(SERVICE_START[dayType]);

  // If we haven't reached today's start yet, return today's start
  if (now < start) {
    return SERVICE_START[dayType];
  }

  // Otherwise return tomorrow's start
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowType = getDayType(tomorrow);
  return SERVICE_START[tomorrowType];
}
