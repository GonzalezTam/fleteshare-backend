import mongoose from 'mongoose';
import readline from 'readline';
import { CONFIG } from '../src/config/env.config';

// Crear interfaz para input del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Función para pedir confirmación
const askConfirmation = (question: string): Promise<boolean> => {
  return new Promise(resolve => {
    rl.question(`${question} (y/N): `, answer => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes' || answer === '1');
    });
  });
};

const wipe = async () => {
  try {
    // 🛡️ Protección: Solo funciona en desarrollo
    if (CONFIG.isProduction || CONFIG.nodeEnv === 'production') {
      console.log('🌍 Entorno actual:', CONFIG.nodeEnv);
      console.log('🚨 Este script solo funciona en DESARROLLO');
      process.exit(1);
    }

    const dbName = 'fleteshare_local';
    console.log(`💥 Limpieza total rápida de ${dbName}...`);
    console.log('⚠️  Eliminando TODA la base de datos de desarrollo...');

    // Conectar
    await mongoose.connect(CONFIG.mongodbUri!, {
      serverSelectionTimeoutMS: 5000,
    });

    // Mostrar estadísticas rápidas antes de eliminar
    const collections = (await mongoose.connection.db?.listCollections().toArray()) || [];

    if (collections.length === 0) {
      console.log('✨ Base de datos ya está completamente vacía');
      rl.close();
      return;
    }

    console.log(`🗑️  Encontradas ${collections.length} colecciones:`);
    collections.forEach(col => console.log(`   - ${col.name}`));

    // ✨ VALIDACIÓN - Pedir confirmación antes de proceder
    console.log('\n⚠️  Esta operación eliminará TODOS los datos de desarrollo');
    const confirmed = await askConfirmation('¿Estás seguro de que quieres continuar?');

    if (!confirmed) {
      console.log('❌ Operación cancelada por el usuario');
      rl.close();
      return;
    }

    rl.close(); // Cerrar interfaz después de la confirmación

    console.log('\n🚀 Procediendo con la limpieza...');

    // Eliminar toda la base de datos de una vez
    try {
      await mongoose.connection.db?.dropDatabase();
      console.log('✅ Base de datos eliminada completamente');
    } catch (error) {
      // Método de respaldo: eliminar colección por colección
      console.log('⚠️  Usando método alternativo...');
      for (const collection of collections) {
        try {
          await mongoose.connection.db?.collection(collection.name).drop();
          console.log(`   ✅ ${collection.name} eliminada`);
        } catch (collectionError) {
          console.log(`   ❌ Error eliminando ${collection.name}`);
        }
      }
    }

    // Verificar resultado
    const remainingCollections = (await mongoose.connection.db?.listCollections().toArray()) || [];

    console.log('');
    console.log('💀 ¡LIMPIEZA TOTAL COMPLETADA!');

    if (remainingCollections.length === 0) {
      console.log('✅ Base de datos completamente vacía - Como nueva instalación');
      console.log('🔄 Puedes ejecutar npm run db:simpleSeed para crear datos de prueba');
    } else {
      console.log(`⚠️  ${remainingCollections.length} colecciones no pudieron eliminarse`);
    }
  } catch (error) {
    console.error('❌ Error durante la limpieza total:', error);
    rl.close(); // Asegurar que se cierre la interfaz en caso de error
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
    process.exit(0);
  }
};

if (require.main === module) {
  wipe();
}
