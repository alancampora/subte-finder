import type { Station } from '../types';
import { formatDistance, lineFriendlyName } from '../utils';

export const StationCard = {
  render(station: Station, distance: number): string {
    const distLabel = formatDistance(distance);
    return `
      <div class="station-card" style="--line-color: ${station.color}">
        <div class="station-header">
          <div class="station-name">${station.name}</div>
          <div class="distance-badge">📍 ${distLabel}</div>
        </div>
        <div class="line-badge">
          <div class="line-dot" style="background:${station.color}"></div>
          <div class="line-name">${lineFriendlyName(station.line)}</div>
        </div>
      </div>
    `;
  },
};
