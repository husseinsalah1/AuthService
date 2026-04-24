import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { AppLogger } from 'src/shared/logger';
import { DataSource } from 'typeorm';


const logger = new AppLogger('DatabaseConnection');

export const typeORMConfig: TypeOrmModuleAsyncOptions = {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
        return {
            type: 'postgres',

            host: configService.get<string>('database.host'),
            port: configService.get<number>('database.port'),
            username: configService.get<string>('database.username'),
            password: configService.get<string>('database.password'),
            database: configService.get<string>('database.name'),

            autoLoadEntities: true,
            ssl: true,

            synchronize: configService.get<boolean>('database.synchronize'),
            logging: configService.get<boolean>('database.logging'),
        }
    },
    dataSourceFactory: async (options) => {
        const { DataSource } = await import('typeorm');
        const dataSource = new DataSource(options!);

        try {
            await dataSource.initialize();
            logger.log(`Database connected successfully`);
        } catch (error) {
            logger.error(`Database connection failed`);
            throw error;
        }

        return dataSource;
    },

}

