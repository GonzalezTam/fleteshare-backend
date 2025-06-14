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

// Interfaces simplificadas para el script
interface TestUser {
  username: string;
  password: string;
  role: 'admin' | 'customer' | 'transporter';
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
  isValidated: boolean;
}

// Usuarios de prueba
const testUsers: TestUser[] = [
  {
    username: 'cliente@mail.com',
    password: 'Cliente123',
    role: 'customer',
    firstName: 'Juan',
    lastName: 'Cliente',
    phone: '+54911234567',
    isActive: true,
    isValidated: false, // Pendiente de completar perfil
  },
  {
    username: 'transportista@mail.com',
    password: 'Transportista123',
    role: 'transporter',
    firstName: 'Carlos',
    lastName: 'Transportista',
    phone: '+54911234568',
    isActive: true,
    isValidated: false, // Pendiente de validación
  },
  {
    username: 'admin@mail.com',
    password: 'Admin123',
    role: 'admin',
    firstName: 'Ana',
    lastName: 'Administradora',
    phone: '+54911234569',
    isActive: true,
    isValidated: true, // Los admins no necesitan validación
  },
];

// Función principal
const simpleSeed = async () => {
  try {
    // 🛡️ Protección: Solo funciona en desarrollo
    if (CONFIG.isProduction || CONFIG.nodeEnv === 'production') {
      console.log('🌍 Entorno actual:', CONFIG.nodeEnv);
      console.log('🚨 Este script solo funciona en DESARROLLO');
      process.exit(1);
    }

    const dbName = 'fleteshare_local'; // Siempre development
    console.log('🚀 Iniciando reset de base de datos de DESARROLLO...');
    console.log(`📡 Conectando a: ${dbName}`);

    await mongoose.connect(CONFIG.mongodbUri!, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ Conectado a MongoDB');

    // Obtener todas las colecciones
    const collections = (await mongoose.connection.db?.listCollections().toArray()) || [];

    if (collections.length > 0) {
      console.log('\n🗑️  Colecciones existentes encontradas:');
      collections.forEach(col => console.log(`   - ${col.name}`));

      // ✨ VALIDACIÓN - Pedir confirmación antes de proceder
      console.log(
        '\n⚠️  Esta operación eliminará todas las colecciones y recreará datos de prueba'
      );
      const confirmed = await askConfirmation('¿Estás seguro de que quieres continuar?');

      if (!confirmed) {
        console.log('❌ Operación cancelada por el usuario');
        rl.close();
        return;
      }

      rl.close(); // Cerrar interfaz después de la confirmación

      console.log('\n🚀 Procediendo con la limpieza y recreación...');
      console.log('🗑️  Eliminando colecciones existentes...');

      // Eliminar todas las colecciones
      for (const collection of collections) {
        await mongoose.connection.db?.collection(collection.name).drop();
        console.log(`   ✅ Eliminada: ${collection.name}`);
      }
    } else {
      console.log('📭 No hay colecciones para eliminar');
      rl.close(); // Cerrar interfaz si no hay colecciones
    }

    // Crear usuarios de prueba usando el registerService
    console.log('\n👥 Creando usuarios de prueba usando registerService...');

    // Importar el registerService
    const { registerService } = await import('../src/services/auth.service');

    // Crear cada usuario usando el service
    for (const userData of testUsers) {
      try {
        const registerData = {
          firstName: userData.firstName,
          lastName: userData.lastName,
          username: userData.username,
          password: userData.password,
          confirmPassword: userData.password, // Misma contraseña para confirmación
          role: userData.role,
          phone: userData.phone,
          licence: undefined, // No necesario para usuarios de prueba
        };

        const result = await registerService(registerData);
        console.log(`   ✅ Usuario registrado: ${userData.username} (${userData.role})`);

        // Para el admin, establecer isValidated en true después del registro
        if (userData.role === 'admin' && userData.isValidated) {
          const User = mongoose.model('User');
          await User.findByIdAndUpdate(result.id, { isValidated: true });
        }
      } catch (error) {
        console.error(`   ❌ Error creando usuario ${userData.username}:`, error);
      }
    }

    console.log('\n🎉 ¡Base de datos de DESARROLLO reinicializada exitosamente!');
    console.log('\n📋 Usuarios de prueba creados:');
    console.log('   👤 Cliente: cliente@mail.com / Cliente123');
    console.log('   🚛 Transportista: transportista@mail.com / Transportista123');
    console.log('   👨‍💼 Admin: admin@mail.com / Admin123');
    console.log('\n💡 Tips:');
    console.log('   • El transportista necesita validación para acceso completo');
    console.log('   • Todos los usuarios tienen notificaciones de bienvenida');
  } catch (error) {
    console.error('❌ Error durante el reset:', error);
    rl.close(); // Asegurar que se cierre la interfaz en caso de error
    process.exit(1);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
    process.exit(0);
  }
};

// Ejecutar el script si es llamado directamente
if (require.main === module) {
  simpleSeed();
}

export default simpleSeed;
