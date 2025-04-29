import mongoose from 'mongoose';
import { config } from './env';

// MongoDB connection method
export const connectDB = async (uri: string): Promise<void> => {
  try {
    if (!uri) throw new Error('La URI de MongoDB no está definida');
    if (mongoose.connection.readyState === 1) return;

    const options: mongoose.ConnectOptions = {};

    if (config.isProduction) {
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

    const dbName = uri.split('/').pop()?.split('?')[0] || 'desconocida';
    console.log(`🔌 Iniciando conexion a MongoDB. Base de datos: ${dbName}`);

    await mongoose.connect(uri, options);

    // Log available collections in development mode
    if (config.isDevelopment) {
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
    console.error('❌ Error al conectar MongoDB');
    throw error;
  }
};

// Connection events
mongoose.connection.on('disconnected', () => console.log('🔌 MongoDB desconectado'));

// Close connection if the process is terminated
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑 Conexión MongoDB cerrada');
  process.exit(0);
});
