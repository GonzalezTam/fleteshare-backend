import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { config } from './config/env';
import { connectDB } from './config/database';

// Env vars
dotenv.config();

// Connect to database
connectDB(config.mongodbUri);

// Initialize express app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'FletesShare API funcionando correctamente' });
});

// Initialize server
app.listen(config.port, () => {
  console.log(`💪 Server iniciado en el puerto ${config.port}`);
});

export default app;
