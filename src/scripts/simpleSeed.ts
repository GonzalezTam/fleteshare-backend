import mongoose from 'mongoose';
import readline from 'readline';
import { CONFIG } from '@/config/env.config';
import { UserRole, UserLicense, UserLicenseStatus, ITransporterVehicle } from '@/types/user.types';
import { readImageAsBuffer } from '@/utils/file.utils';
import { IAddress } from '@/types/freight.types';

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
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string;
  address?: IAddress;
  vehicle?: ITransporterVehicle;
  license?: UserLicense | null;
  licenseStatus?: UserLicenseStatus;
  isProfileCompleted?: boolean;
}

interface CreatedUsers {
  adminUserId?: string;
  transportista2Id?: string;
  cliente2Id?: string;
}

// Usuarios de prueba
const testUsers: TestUser[] = [
  {
    username: 'admin@mail.com',
    password: 'admin123',
    role: 'admin',
    firstName: 'Ana',
    lastName: 'Administradora',
    phone: '+54911234569',
  },
  {
    username: 'cliente@mail.com',
    password: 'cliente123',
    role: 'customer',
    firstName: 'Juan',
    lastName: 'Perez',
    phone: '+54911234567',
  },
  {
    username: 'cliente2@mail.com',
    password: 'cliente123',
    role: 'customer',
    firstName: 'Maria',
    lastName: 'Gomez',
    phone: '+54911234570',
  },
  {
    username: 'transportista@mail.com',
    password: 'camion123',
    role: 'transporter',
    firstName: 'Carlos',
    lastName: 'Rodriguez',
    phone: '+54911234568',
  },
  {
    username: 'transportista2@mail.com',
    password: 'camion123',
    role: 'transporter',
    firstName: 'Mariano',
    lastName: 'Martinez',
    phone: '+54911234571',
  },
];

/**
 * Validar que el entorno sea de desarrollo
 */
const validateEnvironment = (): void => {
  if (CONFIG.isProduction || CONFIG.nodeEnv === 'production') {
    console.log('🌍 Entorno actual:', CONFIG.nodeEnv);
    console.log('🚨 Este script solo funciona en DESARROLLO');
    process.exit(1);
  }
};

/**
 * Conectar a la base de datos
 */
const connectToDatabase = async (): Promise<void> => {
  const dbName = 'fleteshare_local';
  console.log('🚀 Iniciando reset de base de datos de DESARROLLO...');
  console.log(`📡 Conectando a: ${dbName}`);

  await mongoose.connect(CONFIG.mongodbUri!, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log('✅ Conectado a MongoDB');
};

/**
 * Limpiar base de datos existente
 */
const cleanExistingDatabase = async (): Promise<void> => {
  const collections = (await mongoose.connection.db?.listCollections().toArray()) || [];

  if (collections.length > 0) {
    console.log('\n🗑️  Colecciones existentes encontradas:');
    collections.forEach(col => console.log(`   - ${col.name}`));

    console.log('\n⚠️  Esta operación eliminará todas las colecciones y recreará datos de prueba');
    const confirmed = await askConfirmation('¿Estás seguro de que quieres continuar?');

    if (!confirmed) {
      console.log('❌ Operación cancelada por el usuario');
      rl.close();
      process.exit(0);
    }

    rl.close();

    console.log('\n🚀 Procediendo con la limpieza y recreación...');
    console.log('🗑️  Eliminando colecciones existentes...');

    for (const collection of collections) {
      await mongoose.connection.db?.collection(collection.name).drop();
      console.log(`   ✅ Eliminada: ${collection.name}`);
    }
  } else {
    console.log('📭 No hay colecciones para eliminar');
    rl.close();
  }
};

/**
 * Cargar imagen de licencia de prueba
 */
const loadLicenseImage = (): Buffer | null => {
  console.log('\n📸 Cargando imagen de licencia de prueba...');
  const licensePath = 'src/assets/transporter_license_test.jpg';
  return readImageAsBuffer(licensePath);
};

/**
 * Crear usuarios de prueba
 */
const createTestUsers = async (licenseImageBuffer: Buffer | null): Promise<CreatedUsers> => {
  console.log('\n👥 Creando usuarios de prueba usando registerService...');

  const { registerService } = await import('@/services/auth.service');
  const createdUsers: CreatedUsers = {};

  for (const userData of testUsers) {
    try {
      // Preparar licencia solo para transportistas
      let licenseData: UserLicense | undefined;
      if (userData.role === 'transporter' && licenseImageBuffer) {
        licenseData = {
          data: licenseImageBuffer,
          filename: 'transporter_license_test.jpg',
          contentType: 'image/jpeg',
        };
        console.log(`   📄 Preparando licencia para ${userData.username}`);
      }

      const registerData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        password: userData.password,
        confirmPassword: userData.password,
        role: userData.role,
        phone: userData.phone,
        license: licenseData,
      };

      const newUser = await registerService(registerData);
      console.log(`   ✅ Usuario registrado: ${userData.username} (${userData.role})`);

      // Guardar IDs importantes
      if (newUser.role === 'admin') {
        createdUsers.adminUserId = newUser.id;
      }
      if (userData.username === 'transportista2@mail.com') {
        createdUsers.transportista2Id = newUser.id;
      }
      if (newUser.username === 'cliente2@mail.com') {
        createdUsers.cliente2Id = newUser.id;
      }
    } catch (error) {
      console.error(`   ❌ Error creando usuario ${userData.username}:`, error);
    }
  }

  return createdUsers;
};

