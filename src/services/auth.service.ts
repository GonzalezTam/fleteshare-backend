import jwt from 'jsonwebtoken';
import { User } from '@/models/User.model';
import { CONFIG } from '@/config/env.config';
import { LoginRequest, RegisterRequest, RecoverPasswordRequest } from '@/types/auth.types';

export const registerService = async (registerData: RegisterRequest) => {
  const { firstName, lastName, username, password, confirmPassword, role, phone, licence } =
    registerData;

  // Verificar que el username no existe entre usuarios activos
  const existingUser = await User.findOne({
    username,
    isActive: true,
  });

  if (existingUser) throw new Error('El nombre de usuario ya existe');

  if (password !== confirmPassword) {
    throw new Error('Las contraseñas no coinciden');
  }

  // Crear nuevo usuario
  const user = new User({
    firstName,
    lastName,
    username,
    password,
    role: role || 'customer',
    phone,
    licence,
  });

  await user.save();

  return {
    id: (user._id as string).toString(),
    username: user.username,
    role: user.role,
    token: jwt.sign({ id: user._id, username: user.username, role: user.role }, CONFIG.jwtSecret!, {
      expiresIn: '24h',
    }),
  };
};

export const loginService = async (body: LoginRequest) => {
  const { username, password } = body;

  // Buscar usuario
  const user = await User.findOne({ username });
  if (!user) throw new Error('Usuario incorrecto');

  if (!user.isActive) throw new Error('Usuario deshabilitado');

  // Verificar contraseña
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) throw new Error('Contraseña incorrecta');

  // Generar token
  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    CONFIG.jwtSecret!,
    { expiresIn: '24h' }
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
