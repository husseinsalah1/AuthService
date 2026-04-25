import { existsSync } from 'fs';

function isLocalRedisUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    return h === 'localhost' || h === '127.0.0.1' || h === '::1';
  } catch {
    return false;
  }
}

/** True when code is almost certainly running inside a container (not your laptop shell). */
function inContainerRuntime(): boolean {
  return (
    existsSync('/.dockerenv') ||
    !!process.env.KUBERNETES_SERVICE_HOST
  );
}

/**
 * Compose should set REDIS_DOCKER_URL (see docker-compose.yml). Host `.env` often uses
 * `redis://localhost:6379`, which inside a container points at the wrong place — we
 * rewrite to the default Compose service name in that case.
 */
export function resolveRedisUrl(): string {
  const docker = process.env.REDIS_DOCKER_URL?.trim();
  if (docker) return docker;

  const fromEnv = process.env.REDIS_URL?.trim();

  if (inContainerRuntime() && (!fromEnv || isLocalRedisUrl(fromEnv))) {
    return 'redis://redis:6379';
  }

  if (fromEnv) return fromEnv;

  if (process.env.FLY_APP_NAME) {
    throw new Error(
      'REDIS_URL is not set. Add a Redis URL, e.g. fly secrets set REDIS_URL="redis://default:PASSWORD@HOST:PORT"',
    );
  }

  return 'redis://127.0.0.1:6379';
}
