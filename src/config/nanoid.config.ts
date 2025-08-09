import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar configuración desde archivo properties
const propertiesPath = path.join(
  process.cwd(),
  'config',
  'nanoid-config.properties',
);
dotenv.config({ path: propertiesPath });

export const nanoidConfig = {
  size: parseInt(process.env.NANOID_SIZE || '10'),
  alphabet: process.env.NANOID_ALPHABET || '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
};