/**
 * Completar perfil del cliente2
 */

const completeCustomerProfile = async (cliente2Id: string, adminUserId: string): Promise<void> => {
  console.log('\n🔍 Completando perfil de cliente2...');
  try {
    const { updateUserProfileService } = await import('@/services/user.service');
    const profileData = {
      firstName: 'Maria',
      lastName: 'Gomez',
      phone: '+54911234570',
      address: {
        street: 'Miller',
        number: '3046',
        city: 'Buenos Aires',
        state: 'Ciudad Autónoma de Buenos Aires',
        country: 'Argentina',
        postalCode: 'C1431',
        latitude: -34.5664621,
        longitude: -58.4851576,
        formattedAddress:
          '3046, Miller, Villa Urquiza, Buenos Aires, Comuna 12, Ciudad Autónoma de Buenos Aires, C1431, Argentina',
        neighborhood: '',
      },
    };

    const updatedProfile = await updateUserProfileService(cliente2Id, profileData, adminUserId);
    console.log(`   ✅ Perfil de cliente2 completado: ${updatedProfile.username}`);
  } catch (error) {
    console.error('   ❌ Error completando perfil de cliente2:', error);
    throw error;
  }
};

/**
 * Validar usuario transportista2
 */
const validateTransporter = async (
  transportista2Id: string,
  adminUserId: string
): Promise<void> => {
  console.log('\n🔍 Procesando validación de transportista2...');
  try {
    const { validateUserService } = await import('@/services/user.service');
    const resultValidation = await validateUserService(transportista2Id, adminUserId);
    console.log(
      `   ✅ Transportista validado: ${resultValidation.username} (${resultValidation.role})`
    );
  } catch (error) {
    console.error('   ❌ Error validando transportista2:', error);
    throw error;
  }
};

/**
 * Completar perfil del transportista2
 */
const completeTransporterProfile = async (
  transportista2Id: string,
  adminUserId: string,
  licenseImageBuffer: Buffer
): Promise<void> => {
  console.log('\n🔍 Completando perfil de transportista2...');
  try {
    const { updateUserProfileService } = await import('@/services/user.service');
    const profileData = {
      firstName: 'Mariano',
      lastName: 'Martinez',
      phone: '+54911234571',
      vehicle: {
        plate: 'ABC123',
        dimensions: { length: 420, width: 200, height: 220 },
      },
      license: {
        data: licenseImageBuffer,
        filename: 'transporter_license_test.jpg',
        contentType: 'image/jpeg',
      },
    };

    const updatedProfile = await updateUserProfileService(
      transportista2Id,
      profileData,
      adminUserId
    );
    console.log(`   ✅ Perfil de transportista2 completado: ${updatedProfile.username}`);
  } catch (error) {
    console.error('   ❌ Error completando perfil de transportista2:', error);
    throw error;
  }
};

/**
 * Ejecutar validaciones y actualizaciones post-creación
 */
