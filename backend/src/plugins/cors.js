import cors from '@fastify/cors';

export async function registerCors(fastify) {
  const raw = process.env.CORS_ORIGIN || '*';
  const origin =
    raw === '*'
      ? true
      : raw.split(',').map((s) => s.trim()).filter(Boolean);

  await fastify.register(cors, {
    origin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });
}
