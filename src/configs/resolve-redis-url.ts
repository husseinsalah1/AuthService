import { AppLogger } from '@/shared/logger';

const logger = new AppLogger('ResolveRedisUrl');

function isLocalRedisUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();

    return (
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h === '::1' ||
      h === '[::1]'
    );
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
  const isProduction = process.env.NODE_ENV === 'production';

  if (!redisUrl) {
    if (isProduction) {
      throw new Error('REDIS_URL is required when NODE_ENV=production.');
    }

    logger.warn(
      'REDIS_URL not set — falling back to redis://127.0.0.1:6379 local dev only',
    );

    return 'redis://127.0.0.1:6379';
  }

  if (isProduction && isLocalRedisUrl(redisUrl)) {
    throw new Error(
      'Invalid REDIS_URL in production. Do not use localhost/127.0.0.1/::1 on Render. Use external Redis URL.',
    );
  }

  if (isLocalRedisUrl(redisUrl)) {
    logger.warn('Using local REDIS_URL. This should only happen in development.');
    return redisUrl;
  }

  logger.log('Using external REDIS_URL');
  return redisUrl;
}
