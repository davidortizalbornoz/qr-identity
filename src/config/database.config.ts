/* eslint-disable no-undef */
import * as fs from 'fs';
import * as path from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// Función para leer archivo properties
function readPropertiesFile(filePath: string): Record<string, string> {
  const properties: Record<string, string> = {};
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, value] = trimmedLine.split('=');
        if (key && value) {
          properties[key.trim()] = value.trim();
        }
      }
    }
  } catch (error) {
    console.error('Error leyendo archivo properties:', error);
  }
  
  return properties;
}

// Cargar configuración desde archivo properties
const propertiesPath = path.join(
  process.cwd(),
  'config',
  'postgres-config.properties',
);

const dbProperties = readPropertiesFile(propertiesPath);

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: dbProperties.host || 'localhost',
  port: parseInt(dbProperties.port || '5432'),
  username: dbProperties.user || 'postgres',
  password: dbProperties.password || 'your_password_here',
  database: dbProperties.database || 'qr_identity_db',
  schema: dbProperties.schema || 'public',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true, // Solo para desarrollo
  logging: false,
};
