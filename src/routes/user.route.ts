import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth.middleware';
import { requireAdmin } from '@/middlewares/role.middleware';
import { uploadLicense } from '@/utils/upload.utils';
import {
  getCurrentUser,
  rejectValidationUser,
  updateUserProfile,
  validateUser,
} from '@/controllers/user.controller';

const router = Router();
router.use(authenticateToken);

// any authenticated user routes
router.get('/current', getCurrentUser);
router.put('/profile/:id', uploadLicense, updateUserProfile);

// admin required routes
router.put('/validateUser/:id', validateUser, requireAdmin);
router.put('/rejectValidation/:id', rejectValidationUser, requireAdmin);

export default router;
