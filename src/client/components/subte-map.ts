import type { SubteApiResponse, SubteEntity, Station } from '../types';
import { STATIONS } from '../stations';
import { lineFriendlyName } from '../utils';

interface TrainPosition {
  line: string;
  /** 0–1 position along the line track */
  progress: number;
  direction: number;
  stationName: string;
}

const LINE_ORDER = ['LineaA', 'LineaB', 'LineaC', 'LineaD', 'LineaE', 'LineaH'];

function estimateTrainPositions(data: SubteApiResponse): TrainPosition[] {
  const positions: TrainPosition[] = [];
  const now = Math.floor(Date.now() / 1000);

  (data.Entity || []).forEach((entity: SubteEntity) => {
    const line = entity.Linea.Route_Id;
    const lineStations = STATIONS.filter(s => s.line === line);
    if (lineStations.length === 0) return;

    const estaciones = entity.Linea.Estaciones;
    if (estaciones.length === 0) return;

    // Find the station closest to now (smallest absolute diff)
    // The API often returns negative times for stations the train already passed
    let nearestIdx = -1;
    let nearestAbsDiff = Infinity;
    let nearestDiff = 0;
    let nearestName = '';
    estaciones.forEach(est => {
      const diff = est.arrival.time - now;
      const absDiff = Math.abs(diff);
      if (absDiff < nearestAbsDiff) {
        nearestAbsDiff = absDiff;
        nearestDiff = diff;
        const stIdx = lineStations.findIndex(s =>
          s.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() ===
          est.stop_name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        );
        if (stIdx >= 0) {
          nearestIdx = stIdx;
          nearestName = lineStations[stIdx].name;
        }
      }
    });

    if (nearestIdx < 0) return;

    const total = lineStations.length - 1;
    const progress = nearestIdx / total;

    positions.push({ line, progress, direction: entity.Linea.Direction_ID, stationName: nearestName });
  });

  return positions;
}

export const SubteMap = {
  render(data: SubteApiResponse | null, selectedStation: Station | null): string {
    const trains = data ? estimateTrainPositions(data) : [];

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

      const lineTrains = trains.filter(t => t.line === lineId);
      const trainDots = lineTrains.map((t, i) => {
        const pct = t.progress * 100;
        const labelCls = i % 2 === 0 ? 'map-train-label map-train-label-top' : 'map-train-label map-train-label-bottom';
        return `<div class="map-train" style="left: ${pct}%; background: ${color}">
          <span class="${labelCls}">${t.stationName}</span>
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
          <span class="map-legend-item"><span class="map-legend-train"></span> Tren</span>
          ${selectedStation ? '<span class="map-legend-item"><span class="map-legend-selected"></span> Tu estacion</span>' : ''}
        </div>
      </div>
    `;
  },
};
