import { existsSync } from 'fs';
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

/** Any Fly-provided env var indicates we're running on Fly Machines. */
function onFly(): boolean {
  return Boolean(
    process.env.FLY_APP_NAME ||
      process.env.FLY_REGION ||
      process.env.FLY_MACHINE_ID ||
      process.env.FLY_ALLOC_ID ||
      process.env.FLY_PRIVATE_IP,
  );
}

/** True when running inside a generic container runtime (Compose / k8s). Fly uses Firecracker, not Docker. */
function inContainerRuntime(): boolean {
  return existsSync('/.dockerenv') || !!process.env.KUBERNETES_SERVICE_HOST;
}

/**
 * Redis URL resolution:
 * - **Fly.io:** `fly redis attach` sets the `REDIS_URL` secret; read from `process.env.REDIS_URL`.
 * - **Docker Compose:** `REDIS_DOCKER_URL` or rewrite localhost → `redis://redis:6379`.
 * - **Local Nest:** `.env` with `redis://localhost:6379` when Redis runs on the host.
 *
 * Hosted runtimes throw loudly instead of silently falling back to localhost,
 * so misconfiguration fails at boot instead of producing ECONNREFUSED at request time.
 */
export function resolveRedisUrl(): string {
  const docker = process.env.REDIS_DOCKER_URL?.trim();
  if (docker) {
    logger.log('Using REDIS_DOCKER_URL');
    return docker;
  }

  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl && !isLocalRedisUrl(redisUrl)) {
    logger.log('Using REDIS_URL');
    return redisUrl;
  }

  if (onFly()) {
    const app = process.env.FLY_APP_NAME ?? '<app>';
    throw new Error(
      [
        'REDIS_URL is missing or points to localhost on Fly.io.',
        `App: ${app} | Region: ${process.env.FLY_REGION ?? '(unknown)'}`,
        '',
        'Provision Upstash Redis on Fly and attach it (sets REDIS_URL automatically):',
        '  fly redis create',
        `  fly redis attach <your-redis-name> --app ${app}`,
        '  fly secrets list   # confirm REDIS_URL is now present',
        '',
        'Or set an external Redis (Upstash, ElastiCache, etc.) manually:',
        `  fly secrets set REDIS_URL="rediss://default:****@host:6379" --app ${app}`,
      ].join('\n'),
    );
  }

  if (inContainerRuntime() && (!redisUrl || isLocalRedisUrl(redisUrl))) {
    logger.log('Container runtime detected; using redis://redis:6379');
    return 'redis://redis:6379';
  }

  if (redisUrl) {
    logger.log('Using REDIS_URL (local)');
    return redisUrl;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'REDIS_URL is required when NODE_ENV=production. Set REDIS_URL or REDIS_DOCKER_URL.',
    );
  }

  logger.warn('REDIS_URL not set — falling back to redis://127.0.0.1:6379 (local dev only)');
  return 'redis://127.0.0.1:6379';
}
