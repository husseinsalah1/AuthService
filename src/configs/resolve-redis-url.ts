/**
 * Compose sets REDIS_DOCKER_URL so host `.env` (often `redis://localhost:6379`) does not
 * make the app connect to itself inside the container. On Fly, require REDIS_URL.
 */
export function resolveRedisUrl(): string {
  const docker = process.env.REDIS_DOCKER_URL?.trim();
  if (docker) return docker;

  const url = process.env.REDIS_URL?.trim();
  if (url) return url;

  if (process.env.FLY_APP_NAME) {
    throw new Error(
      'REDIS_URL is not set. Add a Redis URL, e.g. fly secrets set REDIS_URL="redis://default:PASSWORD@HOST:PORT"',
    );
  }

  return 'redis://127.0.0.1:6379';
}
