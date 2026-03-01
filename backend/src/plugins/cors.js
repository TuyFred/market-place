import cors from '@fastify/cors';

export async function registerCors(fastify) {
  await fastify.register(cors, {
    origin: '*'
  });
}

