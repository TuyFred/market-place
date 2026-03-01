import { buildApp } from './app.js';
import { env } from './config/env.js';

const start = async () => {
  const fastify = await buildApp();

  try {
    await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
    fastify.swagger();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

