import jwt from 'jsonwebtoken';
import { User, IUser } from '@/models/User.model';
import { CONFIG } from '@/config/env.config';
import { LoginRequest, RegisterRequest, RecoverPasswordRequest } from '@/types/auth.types';
import { createWelcomeNotification } from '@/services/notification.service';
import { uploadToCloudinary } from '@/services/cloudinary.service';
import { getAppTypeFromOrigin, isRoleAllowedForApp } from '@/utils/app.utils';

export const registerService = async (registerData: RegisterRequest) => {
  const { firstName, lastName, username, password, confirmPassword, role, phone, license } =
    registerData;

  // Verificar que el username no existe entre usuarios activos
  const existingUser = await User.findOne({
    username,
    isActive: true,
  });

  if (existingUser) throw new Error('El nombre de usuario ya existe');
  if (password !== confirmPassword) throw new Error('Las contraseñas no coinciden');

  let newUser: Partial<IUser> = {
    firstName,
    lastName,
    username,
    password,
    role,
    phone,
  };

  let cloudinaryUrl: string | undefined;

  // Si es transportista y tiene licencia, subirla a Cloudinary
  if (role === 'transporter' && license) {
    try {
      const result = await uploadToCloudinary(license.data, {
        folder: 'fleteshare/licenses',
        public_id: `license_${username}_${Date.now()}`,
      });
      cloudinaryUrl = result.secure_url;
    } catch (error) {
      console.error('Error al subir licencia a Cloudinary:', error);
      throw new Error('Error al procesar la imagen de licencia');
    }
    newUser = {
      ...newUser,
      licenseUrl: cloudinaryUrl,
      licenseStatus: 'pending',
    };
  }

  // Crear nuevo usuario
  const user = new User(newUser);

  await user.save();

  try {
    // Notificación de bienvenida después de guardar el usuario
    await createWelcomeNotification((user._id as string).toString(), user.role);
  } catch (notificationError) {
    console.error('Error al crear notificación de bienvenida:', notificationError);
  }

  return {
    id: (user._id as string).toString(),
    username: user.username,
    role: user.role,
    token: jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      CONFIG.jwtSecret!,
      {
        expiresIn: '12h',
      }
    ),
  };
};

export const loginService = async (body: LoginRequest, origin?: string) => {
  const { username, password } = body;

  // Buscar usuario
  const user = await User.findOne({ username });
  if (!user) throw new Error('Usuario incorrecto');

  if (!user.isActive) throw new Error('Usuario deshabilitado');

  const appType = getAppTypeFromOrigin(origin);

  if (!isRoleAllowedForApp(user.role, appType)) {
    let errorMessage = 'No tenés permisos para acceder a esta aplicación';
    if (appType === 'main' && user.role === 'admin')
      errorMessage = 'Utilizá el backoffice para ingresar como administrador';
    throw new Error(errorMessage);
  }

  // Verificar contraseña
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) throw new Error('Contraseña incorrecta');

  // Generar token
  const token = jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
    },
    CONFIG.jwtSecret!,
    { expiresIn: '12h' }
  );

  return {
    id: (user._id as string).toString(),
    username: user.username,
    role: user.role,
    token,
  };
};

export const recoverPasswordService = async (body: RecoverPasswordRequest) => {
  const { username } = body;
  if (!username) throw new Error('El email es obligatorio');
  // TODO: Aquí iría la lógica para enviar un email de restablecimiento de contraseña
  return true;
};

export const validateTokenService = async (token: string) => {
  try {
    const decoded = jwt.verify(token, CONFIG.jwtSecret!) as jwt.JwtPayload;
    return decoded;
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};
