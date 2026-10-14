import { createHash, randomBytes } from 'crypto';

export function createRawToken(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}

export function hashToken(raw) {
  return createHash('sha256').update(String(raw)).digest('hex');
}
