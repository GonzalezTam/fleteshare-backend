import mongoose from 'mongoose';
import { User } from '@/models/User.model';
import { UserCreateRequest, UserUpdateRequest, UserQuery } from '@/types/user.types';
import { validateTokenService } from './auth.service';

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

//export const createUserService = async (userData: UserCreateRequest, createdBy?: string) => {
//  // Verificar que el username no existe entre usuarios activos
//  const existingUser = await User.findOne({
//    username: userData.username,
//    isActive: true,
//  });

//  if (existingUser) {
//    throw new Error('El nombre de usuario ya existe');
//  }

//  const user = new User({
//    ...userData,
//    createdBy,
//    updatedBy: createdBy,
//  });

//  await user.save();

//  return user.toObject({
//    transform: (doc, ret) => {
//      delete ret.password;
//      return ret;
//    },
//  });
//};

//export const updateUserService = async (
//  id: string,
//  updateData: UserUpdateRequest,
//  updatedBy?: string
//) => {
//  if (!mongoose.Types.ObjectId.isValid(id)) {
//    throw new Error('ID de usuario inválido');
//  }

//  // Verificar que el usuario existe y está activo
//  const existingUser = await User.findOne({ _id: id, isActive: true });
//  if (!existingUser) {
//    throw new Error('Usuario no encontrado');
//  }

//  // Si se actualiza username, verificar que no existe entre usuarios activos
//  if (updateData.username) {
//    const duplicateUser = await User.findOne({
//      username: updateData.username,
//      _id: { $ne: id },
//      isActive: true,
//    });

//    if (duplicateUser) {
//      throw new Error('El nombre de usuario ya existe');
//    }
//  }

//  const user = await User.findByIdAndUpdate(
//    id,
//    {
//      ...updateData,
//      updatedBy,
//      updatedAt: new Date(), // Actualizar timestamp manualmente para auditoría
//    },
//    { new: true }
//  ).select('-password');

//  return user;
//};

//export const deleteUserService = async (id: string, deletedBy?: string) => {
//  if (!mongoose.Types.ObjectId.isValid(id)) {
//    throw new Error('ID de usuario inválido');
//  }

//  // Soft delete: cambiar isActive a false
//  const user = await User.findOneAndUpdate(
//    { _id: id, isActive: true },
//    {
//      isActive: false,
//      updatedBy: deletedBy,
//      updatedAt: new Date(),
//    },
//    { new: true }
//  ).select('-password');

//  if (!user) {
//    throw new Error('Usuario no encontrado');
//  }

//  return user;
//};

//export const getUserByIdService = async (id: string) => {
//  if (!mongoose.Types.ObjectId.isValid(id)) {
//    throw new Error('ID de usuario inválido');
//  }

//  const user = await User.findOne({ _id: id, isActive: true })
//    .select('-password')
//    .populate('createdBy', 'username')
//    .populate('updatedBy', 'username');

//  if (!user) {
//    throw new Error('Usuario no encontrado');
//  }

//  return user;
//};

//export const getUsersService = async (query: UserQuery) => {
//  const { search, page, limit } = query;

//  // Por default solo usuarios activos
//  let filters: any = {};
//  filters.isActive = true;

//  if (search) {
//    filters.username = { $regex: search, $options: 'i' };
//  }

//  // Paginación
//  const currentPage = parseInt(page?.toString() || '1');
//  const itemsPerPage = parseInt(limit?.toString() || '10');
//  const skip = (currentPage - 1) * itemsPerPage;

//  const [users, totalItems] = await Promise.all([
//    User.find(filters)
//      .select('-password')
//      .populate('createdBy', 'username')
//      .populate('updatedBy', 'username')
//      .sort({ createdAt: -1 })
//      .skip(skip)
//      .limit(itemsPerPage),
//    User.countDocuments(filters),
//  ]);

//  const totalPages = Math.ceil(totalItems / itemsPerPage);

//  return {
//    users,
//    pagination: {
//      currentPage,
//      totalPages,
//      totalItems,
//      itemsPerPage,
//    },
//  };
//};
