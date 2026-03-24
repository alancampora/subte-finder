import type { Station } from '../types';
import { formatDistance, lineFriendlyName } from '../utils';

export const StationCard = {
  render(station: Station, distance: number | null): string {
    const distHtml = distance !== null
      ? `<div class="distance-badge">📍 ${formatDistance(distance)}</div>`
      : '';
    return `
      <div class="station-card" style="--line-color: ${station.color}">
        <div class="station-header">
          <div class="station-name">${station.name}</div>
          ${distHtml}
        </div>
        <div class="station-meta">
          <div class="line-badge">
            <div class="line-dot" style="background:${station.color}"></div>
            <div class="line-name">${lineFriendlyName(station.line)}</div>
          </div>
          <button class="change-station-btn" id="changeStation">Cambiar</button>
        </div>
      </div>
    `;
  },
};
