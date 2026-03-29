import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [`http://localhost:${process.env.WEB_PORT ?? '3000'}`],
  });

  await app.listen(process.env.API_PORT ?? 3001);
}

void bootstrap();
