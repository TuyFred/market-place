import Fastify from 'fastify';
import { env } from './config/env.js';
import { registerCors } from './plugins/cors.js';
import { registerSwagger } from './plugins/swagger.js';
import { registerMultipart } from './plugins/multipart.js';
import { registerRoutes } from './routes/index.js';

export async function buildApp(options = {}) {
  const fastify = Fastify({
    logger: true,
    ...options
  });

  fastify.get('/health', async () => ({ status: 'ok', env: env.NODE_ENV }));

  // Register Swagger at root context so .swagger() is available in server.js
  await registerSwagger(fastify);

  fastify.register(async (instance) => {
    await registerCors(instance);
    await registerMultipart(instance);
    await registerRoutes(instance);
  }, { prefix: '/api' });

  return fastify;
}
