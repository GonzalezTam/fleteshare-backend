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

router.get('/', getNotifications);
router.put('/:id/read', markNotificationAsRead);
router.delete('/:id', deleteNotification);
router.post('/', requireAdmin, createNotification);

export default router;
