import type { ActiveFormation, Station } from '../types';
import { STATIONS } from '../stations';
import { lineFriendlyName } from '../utils';

const LINE_ORDER = ['LineaA', 'LineaB', 'LineaC', 'LineaD', 'LineaE', 'LineaH'];

function renderTrack(
  lineStations: Station[],
  formations: ActiveFormation[],
  color: string,
  arrowCls: string,
  selectedStation: Station | null,
  showSelectedLabel: boolean,
): string {
  const total = lineStations.length - 1;

  const dots = lineStations.map((s, i) => {
    const pct = (i / total) * 100;
    const isSelected = selectedStation && s.name === selectedStation.name && s.line === selectedStation.line;
    const cls = isSelected ? 'map-dot map-dot-selected' : 'map-dot';
    const labelHtml = isSelected && showSelectedLabel ? `<span class="map-dot-label">${s.name}</span>` : '';
    return `<div class="${cls}" style="left: ${pct}%">${labelHtml}</div>`;
  }).join('');

  const formationDots = formations.map(t => {
    const pct = t.progress * 100;
    return `<div class="map-train ${arrowCls}" style="left: ${pct}%; background: ${color}">
      <span class="map-train-label">${t.stationName}</span>
    </div>`;
  }).join('');

  return `
    <div class="map-track-container">
      <div class="map-track" style="background: ${color}"></div>
      ${dots}
      ${formationDots}
    </div>
  `;
}

export const SubteMap = {
  render(formations: ActiveFormation[], selectedStation: Station | null): string {
    const lines = LINE_ORDER.map(lineId => {
      const lineStations = STATIONS.filter(s => s.line === lineId);
      if (lineStations.length === 0) return '';
      const color = lineStations[0].color;
      const label = lineId.replace('Linea', '');
      const first = lineStations[0].name;
      const last = lineStations[lineStations.length - 1].name;

      const lineFormations = formations.filter(t => t.line === lineId);
      const rightFormations = lineFormations.filter(t => t.direction === 0);
      const leftFormations = lineFormations.filter(t => t.direction === 1);

      const trackRight = renderTrack(lineStations, rightFormations, color, 'map-train-arrow-right', selectedStation, true);
      const trackLeft = renderTrack(lineStations, leftFormations, color, 'map-train-arrow-left', selectedStation, false);

      return `
        <div class="map-line-block">
          <div class="map-line-header-row">
            <div class="map-line-label" style="background: ${color}">${label}</div>
            <span class="map-line-terminals">${first} — ${last}</span>
          </div>
          <div class="map-dual-track">
            <div class="map-direction">
              <span class="map-dir-arrow">→</span>
              ${trackRight}
            </div>
            <div class="map-direction">
              <span class="map-dir-arrow">←</span>
              ${trackLeft}
            </div>
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
