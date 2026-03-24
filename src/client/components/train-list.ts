import type { RelevantTrip, SubteEntity, StopEstacion } from '../types';
import { formatDelay, formatTime, minutesUntil, getDirectionLabel } from '../utils';

export const TrainList = {
  render(trips: RelevantTrip[], lineColor: string): string {
    let html = '<div class="section-title">Proximas llegadas</div><div class="trains-list">';

    trips.forEach(({ entity, stop }) => {
      html += TrainList.renderCard(entity, stop, lineColor);
    });

    html += '</div>';
    return html;
  },

  renderCard(entity: SubteEntity, stop: StopEstacion, lineColor: string): string {
    const delay = formatDelay(stop.arrival.delay);
    const arrTime = formatTime(stop.arrival.time);
    const minsLeft = minutesUntil(stop.arrival.time);
    const dirLabel = getDirectionLabel(entity);
    const minsText = minsLeft <= 0 ? 'ahora' : minsLeft === 1 ? '1 min' : `${minsLeft} min`;

    return `
      <div class="train-card" style="--line-color: ${lineColor}">
        <div class="train-left">
          <div class="train-direction">${dirLabel}</div>
          <div class="train-time-label">llega en ${minsText}</div>
        </div>
        <div class="train-right">
          <div class="arrival-time">${arrTime}</div>
          <div class="delay-badge ${delay.cls}">${delay.label}</div>
        </div>
      </div>
    `;
  },
};
