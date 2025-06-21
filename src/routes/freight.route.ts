// freight.route.ts

import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import {
  createFreight,
  joinFreight,
  takeFreight,
  updateFreightStatus,
  getFreights,
  getUserFreights,
  getFreightById,
  validateJoinFreight,
  calculatePackagePrice,
} from '@/controllers/freight.controller';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

router.post('/', requireRole(['customer']), createFreight);
router.post('/calculate-price', calculatePackagePrice);
router.get('/', getFreights);
router.get('/my-freights', requireRole(['customer', 'transporter']), getUserFreights);
router.get('/:freightId', getFreightById);
router.post('/:freightId/join', requireRole(['customer']), joinFreight);
router.post('/:freightId/validate-join', requireRole(['customer']), validateJoinFreight);
router.post('/:freightId/take', requireRole(['transporter']), takeFreight);
router.patch('/:freightId/status', updateFreightStatus);

export default router;
