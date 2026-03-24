import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

// ─── Validate required env vars ─────────────────────────────────────────────
const required = ['SUBTE_API_URL', 'SUBTE_CLIENT_ID', 'SUBTE_CLIENT_SECRET'] as const;
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const app = express();

// ─── Security headers ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginOpenerPolicy: false,
  contentSecurityPolicy: false,
}));

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || false,
}));

// ─── Rate limiting ──────────────────────────────────────────────────────────
app.use('/subte', rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ─── Static files ────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'client')));

// ─── Endpoint principal ──────────────────────────────────────────────────────
app.get('/subte', async (_req: Request, res: Response) => {
  try {
    const url = new URL(process.env.SUBTE_API_URL!);
    url.searchParams.set('client_id', process.env.SUBTE_CLIENT_ID!);
    url.searchParams.set('client_secret', process.env.SUBTE_CLIENT_SECRET!);

    const apiRes = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
    });

    if (!apiRes.ok) {
      const body = await apiRes.text();
      console.error(`[api] Error ${apiRes.status}: ${body}`);
      return res.status(502).json({ error: 'Error al consultar la API de subtes' });
    }

    const data = await apiRes.json();
    return res.json(data);

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[proxy] Error:', message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚇 Subte proxy corriendo en http://localhost:${PORT}`);
  console.log(`   GET /subte   → datos de la API`);
  console.log(`   GET /health  → estado del servidor\n`);
});
