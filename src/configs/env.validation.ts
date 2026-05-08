type EnvMap = Record<string, string | undefined>;

function collectMissing(env: EnvMap, keys: string[]): string[] {
    return keys.filter((key) => !env[key] || env[key]?.trim().length === 0);
}

export function validateEnv(env: EnvMap): EnvMap {
    const requiredKeys = [
        'DB_HOST',
        'DB_PORT',
        'DB_USERNAME',
        'DB_PASSWORD',
        'DB_NAME',
        'JWT_ACCESS_SECRET',
        'JWT_REFRESH_SECRET',
    ];

    const missing = collectMissing(env, requiredKeys);

    if (env.NODE_ENV === 'production') {
        missing.push(...collectMissing(env, ['REDIS_URL']));
    }

    if (missing.length > 0) {
        const uniqueMissing = [...new Set(missing)];
        throw new Error(
            `Missing required environment variable(s): ${uniqueMissing.join(', ')}`,
        );
    }

    return env;
}
