import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Detect the current environment
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = `.env.${nodeEnv}`;
const envPath = path.resolve(process.cwd(), envFile);

if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

// Config object to be used throughout the application
export const CONFIG = {
  nodeEnv: process.env.NODE_ENV,
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
  port: process.env.PORT,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  corsAllowedOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.BACKOFFICE_URL || 'http://localhost:5174',
  ],
};

if (!process.env.FRONTEND_URL) console.warn('⚠️  FRONTEND_URL no está definido');
if (!process.env.BACKOFFICE_URL) console.warn('⚠️  BACKOFFICE_URL no está definido.');

if (!process.env.MONGODB_URI)
  console.warn('⚠️  MONGODB_URI no está definido. Usando valor por defecto.');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'default_unsafe_secret')
  console.warn('⚠️  JWT_SECRET no está definido o es inseguro. Configura un valor seguro.');
