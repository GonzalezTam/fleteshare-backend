import { Router } from 'express';
import { requireAdmin } from '@/middlewares/role.middleware';
import { authenticateToken } from '@/middlewares/auth.middleware';
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  createNotification,
} from '@/controllers/notification.controller';

const router = Router();
router.use(authenticateToken);

// any authenticated user routes
router.get('/', getNotifications);
router.put('/:id/read', markNotificationAsRead);
router.delete('/:id', deleteNotification);

// admin required routes
router.post('/', requireAdmin, createNotification);

export default router;
