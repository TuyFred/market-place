/**
 * Simple in-memory rate limiter (per-process).
 * Good for single-instance backends; use Redis for multi-instance production.
 */
const buckets = new Map();

function keyOf(parts) {
  return parts.join(':');
}

function prune(now) {
  if (buckets.size < 5000) return;
  for (const [k, v] of buckets) {
    if (v.resetAt < now) buckets.delete(k);
  }
}

/**
 * @returns {{ allowed: boolean, retryAfterSec: number, remaining: number }}
 */
export function consumeRateLimit({ key, limit, windowMs }) {
  const now = Date.now();
  prune(now);
  const k = keyOf([key]);
  let entry = buckets.get(k);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs };
    buckets.set(k, entry);
  }
  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  if (entry.count > limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      remaining: 0
    };
  }
  return { allowed: true, retryAfterSec: 0, remaining };
}

export function clientIp(request) {
  const xf = request.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim();
  return request.ip || request.socket?.remoteAddress || 'unknown';
}
