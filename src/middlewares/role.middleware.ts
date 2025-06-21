import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/auth.types';
import { UserRole } from '@/types/user.types';

// Middleware para requerir roles específicos
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'No tienes permisos para acceder a este recurso',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
      return;
    }
    next();
  };
};

// Middleware específico para requerir rol de admin
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ error: 'Usuario no autenticado' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      error: 'Se requieren permisos de administrador',
      userRole: req.user.role,
    });
    return;
  }

  next();
};

// Middleware específico para requerir rol de customer
export const requireCustomer = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ error: 'Usuario no autenticado' });
    return;
  }

  if (req.user.role !== 'customer') {
    res.status(403).json({
      error: 'Se requieren permisos de cliente',
      userRole: req.user.role,
    });
    return;
  }

  next();
};

// Middleware específico para requerir rol de transporter
export const requireTransporter = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ error: 'Usuario no autenticado' });
    return;
  }

  if (req.user.role !== 'transporter') {
    res.status(403).json({
      error: 'Se requieren permisos de transportista',
      userRole: req.user.role,
    });
    return;
  }

  next();
};
