import multipart from '@fastify/multipart';

export async function registerMultipart(fastify) {
  await fastify.register(multipart, {
    limits: {
      files: 5,
      fileSize: 40 * 1024 * 1024, // hard ceiling; per-type checks in upload.js
      fields: 20,
      fieldSize: 64 * 1024
    }
  });
}
