import { Request, Response } from 'express';
import {
  getCurrentUserDataService,
  updateUserProfileService,
  validateUserService,
  rejectValidationUserService,
} from '@/services/user.service';
import { AuthenticatedRequest } from '@/types/auth.types';

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const user = await getCurrentUserDataService(token);
    res.status(200).json({
      message: 'Datos del usuario obtenidos correctamente',
      result: user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const updateUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updatedBy = req.user?.id;
    const result = await updateUserProfileService(req.params?.id, req.body, updatedBy);
    res.status(200).json({
      message: 'Perfil de usuario actualizado correctamente',
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const validateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updatedBy = req.user?.id!;
    const result = await validateUserService(req.params.id, updatedBy);
    res.status(200).json({
      message: 'El usuario ha sido validado correctamente',
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const rejectValidationUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updatedBy = req.user?.id!;
    const reason = req.body?.reason;
    const result = await rejectValidationUserService(req.params.id, updatedBy, reason);
    res.status(200).json({
      message: 'Validación de usuario rechazada correctamente',
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};
