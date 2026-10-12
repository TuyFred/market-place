import { buildApp } from './app.js';
import { env } from './config/env.js';

const start = async () => {
  const fastify = await buildApp();

  // Root health check: quick readiness ping at '/'
  fastify.get('/', async () => ({ status: 'ok', env: env.NODE_ENV }));

  try {
    await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
    fastify.swagger();
    fastify.log.info(`Server started on port ${env.PORT} — health: GET / or /health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

