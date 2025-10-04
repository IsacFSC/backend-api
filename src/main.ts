import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Habilita o CORS
  app.enableCors({
    origin: 'http://localhost:3000', // A origem do seu frontend
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  app.useStaticAssets(join(process.cwd(), 'files'), {
    prefix: '/files/',
  });

  await app.listen(1939);
}
bootstrap();
