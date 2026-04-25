import { AppLogger } from '../shared/logger';

const logger = new AppLogger('ResolveRedisUrl');

function isLocalRedisUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    return h === 'localhost' || h === '127.0.0.1' || h === '::1';
  } catch {
    return false;
  }
}

/**
 * Resolves Redis from `REDIS_URL`. Non-local URLs are used as-is; localhost
 * is allowed for development. In production, `REDIS_URL` must be set.
 */
export function resolveRedisUrl(): string {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl && !isLocalRedisUrl(redisUrl)) {
    logger.log('Using REDIS_URL');
    return redisUrl;
  }

  if (redisUrl) {
    logger.log('Using REDIS_URL (local)');
    return redisUrl;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('REDIS_URL is required when NODE_ENV=production.');
  }

  logger.warn('REDIS_URL not set — falling back to redis://127.0.0.1:6379 (local dev only)');
  return 'redis://127.0.0.1:6379';
}