const executePostCreationTasks = async (
  createdUsers: CreatedUsers,
  licenseImageBuffer: Buffer | null
): Promise<void> => {
  const { adminUserId, cliente2Id, transportista2Id } = createdUsers;

  // Completar perfil del cliente2
  if (cliente2Id && adminUserId) {
    await completeCustomerProfile(cliente2Id, adminUserId);
  } else {
    console.log('\n⚠️  No se pudo completar perfil de cliente2 - IDs no encontrados');
    console.log(`   Cliente2 ID: ${cliente2Id || 'No encontrado'}`);
    console.log(`   Admin ID: ${adminUserId || 'No encontrado'}`);
  }

  // Validar transportista2
  if (adminUserId && transportista2Id) {
    await validateTransporter(transportista2Id, adminUserId);
  } else {
    console.log('\n⚠️  No se pudo validar transportista2 - IDs no encontrados');
    console.log(`   Admin ID: ${adminUserId || 'No encontrado'}`);
    console.log(`   Transportista2 ID: ${transportista2Id || 'No encontrado'}`);
  }

  // Completar perfil del transportista2
  if (transportista2Id && adminUserId && licenseImageBuffer) {
    await completeTransporterProfile(transportista2Id, adminUserId, licenseImageBuffer);
  } else {
    console.log('\n⚠️  No se pudo completar perfil de transportista2 - Datos faltantes');
    console.log(`   Transportista2 ID: ${transportista2Id || 'No encontrado'}`);
    console.log(`   Admin ID: ${adminUserId || 'No encontrado'}`);
    console.log(`   Licencia: ${licenseImageBuffer ? 'Disponible' : 'No encontrada'}`);
  }
};

/**
 * Mostrar resumen final
 */
const showFinalSummary = (licenseImageBuffer: Buffer | null): void => {
  console.log('\n🎉 ¡Base de datos de DESARROLLO reinicializada exitosamente!');
  console.log('\n📋 Usuarios de prueba creados:');
  console.log('   👨‍💼 Admin: admin@mail.com / admin123');
  console.log('   👤 Cliente: cliente@mail.com / cliente123 (perfil básico)');
  console.log('   👤 Cliente 2: cliente2@mail.com / cliente123 (perfil completo con dirección)');
  console.log('   🚛 Transportista: transportista@mail.com / camion123 (pendiente de validar)');
  console.log(
    '   🚛 Transportista 2: transportista2@mail.com / camion123 (licencia aprobada, perfil completo)'
  );

  if (!licenseImageBuffer) {
    console.log('\n⚠️  Nota: No se pudo cargar la imagen de licencia de prueba');
    console.log('   Verifica que existe: src/assets/transporter_license_test.jpg');
  }

  console.log('\n📍 Direcciones de prueba configuradas:');
  console.log('   🏠 Cliente 2: Miller 3046, Villa Urquiza, CABA');
  console.log('   📊 Datos completos para testing de geolocalización y mapas');
};

/**
 * Limpiar recursos y cerrar conexiones
 */
const cleanup = async (): Promise<void> => {
  await mongoose.connection.close();
  console.log('\n🔌 Conexión cerrada');
};

/**
 * Función principal del script
 */
const simpleSeed = async (): Promise<void> => {
  try {
    // 1. Validaciones iniciales
    validateEnvironment();

    // 2. Conexión a base de datos
    await connectToDatabase();

    // 3. Limpiar base de datos existente
    await cleanExistingDatabase();

    // 4. Cargar recursos necesarios
    const licenseImageBuffer = loadLicenseImage();

    // 5. Crear usuarios de prueba
    const createdUsers = await createTestUsers(licenseImageBuffer);

    // 6. Ejecutar tareas post-creación
    await executePostCreationTasks(createdUsers, licenseImageBuffer);

    // 7. Mostrar resumen
    showFinalSummary(licenseImageBuffer);
  } catch (error) {
    console.error('❌ Error durante el reset:', error);
    rl.close();
    process.exit(1);
  } finally {
    await cleanup();
    process.exit(0);
  }
};

// Ejecutar el script si es llamado directamente
if (require.main === module) {
  simpleSeed();
}

export default simpleSeed;
