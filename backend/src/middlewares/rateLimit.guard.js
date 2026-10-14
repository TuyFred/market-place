import { consumeRateLimit, clientIp } from '../utils/rateLimit.js';

/** Login: 8 attempts / 15 min per IP+email */
export async function loginRateLimitGuard(request, reply) {
  const email = String(request.body?.email || '')
    .trim()
    .toLowerCase();
  const ip = clientIp(request);
  const result = consumeRateLimit({
    key: `login:${ip}:${email}`,
    limit: 8,
    windowMs: 15 * 60 * 1000
  });
  reply.header('X-RateLimit-Remaining', String(result.remaining));
  if (!result.allowed) {
    reply.header('Retry-After', String(result.retryAfterSec));
    return reply.code(429).send({
      message: `Too many login attempts. Try again in ${result.retryAfterSec} seconds.`
    });
  }
}

/** Public register: 5 / hour per IP */
export async function registerRateLimitGuard(request, reply) {
  const ip = clientIp(request);
  const result = consumeRateLimit({
    key: `register:${ip}`,
    limit: 5,
    windowMs: 60 * 60 * 1000
  });
  if (!result.allowed) {
    reply.header('Retry-After', String(result.retryAfterSec));
    return reply.code(429).send({
      message: `Too many signup attempts. Try again in ${result.retryAfterSec} seconds.`
    });
  }
}

/** Forgot password: 5 / hour per IP */
export async function forgotPasswordRateLimitGuard(request, reply) {
  const ip = clientIp(request);
  const email = String(request.body?.email || '')
    .trim()
    .toLowerCase();
  const result = consumeRateLimit({
    key: `forgot:${ip}:${email}`,
    limit: 5,
    windowMs: 60 * 60 * 1000
  });
  if (!result.allowed) {
    reply.header('Retry-After', String(result.retryAfterSec));
    return reply.code(429).send({
      message: `Too many reset requests. Try again in ${result.retryAfterSec} seconds.`
    });
  }
}

/** General API abuse: 120 req / min per IP on sensitive mutations */
export async function mutationRateLimitGuard(request, reply) {
  const ip = clientIp(request);
  const result = consumeRateLimit({
    key: `mutate:${ip}`,
    limit: 120,
    windowMs: 60 * 1000
  });
  if (!result.allowed) {
    reply.header('Retry-After', String(result.retryAfterSec));
    return reply.code(429).send({ message: 'Too many requests. Slow down.' });
  }
}
