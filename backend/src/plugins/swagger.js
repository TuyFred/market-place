import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { swaggerConfig } from '../config/swagger.js';

export async function registerSwagger(fastify) {
  await fastify.register(swagger, swaggerConfig);
  await fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list'
    }
  });
}

