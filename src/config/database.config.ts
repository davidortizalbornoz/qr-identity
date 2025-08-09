import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar configuración desde archivo properties
const propertiesPath = path.join(
  process.cwd(),
  'config',
  'postgres-config.properties',
);
dotenv.config({ path: propertiesPath });

export const databaseConfig = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'your_password_here',
  database: process.env.DB_DATABASE || 'qr_identity_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true, // Solo para desarrollo
  logging: false,
};
