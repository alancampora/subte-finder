# Subte Finder

App para ver el proximo subte de Buenos Aires segun tu ubicacion.

## Stack

- **Server**: Express + TypeScript (`src/server.ts`) — proxy a la API de transporte de GCBA
- **Client**: TypeScript + jQuery + Vite (`src/client/`)
- **Build**: Vite para client, tsc para server. Output en `dist/`

## Scripts

- `npm run dev` — Vite dev server (5173) + Express (3000) en paralelo con concurrently
- `npm run build` — build server (tsc) + client (vite)
- `npm start` — produccion, Express sirve `dist/client/`
- `npm run typecheck` — type-check client sin emitir

## Estructura

```
index.html                  # Entry point de Vite (raiz del proyecto)
public/styles.css           # CSS con dark/light theme via CSS variables
vite.config.ts              # Proxy /subte y /health a Express en dev
tsconfig.json               # Server (CommonJS, outDir: dist)
tsconfig.client.json        # Client (ESNext modules, bundler resolution)
src/
  server.ts                 # Express: proxy /subte con client_id/client_secret como query params
  client/
    types.ts                # Interfaces: Station, SubteEntity, SubteApiResponse, etc.
    stations.ts             # Coordenadas reales de estaciones (datos.gob.ar)
    utils.ts                # Helpers: haversine, findNearestStation, formatTime, normalize, etc.
    schedule.ts             # Horarios de servicio por dia (emova.com.ar), isSubteInService()
    app.ts                  # Orquestador: init, geolocation, fetch, render, countdown
    components/
      error-card.ts         # ErrorCard.render(msg)
      status-bar.ts         # StatusBar.render(msg, type), renderContainer()
      station-card.ts       # StationCard.render(station, distance)
      train-list.ts         # TrainList.render(trips, color)
      refresh-bar.ts        # RefreshBar.render()
      theme-toggle.ts       # ThemeToggle.init() — dark/light con localStorage
```

## API

- Endpoint: `https://apitransporte.buenosaires.gob.ar/subtes/forecastGTFS`
- Auth: `client_id` y `client_secret` como query params (NO hay OAuth/token)
- Respuesta: `{ Entity: [{ Linea: { Route_Id, Direction_ID, Estaciones: [{ stop_name, arrival: { time, delay } }] } }] }`
- Los nombres de estaciones en la API usan acentos (Pueyrredon vs Pueyrredón) — se normalizan con `String.normalize('NFD')` para comparar

## Decisiones

- Las coordenadas de estaciones vienen del dataset oficial de datos.gob.ar (no estimadas)
- Horarios de servicio hardcodeados desde emova.com.ar — si el subte esta fuera de horario se muestra mensaje en vez de datos stale
- El `getDirectionLabel` usa el ultimo elemento de `Estaciones[]` como destino (la API ordena en sentido de marcha)
- Temas dark/light con CSS custom properties, respeta `prefers-color-scheme` del sistema
- jQuery se instala via npm (no CDN) para que Vite lo bundlee

## Notas

- La API no tiene OAuth/token — intentos anteriores con token flow eran incorrectos
- Siempre verificar contra la API real con curl antes de asumir que el render es correcto
- Coordenadas y horarios deben venir de fuentes oficiales (datos.gob.ar, emova.com.ar)
- Los nombres de estaciones en la API tienen acentos — nunca comparar con `===` directo, usar normalize()
