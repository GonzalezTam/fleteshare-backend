import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/types/auth.types';
import {
  getNotificationsService,
  markNotificationAsReadService,
  deleteNotificationService,
  createNotificationService,
} from '@/services/notification.service';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const result = await getNotificationsService(req.query);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const createNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notification = await createNotificationService(req.body);
    res.status(201).json(notification);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await markNotificationAsReadService(id);
    res.json({
      notification: notification,
      message: 'Notificación marcada como leída',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await deleteNotificationService(id);
    res.json({
      message: 'Notificación eliminada correctamente',
      notification: notification,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};
