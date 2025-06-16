import mongoose from 'mongoose';
import { User } from '@/models/User.model';
import { UserUpdateProfileBodyRequest } from '@/types/user.types';
import { validateTokenService } from './auth.service';
import { uploadToCloudinary } from '@/services/cloudinary.service';
import {
  createProfileCompletionNotification,
  createValidationNotification,
} from '@/services/notification.service';

export const getCurrentUserDataService = async (token?: string) => {
  if (!token) throw new Error('Token no proporcionado');

  // Validate token and extract user ID
  const { id } = await validateTokenService(token);
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('ID de usuario inválido');

  const user = await User.findOne({ _id: id, isActive: true })
    .select('-password')
    .populate('createdBy', 'username')
    .populate('updatedBy', 'username');
  if (!user) throw new Error('Usuario no encontrado');
  return user;
};

export const updateUserProfileService = async (
  id: string,
  updateBody: UserUpdateProfileBodyRequest,
  updatedBy?: string
) => {
  if (!id) throw new Error('No se proporcionó el ID de usuario a actualizar');
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('El ID de usuario es inválido');

  const existingUser = await User.findOne({ _id: id, isActive: true });
  if (!existingUser) throw new Error('Usuario no encontrado');

  // if profile was not completed, set isProfileCompleted to true
  let profileCompleted = existingUser.isProfileCompleted;

  if (!profileCompleted && Object.keys(updateBody).length === 0)
    throw new Error('No se proporcionaron datos para actualizar el perfil');

  if (!profileCompleted) {
    profileCompleted = true;
    await createProfileCompletionNotification(id);
  }

  // Preparar los datos de actualización
  let userData: any = {
    firstName: updateBody.firstName,
    lastName: updateBody.lastName,
    phone: updateBody.phone,
    isProfileCompleted: profileCompleted,
    updatedBy,
    updatedAt: new Date(),
  };

  if (updateBody.address) userData.address = updateBody.address;

  if (updateBody.vehicle) userData.vehicle = updateBody.vehicle;

  // Manejar la actualización de la licencia si se proporciona
  if (updateBody.license) {
    try {
      const result = await uploadToCloudinary(updateBody.license.data, {
        folder: 'fleteshare/licenses',
        public_id: `license_${existingUser.username}_${Date.now()}`,
      });
      userData.licenseUrl = result.secure_url;
      userData.licenseStatus = 'pending'; // Resetear estado cuando se actualiza la licencia
    } catch (error) {
      console.error('Error al subir licencia a Cloudinary:', error);
      throw new Error('Error al procesar la imagen de licencia');
    }
  }

  // Remover campos undefined para evitar que se actualicen con valores undefined
  Object.keys(userData).forEach(key => {
    if (userData[key] === undefined) {
      delete userData[key];
    }
  });

  const user = await User.findByIdAndUpdate(id, userData, { new: true }).select('-password');

  if (!user) throw new Error('Error al actualizar el usuario');
  return user;
};

export const validateUserService = async (id: string, updatedBy: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('ID de usuario inválido');
  const user = await User.findOneAndUpdate(
    { _id: id, isActive: true },
    { licenseStatus: 'approved', updatedBy, updatedAt: new Date() },
    { new: true }
  ).select('-password');

  try {
    await createValidationNotification(id, 'approved');
  } catch (error) {
    console.error('Error al crear notificación de validación:', error);
  }

  if (!user) throw new Error('Error al intentar validar el usuario');
  return user;
};

export const rejectValidationUserService = async (
  id: string,
  updatedBy: string,
  reason?: string
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('ID de usuario inválido');
  const user = await User.findOneAndUpdate(
    { _id: id, isActive: true },
    { licenseStatus: 'rejected', updatedBy, updatedAt: new Date() },
    { new: true }
  ).select('-password');
  if (!user) throw new Error('Error al intentar rechazar la validación del usuario');
  try {
    await createValidationNotification(id, 'rejected', reason);
  } catch (error) {
    console.error('Error al crear notificación de rechazo de validación:', error);
  }
  return user;
};
