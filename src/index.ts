import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { config } from './config/env';
import { connectDB } from './config/database';

// Env vars
dotenv.config();

// Initialize express app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  await connectDB(config.mongodbUri);
  app.listen(config.port, () => {
    console.log(`🚀 Servidor FletesShare iniciado:
      - Entorno: ${config.nodeEnv}
      - Puerto: ${config.port}`);
  });
}

startServer().catch(err => {
  console.error('❌ Error iniciando servidor:', err);
  process.exit(1);
});

export default app;
