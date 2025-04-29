import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const environment = process.env.NODE_ENV || 'development';
console.log(`🔍 Entorno detectado: ${environment}`);

// Only allow 'development' or 'production' as valid environments
const validEnvironment = ['development', 'production'].includes(environment)
  ? environment
  : 'development';

// Define the path to the .env file based on the environment
const envFile = `.env.${validEnvironment}`;
const defaultEnvFile = '.env';

// Search for the .env file in the current working directory
const envPath = fs.existsSync(path.resolve(process.cwd(), envFile))
  ? path.resolve(process.cwd(), envFile)
  : path.resolve(process.cwd(), defaultEnvFile);

console.log(`📄 Cargando configuración desde: ${envPath}`);

// Load environment variables from the .env file
const envConfig = dotenv.config({ path: envPath });
if (envConfig.error) console.warn(`⚠️ No se pudo cargar el archivo ${envPath}`);

// Config object to be used throughout the application
export const config = {
  nodeEnv: validEnvironment,
  port: parseInt(process.env.PORT || '8000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/fleteshare_local',
  databaseName: validEnvironment === 'production' ? 'fleteshare_prod' : 'fleteshare_local',
  jwtSecret: process.env.JWT_SECRET || 'default_unsafe_secret',
  isProduction: validEnvironment === 'production',
  isDevelopment: validEnvironment === 'development',
  // etc
};

// Validar configuración crítica
if (!process.env.MONGODB_URI)
  console.warn('⚠️  MONGODB_URI no está definido. Usando valor por defecto.');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'default_unsafe_secret')
  console.warn('⚠️  JWT_SECRET no está definido o es inseguro. Configura un valor seguro.');

console.log(`
    🚀 Configuración cargada:
    - Entorno: ${config.nodeEnv}
    - Puerto: ${config.port}
    - Base de datos: ${config.databaseName}
    `);
