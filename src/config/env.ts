import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Detect the current environment
const nodeEnv = process.env.NODE_ENV || 'development';
// Loading specific environment file
const envFile = `.env.${nodeEnv}`;
const envPath = path.resolve(process.cwd(), envFile);

if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

// Config object to be used throughout the application
export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
  port: parseInt(process.env.PORT || '8000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/fleteshare_local',
  jwtSecret: process.env.JWT_SECRET || 'default_unsafe_secret',
};

if (!process.env.MONGODB_URI)
  console.warn('⚠️  MONGODB_URI no está definido. Usando valor por defecto.');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'default_unsafe_secret')
  console.warn('⚠️  JWT_SECRET no está definido o es inseguro. Configura un valor seguro.');
