import {
    Injectable,
    OnModuleInit,
    OnModuleDestroy,
} from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { AppLogger } from '../../shared/logger';
import { resolveRedisUrl } from '../../configs/resolve-redis-url';

function shouldForceIpv4(url: string): boolean {
    try {
        const h = new URL(url).hostname.toLowerCase();
        return h === 'redis' || h === 'host.docker.internal';
    } catch {
        return false;
    }
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new AppLogger(RedisService.name);
    private client: RedisClientType;

    // ── Lifecycle ────────────────────────────────────────────────────────────────

    async onModuleInit() {
        const url = resolveRedisUrl();
        this.client = createClient({
            url,
            // Force IPv4 only for Docker Compose (`redis` / `host.docker.internal`).
            // Fly's Upstash Redis is IPv6-internal — let Node decide otherwise.
            socket: shouldForceIpv4(url) ? { family: 4 } : undefined,
        }) as RedisClientType;

        this.client.on('error', (err) =>
            this.logger.error('Redis client error', err),
        );
        this.client.on('connect', () => this.logger.log('Redis connected'));
        this.client.on('reconnecting', () => this.logger.warn('Redis reconnecting...'));

        await this.client.connect();
    }

    async onModuleDestroy() {
        await this.client.quit();
        this.logger.log('Redis connection closed');
    }

    // ── Core Methods ─────────────────────────────────────────────────────────────

    /** Store a key with a TTL in seconds */
    async set(key: string, value: string, ttlSeconds: number): Promise<void> {
        await this.client.set(key, value, { EX: ttlSeconds });
        this.logger.debug(`SET ${key} (TTL: ${ttlSeconds}s)`);
    }

    /** Retrieve a value — returns null if missing or expired */
    async get(key: string): Promise<string | null> {
        const value = await this.client.get(key);
        return typeof value === 'string' ? value : null;
    }

    /** Delete one or more keys */
    async del(...keys: string[]): Promise<void> {
        await this.client.del(keys);
        this.logger.debug(`DEL ${keys.join(', ')}`);
    }

    /** Remaining TTL in seconds (-1 = no TTL, -2 = key not found) */
    async ttl(key: string): Promise<number> {
        return this.client.ttl(key);
    }

    /** Check if a key exists */
    async exists(key: string): Promise<boolean> {
        const count = await this.client.exists(key);
        return count > 0;
    }

    /** Increment a numeric value (creates key at 0 then increments) */
    async incr(key: string): Promise<number> {
        return this.client.incr(key);
    }

    /** Set expiry on an existing key */
    async expire(key: string, ttlSeconds: number): Promise<void> {
        await this.client.expire(key, ttlSeconds);
    }
}