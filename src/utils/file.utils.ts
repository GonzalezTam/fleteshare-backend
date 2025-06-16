import fs from 'fs';
import path from 'path';

export const readImageAsBuffer = (imagePath: string): Buffer | null => {
  try {
    const fullPath = path.resolve(imagePath);

    // Verificar si el archivo existe
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  Imagen no encontrada: ${fullPath}`);
      return null;
    }

    // Leer el archivo como Buffer
    const imageBuffer = fs.readFileSync(fullPath);

    console.log(`✅ Imagen cargada exitosamente: ${imagePath}`);
    return imageBuffer;
  } catch (error) {
    console.error(`❌ Error leyendo imagen ${imagePath}:`, error);
    return null;
  }
};
