import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from './configs/typeorm.config';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from './configs/database.config';
import jwtConfig from './configs/jwt.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { LoggingInterceptor } from './shared/interceptors/logger.interceptors';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './shared/filters/exception.filter';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { RedisModule } from './modules/redis/redis.module';
import { OtpModule } from './modules/otp/otp.module';
import { HealthController } from './health.controller';
import { resolveRedisUrl } from './configs/resolve-redis-url';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig]
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const url = resolveRedisUrl();
        const host = (() => {
          try { return new URL(url).hostname.toLowerCase(); } catch { return ''; }
        })();
        const forceIpv4 = host === 'redis' || host === 'host.docker.internal';
        return {
          store: await redisStore({
            url,
            socket: forceIpv4 ? { family: 4 } : undefined,
          }),
          ttl: 60,
        };
      },
    }),
    TypeOrmModule.forRootAsync(typeORMConfig),
    AuthModule,
    UsersModule,
    RedisModule,
    OtpModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter
    }
  ],
})
export class AppModule { }
