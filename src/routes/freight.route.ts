import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import {
  createFreight,
  joinFreight,
  takeFreight,
  startFreight,
  leaveFreight,
  cancelFreight,
  updateFreightStatus,
  getFreights,
  getUserFreights,
  getFreightById,
  calculatePackagePrice,
  markStopAsVisited,
  finishFreight,
  getFreightProgress,
  checkStopPermissions,
  getFreightRoute,
} from '@/controllers/freight.controller';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Crear un nuevo flete
router.post('/', requireRole(['customer']), createFreight);

// Calcular precio estimado (sin autenticación específica)
router.post('/calculate-price', calculatePackagePrice);

// Obtener fletes disponibles (según rol)
router.get('/', getFreights);

// Obtener mis fletes
router.get('/my-freights', requireRole(['customer', 'transporter']), getUserFreights);

// Obtener flete específico por ID
router.get('/:freightId', getFreightById);

// Unirse a un flete existente
router.post('/:freightId/join', requireRole(['customer']), joinFreight);

// Tomar un flete (transportista)
router.post('/:freightId/take', requireRole(['transporter']), takeFreight);

// Iniciar el flete (solo transportista)
router.post('/:freightId/start', requireRole(['transporter']), startFreight);

// Abandonar un flete
router.post('/:freightId/leave', requireRole(['customer', 'transporter']), leaveFreight);

// Cancelar un flete
router.post('/:freightId/cancel', requireRole(['customer', 'transporter']), cancelFreight);

// Finalizar un flete (solo transportista)
router.post('/:freightId/finish', requireRole(['transporter']), finishFreight);

// Actualizar estado del flete (para casos específicos de admin o sistema)
router.patch('/:freightId/status', updateFreightStatus);

// Obtener información completa de la ruta
router.get('/:freightId/route', getFreightRoute);

// Obtener progreso del flete
router.get('/:freightId/progress', getFreightProgress);

// Marcar punto como visitado (participantes)
router.post('/:freightId/mark-visited', requireRole(['customer']), markStopAsVisited);

// Verificar permisos para marcar punto como visitado
router.get('/:freightId/check-permissions', requireRole(['customer']), checkStopPermissions);

export default router;
