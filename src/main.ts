/* eslint-disable no-undef */
import * as dotenv from 'dotenv';

// Cargar variables de entorno AL INICIO
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar límite de tamaño del body para soportar archivos grandes
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  // Configurar timeout para peticiones largas
  app.use((req, res, next) => {
    req.setTimeout(300000); // 5 minutos timeout para archivos grandes
    next();
  });

  // Configurar CORS
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
