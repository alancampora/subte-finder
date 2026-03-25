import $ from 'jquery';
import type { SubteApiResponse, FormationsResponse, Station } from './types';
import { findNearestStation, findRelevantTrips } from './utils';
import { STATIONS } from './stations';
import { ErrorCard } from './components/error-card';
import { StatusBar } from './components/status-bar';
import { StationCard } from './components/station-card';
import { TrainList } from './components/train-list';
import { RefreshBar } from './components/refresh-bar';
import { StationPicker } from './components/station-picker';
import { isSubteInService, getNextServiceStart } from './schedule';
import { SubteMap } from './components/subte-map';
import { ThemeToggle } from './components/theme-toggle';

const API_ENDPOINT = '/subte';
const REFRESH_INTERVAL = 30;

let currentStation: Station | null = null;
let currentDistance: number | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let countdownTimer: ReturnType<typeof setInterval> | null = null;

function showPicker(): void {
  clearTimers();
  $('#statusBar').empty();
  $('#results').html(StationPicker.render());

  $('.picker-station').on('click', function () {
    const name = $(this).data('name') as string;
    const line = $(this).data('line') as string;
    const station = STATIONS.find(s => s.name === name && s.line === line);
    if (station) {
      StationPicker.save(station);
      currentStation = station;
      currentDistance = null;
      fetchAndRender();
    }
  });

  $('#stationSearch').on('input', function () {
    const query = ($(this).val() as string).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    $('.picker-line-card').show();
    $('.picker-station').each(function () {
      const name = ($(this).data('name') as string).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      $(this).toggle(name.includes(query));
    });
    $('.picker-line-card').each(function () {
      const hasVisible = $(this).find('.picker-station:visible').length > 0;
      $(this).toggle(hasVisible);
    });
  });

  $('#useLocationBtn').on('click', () => {
    StationPicker.clear();
    requestLocation();
  });
}

function fetchAndRender(): void {
  if (!currentStation) {
    StatusBar.render('Esperando estacion...', 'loading');
    return;
  }

  if (!isSubteInService()) {
    const nextStart = getNextServiceStart();
    let html = StationCard.render(currentStation, currentDistance);
    html += ErrorCard.render(`Servicio fuera de horario.<br>Proximo inicio: <strong>${nextStart} hs</strong>`);
    $('#results').html(html);
    bindChangeStation();
    StatusBar.render('Fuera de servicio', '');
    clearTimers();
    return;
  }

  StatusBar.render('Actualizando...', 'loading');

  $.when(
    $.ajax({ url: API_ENDPOINT }),
    $.ajax({ url: '/subte/formaciones' }),
  ).then(
    (subteRes: [SubteApiResponse], formacionesRes: [FormationsResponse]) => {
      renderResults(subteRes[0], formacionesRes[0]);
      const time = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      StatusBar.render(`Actualizado · ${time}`, 'ok');
      startCountdown();
    },
    (xhr: JQuery.jqXHR) => {
      StatusBar.render('Error al obtener datos', 'error');
      $('#results').html(
        ErrorCard.render(`Error ${xhr.status}: No se pudo conectar a la API.<br><small>${xhr.statusText}</small>`)
      );
    },
  );
}

function renderResults(data: SubteApiResponse, formationData?: FormationsResponse): void {
  const trips = findRelevantTrips(data.Entity || [], currentStation!);

  let html = StationCard.render(currentStation!, currentDistance);

  if (trips.length === 0) {
    html += ErrorCard.render(`No hay trenes activos para <strong>${currentStation!.name}</strong> en este momento.`);
  } else {
    html += TrainList.render(trips, currentStation!.color);
  }

  html += SubteMap.render(formationData?.formations || [], currentStation);
  html += RefreshBar.render();

  $('#results').html(html);
  bindChangeStation();
  $('#refreshNow').on('click', () => {
    clearTimers();
    fetchAndRender();
  });
}

function bindChangeStation(): void {
  $('#changeStation').on('click', showPicker);
}

function startCountdown(): void {
  clearTimers();
  let secs = REFRESH_INTERVAL;

  countdownTimer = setInterval(() => {
    secs--;
    $('#countdown').text(secs);
    if (secs <= 0 && countdownTimer) clearInterval(countdownTimer);
  }, 1000);

  refreshTimer = setTimeout(fetchAndRender, REFRESH_INTERVAL * 1000);
}

function clearTimers(): void {
  if (refreshTimer) clearTimeout(refreshTimer);
  if (countdownTimer) clearInterval(countdownTimer);
  refreshTimer = null;
  countdownTimer = null;
}

function requestLocation(): void {
  StatusBar.render('Obteniendo ubicacion...', 'loading');

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { station, distance } = findNearestStation(pos.coords.latitude, pos.coords.longitude);
      currentStation = station;
      currentDistance = distance;
      fetchAndRender();
    },
    err => {
      StatusBar.render('No se pudo obtener ubicacion', 'error');
      $('#results').html(
        ErrorCard.render(`No se pudo acceder a tu ubicacion.<br><small>${err.message}</small>`)
      );
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

$(() => {
  ThemeToggle.init();
  $('#main').html(`${StatusBar.renderContainer()}<div id="results"></div>`);

  const saved = StationPicker.getSaved();
  if (saved) {
    currentStation = saved;
    currentDistance = null;
    fetchAndRender();
  } else {
    showPicker();
  }
});
