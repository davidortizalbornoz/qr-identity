/* eslint-disable no-undef */
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'your_password_here',
  database: process.env.DB_DATABASE || 'qr_identity_db',
  schema: process.env.DB_SCHEMA || 'public',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true, // Solo para desarrollo
  logging: false,
};
