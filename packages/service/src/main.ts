import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import secureSession from '@fastify/secure-session';
import cors from '@fastify/cors';
import fastifyCsrf from '@fastify/csrf-protection';
import compression from '@fastify/compress';

async function bootstrap() {
  const logger = new Logger('Main');
  logger.verbose('Load fastify adapter');
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  logger.verbose('Enabling CORS');
  app.register(cors);

  logger.verbose('Enabling CSRF protection');
  await app.register(fastifyCsrf);

  logger.verbose('Enabling compression');
  await app.register(compression, { encodings: ['gzip', 'deflate'] });

  logger.verbose('ConfigService boilerplate');
  const configService = app.get(ConfigService);

  logger.verbose('Session boilerplate');
  const session = configService.get('session');
  await app.register(secureSession, session);

  logger.verbose('Swagger boilerplate');
  const docInstance = new DocumentBuilder().build();
  const document = SwaggerModule.createDocument(app, docInstance);
  SwaggerModule.setup('api', app, document);

  logger.verbose('Enable validationpipe');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  logger.verbose('Start the app');
  const port = configService.get('port');
  logger.verbose(`Starting app on port ${port}`);
  await app.listen(port);
}
bootstrap();
