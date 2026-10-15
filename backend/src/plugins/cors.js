import cors from '@fastify/cors';
import { env } from '../config/env.js';

/** Always allow the live shop domains (www + apex) plus env-configured origins. */
const PRODUCTION_ORIGINS = [
  'https://www.afroluxo.com',
  'https://afroluxo.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

function parseOriginList(raw) {
  if (!raw || raw.trim() === '*') return null; // null = reflect any origin
  return raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

export async function registerCors(fastify) {
  const fromCors = parseOriginList(process.env.CORS_ORIGIN || env.CORS_ORIGIN || '*');
  const fromFrontend = env.FRONTEND_URL ? [env.FRONTEND_URL.replace(/\/$/, '')] : [];

  // If CORS_ORIGIN is *, allow all (local / open). Otherwise merge allowlist.
  const allowAll = fromCors === null;
  const allowed = allowAll
    ? null
    : [...new Set([...PRODUCTION_ORIGINS, ...fromCors, ...fromFrontend])];

  await fastify.register(cors, {
    origin: allowAll
      ? true
      : (origin, cb) => {
          // Non-browser / same-origin tools may send no Origin
          if (!origin) return cb(null, true);
          if (allowed.includes(origin)) return cb(null, true);
          cb(null, false);
        },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Type'],
    credentials: true,
    maxAge: 86400
  });
}
