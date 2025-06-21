import { Router } from 'express';
import authRoutes from './auth.route';
import userRoutes from './user.route';
import freightRoutes from './freight.route';
import notificationRoutes from './notification.route';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/freights', freightRoutes);
router.use('/notifications', notificationRoutes);

export default router;
