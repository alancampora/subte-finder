import type { Station } from '../types';
import { STATIONS } from '../stations';
import { lineFriendlyName } from '../utils';

const STORAGE_KEY = 'subte-selected-station';

export const StationPicker = {
  render(): string {
    const lines = [...new Set(STATIONS.map(s => s.line))];

    const cards = lines.map(line => {
      const lineStations = STATIONS.filter(s => s.line === line);
      const color = lineStations[0].color;
      const buttons = lineStations.map(s =>
        `<button class="picker-station" data-name="${s.name}" data-line="${s.line}">${s.name}</button>`
      ).join('');

      return `
        <div class="picker-line-card" style="--line-color: ${color}">
          <div class="picker-line-header">
            <div class="picker-line-dot" style="background: ${color}"></div>
            <div class="picker-line-name">${lineFriendlyName(line)}</div>
          </div>
          <div class="picker-stations">${buttons}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="station-picker">
        <div class="picker-top">
          <div class="picker-label">ELEGÍ TU ESTACIÓN</div>
          <button id="useLocationBtn" class="picker-location-btn">📍 Usar mi ubicación</button>
        </div>
        <input type="text" id="stationSearch" class="picker-search" placeholder="Buscar estación..." autocomplete="off" />
        ${cards}
      </div>
    `;
  },

  getSaved(): Station | null {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const [name, line] = saved.split('|');
    return STATIONS.find(s => s.name === name && s.line === line) || null;
  },

  save(station: Station): void {
    localStorage.setItem(STORAGE_KEY, `${station.name}|${station.line}`);
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
