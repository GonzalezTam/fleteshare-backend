import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { CONFIG } from '@/config/env.config';
import { User } from '@/models/User.model';
import { AuthRequest } from '@/types/auth.types';

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Token de acceso requerido' });
      return;
    }

    const decoded = jwt.verify(token, CONFIG.jwtSecret!) as jwt.JwtPayload;
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401).json({ error: 'Usuario no encontrado' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Usuario deshabilitado' });
      return;
    }

    req.user = {
      id: String(user._id),
      username: user.username,
      role: user.role,
    };

    next();
  } catch (error) {
    res.status(403).json({ error: 'El token es inválido o ha expirado' });
    return;
  }
};
