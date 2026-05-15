import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

if (!process.env.VERCEL) {
  const { config: loadEnv } = await import('dotenv');
  const { dirname, resolve } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  
  const currentFilePath = fileURLToPath(import.meta.url);
  const envPath = currentFilePath.includes('/dist/src/')
    ? resolve(dirname(currentFilePath), '../../.env')
    : resolve(dirname(currentFilePath), '../.env');
  
  loadEnv({ path: envPath, override: true });
}

let app: Awaited<ReturnType<typeof NestFactory.create>>;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.APP_ORIGIN?.split(',').map((o) => o.trim()) || [];

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  if (process.env.VERCEL !== '1') {
    await app.listen(process.env.PORT ?? 3000);
  }
  
  return app;
}

export default bootstrap;
