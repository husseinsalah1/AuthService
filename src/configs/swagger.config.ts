import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
    const swaggerConfig = new DocumentBuilder()
        .setTitle('Auth Service API')
        .setDescription(
            'Authentication, authorization, users, roles, and permissions API for the e-commerce platform.',
        )
        .setVersion('1.0.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Paste access token as: Bearer <token>',
            },
            'access-token',
        )
        .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, swaggerDocument, {
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'none',
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
        customSiteTitle: 'Auth Service API Docs',
    });
}
