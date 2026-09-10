import multipart from '@fastify/multipart';

export async function registerMultipart(fastify) {
  await fastify.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB for HD videos
    }
  });
}

