/* eslint-disable no-undef */
import * as fs from 'fs';
import * as path from 'path';

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
  'nanoid-config.properties',
);

const nanoidProperties = readPropertiesFile(propertiesPath);

export const nanoidConfig = {
  size: parseInt(nanoidProperties.size || '10'),
  alphabet: nanoidProperties.alphabet || '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
};
