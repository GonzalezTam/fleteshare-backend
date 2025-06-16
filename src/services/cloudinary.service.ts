import { UploadApiResponse } from 'cloudinary';
import cloudinary from '@/config/cloudinary.config';

export const uploadToCloudinary = async (
  buffer: Buffer,
  options: {
    folder?: string;
    public_id?: string;
    resource_type?: 'auto' | 'image' | 'video' | 'raw';
  } = {}
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'fleteshare/licenses',
        public_id: options.public_id,
        resource_type: options.resource_type || 'auto',
        transformation: [
          { width: 1000, height: 1000, crop: 'limit' }, // Limitar tamaño máximo
          { quality: 'auto' }, // Optimización automática
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result);
        } else {
          reject(new Error('Error desconocido al subir archivo'));
        }
      }
    );

    uploadStream.end(buffer);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error al eliminar archivo de Cloudinary:', error);
    // No lanzar error para no bloquear otras operaciones
  }
};
