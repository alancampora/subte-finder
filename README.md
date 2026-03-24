# Proximo Subte BA

Tiempos de arribo en tiempo real de la red de subtes de Buenos Aires.

Selecciona tu estacion o usa tu ubicacion para ver los proximos trenes, con tiempos de llegada y estado de demoras.

## Stack

- **Frontend**: TypeScript, jQuery, Vite
- **Backend**: Express (proxy hacia la API de transporte de GCBA)
- **Deploy**: Docker, nginx

## Desarrollo

```bash
cp .env.example .env   # completar con credenciales
npm install
npm run dev
```

## Deploy

```bash
./deploy.sh
```

Construye la imagen Docker y levanta el container en el puerto configurado.

## API

La app consume la [API de transporte del Gobierno de la Ciudad de Buenos Aires](https://www.buenosaires.gob.ar/desarrollourbano/transporte/apitransporte). Se necesitan `client_id` y `client_secret` para acceder.

---

Vibecodeado por [Alan](https://github.com/alancampora) y [Claude](https://claude.ai).
