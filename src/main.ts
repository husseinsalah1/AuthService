import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { AppLogger } from '@/shared/logger';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { formatValidationErrors } from '@/shared/errors/utils/validation-error.util';
import { setupSwagger } from '@/configs/swagger.config';
import { corsConfig } from './configs/cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new AppLogger("NestApplication")

  app.enableCors(corsConfig);

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

  setupSwagger(app);

  const port = process.env.PORT || 8000;
  await app.listen(port, '0.0.0.0');

  logger.log(`Auth Service is running on port ${port}`)
  logger.log(`Swagger docs available at /docs`)

}

bootstrap().catch((error) => {
  console.error('Bootstrap failed:', error);
  process.exit(1);
});
