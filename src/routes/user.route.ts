import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth.middleware';
import { requireAdmin } from '@/middlewares/role.middleware';
import { getCurrentUser } from '@/controllers/user.controller';

const router = Router();
router.use(authenticateToken);

router.get('/current', getCurrentUser);

//router.post('/', createUser);
//router.get('/', getUsers);
//router.get('/:id', getUserById);
//router.put('/:id', updateUser);
//router.delete('/:id', deleteUser);

export default router;
