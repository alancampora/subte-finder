import type { ActiveFormation, Station } from '../types';
import { STATIONS } from '../stations';
import { lineFriendlyName } from '../utils';

const LINE_ORDER = ['LineaA', 'LineaB', 'LineaC', 'LineaD', 'LineaE', 'LineaH'];

export const SubteMap = {
  render(formations: ActiveFormation[], selectedStation: Station | null): string {
    const lines = LINE_ORDER.map(lineId => {
      const lineStations = STATIONS.filter(s => s.line === lineId);
      if (lineStations.length === 0) return '';
      const color = lineStations[0].color;
      const total = lineStations.length - 1;
      const label = lineId.replace('Linea', '');

      const stationDots = lineStations.map((s, i) => {
        const pct = (i / total) * 100;
        const isSelected = selectedStation && s.name === selectedStation.name && s.line === selectedStation.line;
        const cls = isSelected ? 'map-dot map-dot-selected' : 'map-dot';
        return `<div class="${cls}" style="left: ${pct}%" title="${s.name}">
          <span class="map-dot-label">${s.name}</span>
        </div>`;
      }).join('');

      const lineTrains = formations.filter(t => t.line === lineId);
      const trainDots = lineTrains.map((t, i) => {
        const pct = t.progress * 100;
        const arrow = t.direction === 0 ? '→' : '←';
        const labelCls = i % 2 === 0 ? 'map-train-label map-train-label-top' : 'map-train-label map-train-label-bottom';
        const arrowCls = t.direction === 0 ? 'map-train-arrow-right' : 'map-train-arrow-left';
        return `<div class="map-train ${arrowCls}" style="left: ${pct}%; background: ${color}">
          <span class="${labelCls}">${arrow} ${t.stationName}</span>
        </div>`;
      }).join('');

      return `
        <div class="map-line">
          <div class="map-line-label" style="background: ${color}">${label}</div>
          <div class="map-track-container">
            <div class="map-track" style="background: ${color}"></div>
            ${stationDots}
            ${trainDots}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="subte-map">
        <div class="map-header">
          <div class="map-title">MAPA DE LA RED</div>
        </div>
        ${lines}
        <div class="map-legend">
          <span class="map-legend-item"><span class="map-legend-dot"></span> Estacion</span>
          <span class="map-legend-item"><span class="map-legend-train"></span> Formacion</span>
          ${selectedStation ? '<span class="map-legend-item"><span class="map-legend-selected"></span> Tu estacion</span>' : ''}
        </div>
      </div>
    `;
  },
};
