import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { validateApiRuntimeEnv } from './config/runtime-env';
import { AppModule } from './app.module';

async function bootstrap() {
  validateApiRuntimeEnv();

  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );
  app.enableCors({
    origin: readAllowedOrigins(),
    credentials: true,
  });

  await app.listen(process.env.API_PORT ?? 3001);
}

void bootstrap();

function readAllowedOrigins() {
  const defaultOrigin = `http://localhost:${process.env.WEB_PORT ?? '3000'}`;
  const configuredOrigins = [
    process.env.WEB_ORIGINS,
    process.env.WEB_ORIGIN,
    process.env.API_CORS_ORIGINS,
    process.env.API_CORS_ORIGIN,
  ]
    .flatMap((value) => (value ? value.split(',') : []))
    .map((origin) => origin.trim())
    .filter(Boolean);

  return Array.from(new Set([defaultOrigin, ...configuredOrigins]));
}
