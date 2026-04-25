import { registerAs } from '@nestjs/config'


export default registerAs('database', () => ({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    synchronize: process.env.DB_SYNC === 'true',
    logging: process.env.DB_LOGGING === 'true',
    /** Neon / RDS often require TLS; local Postgres typically does not. */
    ssl: process.env.DB_SSL === 'true',
}))