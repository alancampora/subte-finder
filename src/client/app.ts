import $ from 'jquery';
import type { SubteApiResponse, Station } from './types';
import { findNearestStation, findRelevantTrips } from './utils';
import { ErrorCard } from './components/error-card';
import { StatusBar } from './components/status-bar';
import { StationCard } from './components/station-card';
import { TrainList } from './components/train-list';
import { RefreshBar } from './components/refresh-bar';
import { isSubteInService, getNextServiceStart } from './schedule';
import { ThemeToggle } from './components/theme-toggle';

const API_ENDPOINT = '/subte';
const REFRESH_INTERVAL = 30;

let userLat: number | null = null;
let userLng: number | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let countdownTimer: ReturnType<typeof setInterval> | null = null;

function fetchAndRender(): void {
  if (!userLat || !userLng) {
    StatusBar.render('Esperando ubicacion...', 'loading');
    return;
  }

  if (!isSubteInService()) {
    const nextStart = getNextServiceStart();
    const { station, distance } = findNearestStation(userLat, userLng);
    let html = StationCard.render(station, distance);
    html += ErrorCard.render(`Servicio fuera de horario.<br>Proximo inicio: <strong>${nextStart} hs</strong>`);
    $('#results').html(html);
    StatusBar.render('Fuera de servicio', '');
    clearTimers();
    return;
  }

  const { station, distance } = findNearestStation(userLat, userLng);

  StatusBar.render('Actualizando...', 'loading');

  $.ajax({
    url: API_ENDPOINT,
    success(data: SubteApiResponse) {
      renderResults(data, station, distance);
      const time = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      StatusBar.render(`Actualizado · ${time}`, 'ok');
      startCountdown();
    },
    error(xhr: JQuery.jqXHR) {
      StatusBar.render('Error al obtener datos', 'error');
      $('#results').html(
        ErrorCard.render(`Error ${xhr.status}: No se pudo conectar a la API.<br><small>${xhr.statusText}</small>`)
      );
    }
  });
}

function renderResults(data: SubteApiResponse, station: Station, distance: number): void {
  const trips = findRelevantTrips(data.Entity || [], station);

  let html = StationCard.render(station, distance);

  if (trips.length === 0) {
    html += ErrorCard.render(`No hay trenes activos para <strong>${station.name}</strong> en este momento.`);
  } else {
    html += TrainList.render(trips, station.color);
  }

  html += RefreshBar.render();

  $('#results').html(html);
  $('#refreshNow').on('click', () => {
    clearTimers();
    fetchAndRender();
  });
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
      userLat = pos.coords.latitude;
      userLng = pos.coords.longitude;
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

  if (!navigator.geolocation) {
    $('#main').html(ErrorCard.render('Tu navegador no soporta geolocalizacion.'));
    return;
  }

  $('#main').html(`${StatusBar.renderContainer()}<div id="results"></div>`);
  requestLocation();
});
