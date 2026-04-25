import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLogger } from './shared/logger';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { formatValidationErrors } from './shared/errors/utils/validation-error.util';
import { DataSource } from 'typeorm';
import { seedPermissions } from './database/seeders/permissions.seeder';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new AppLogger("NestApplication")

  const dataSource = app.get(DataSource);

  await seedPermissions(dataSource);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (validationErrors) => {
        return new BadRequestException({
          message: 'Validation failed',
          errors: formatValidationErrors(validationErrors),
        });
      },
    }),
  );
  await app.listen(process.env.PORT || 3000, '0.0.0.0');

  logger.log("Auth Service is running on port 3000")

}

bootstrap();
