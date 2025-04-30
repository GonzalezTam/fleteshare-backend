import mongoose from 'mongoose';
import { CONFIG } from './env';

// MongoDB connection method
export const connectDB = async (): Promise<void> => {
  try {
    // if (!uri) throw new Error('La URI de MongoDB no está definida');
    if (mongoose.connection.readyState === 1) return;

    const options: mongoose.ConnectOptions = {};

    if (CONFIG.isProduction) {
      // Production options
      Object.assign(options, {
        maxPoolSize: 50,
        minPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
    } else {
      // Development options
      Object.assign(options, {
        serverSelectionTimeoutMS: 5000,
      });
    }

    const dbName = CONFIG.isDevelopment ? 'fleteshare_local' : 'fleteshare_prod';
    console.log(`Iniciando conexión a la base de datos ${dbName} ...`);

    await mongoose.connect(CONFIG.mongodbUri!, options);

    // Log available collections in development mode
    if (CONFIG.isDevelopment) {
      const collections = (await mongoose.connection.db?.listCollections().toArray()) || [];
      if (collections.length === 0) {
        console.log('🔍 No hay colecciones disponibles en la base de datos.');
        return;
      }
      console.log('📋 Colecciones disponibles:');
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    }
  } catch (error) {
    console.log('🔌 Error al conectar MongoDB');
    throw error;
  }
};

// Close connection if the process is terminated
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑 Conexión MongoDB cerrada');
  process.exit(0);
});
