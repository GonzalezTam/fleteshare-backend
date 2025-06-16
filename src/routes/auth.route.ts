import { Router } from 'express';
import { uploadLicense } from '@/utils/upload.utils';
import { login, register, recoverPassword, validateToken } from '@/controllers/auth.controller';

const router = Router();

router.post('/login', login);
router.post('/register', uploadLicense, register);
router.post('/recoverPassword', recoverPassword);
router.get('/validateToken', validateToken);

export default router;
