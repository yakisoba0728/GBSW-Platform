import { NestFactory } from '@nestjs/core';
import { validateApiRuntimeEnv } from './config/runtime-env';
import { AppModule } from './app.module';

async function bootstrap() {
  validateApiRuntimeEnv();

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [`http://localhost:${process.env.WEB_PORT ?? '3000'}`],
  });

  await app.listen(process.env.API_PORT ?? 3001);
}

void bootstrap();
