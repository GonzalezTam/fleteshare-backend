import { Router } from 'express';
import { login, register, recoverPassword, validateToken } from '@/controllers/auth.controller';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/recoverPassword', recoverPassword);
router.get('/validateToken', validateToken);

export default router;
