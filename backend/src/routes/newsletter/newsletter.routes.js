import { subscribeHandler } from '../../controllers/newsletter.controller.js';
import { errorResponseSchema } from '../../schemas/error.schema.js';
import { consumeRateLimit, clientIp } from '../../utils/rateLimit.js';

async function subscribeRateLimit(request, reply) {
  const ip = clientIp(request);
  const result = consumeRateLimit({
    key: `newsletter:${ip}`,
    limit: 8,
    windowMs: 60 * 60 * 1000
  });
  if (!result.allowed) {
    reply.header('Retry-After', String(result.retryAfterSec));
    return reply.code(429).send({ message: 'Too many subscribe attempts. Try later.' });
  }
}

export async function newsletterRoutes(fastify) {
  fastify.post(
    '/subscribe',
    {
      preHandler: [subscribeRateLimit],
      schema: {
        tags: ['Newsletter'],
        body: {
          type: 'object',
          required: ['email'],
          additionalProperties: false,
          properties: {
            email: { type: 'string', format: 'email' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: { message: { type: 'string' } }
          },
          400: errorResponseSchema,
          429: errorResponseSchema
        }
      }
    },
    subscribeHandler
  );
}
