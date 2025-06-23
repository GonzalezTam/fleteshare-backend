import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/types/auth.types';
import { canMarkStopAsVisited, getNextDestination, getRouteProgress } from '@/utils/freight.utils';
import {
  createFreightService,
  joinFreightService,
  assignTransporterService,
  updateFreightStatusService,
  getFreightsService,
  getUserFreightsService,
  getFreightByIdService,
  leaveFreightService,
  cancelFreightService,
  markStopAsVisitedService,
  finishFreightService,
} from '@/services/freight.service';

export const createFreight = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const freight = await createFreightService(userId, req.body);

    res.status(201).json({
      message: 'Flete creado exitosamente',
      result: freight,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const joinFreight = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { freightId } = req.params;

    const joinData = {
      freightId,
      ...req.body,
    };

    const freight = await joinFreightService(userId, joinData);

    res.status(200).json({
      message: 'Te has unido al flete exitosamente',
      result: freight,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const startFreight = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { freightId } = req.params;

    const freight = await updateFreightStatusService(userId, freightId, 'started');

    res.status(200).json({
      message: 'Flete iniciado exitosamente',
      result: freight,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const takeFreight = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const transporterId = req.user?.id!;
    const { freightId } = req.params;

    const freight = await assignTransporterService(transporterId, freightId);

    res.status(200).json({
      message: 'Flete asignado exitosamente',
      result: freight,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const updateFreightStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { freightId } = req.params;
    const { status, cancellationReason } = req.body;

    const freight = await updateFreightStatusService(userId, freightId, status, cancellationReason);

    res.status(200).json({
      message: 'Estado del flete actualizado exitosamente',
      result: freight,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const getFreights = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const query = req.query;

    const { freights, total } = await getFreightsService(userId, query);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      message: 'Fletes disponibles obtenidos exitosamente',
      result: {
        freights,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const getUserFreights = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const role = req.user?.role!;
    const query = req.query;

    if (req.user?.role === 'transporter') query.transporterId = userId;

    const { freights, total } = await getUserFreightsService(userId, role, query);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      message: 'Fletes del usuario obtenidos exitosamente',
      result: {
        freights,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const getFreightById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { freightId } = req.params;
    const freight = await getFreightByIdService(freightId);
    res.status(200).json({
      message: 'Flete obtenido exitosamente',
      result: freight,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const calculatePackagePrice = async (req: Request, res: Response) => {
  try {
    const { packageDimensions, pickupAddress, deliveryAddress } = req.body;

    const {
      calculateVolumeM3,
      calculatePackagePrice: calculatePrice,
      calculateDistance,
      validatePackageDimensions,
    } = await import('@/utils/freight.utils');

    const { length, width, height } = packageDimensions;
    const dimensionValidation = validatePackageDimensions(length, width, height);
    if (!dimensionValidation.isValid) {
      res.status(400).json({
        error: `Dimensiones inválidas: ${dimensionValidation.errors.join(', ')}`,
      });
      return;
    }

    const volumeM3 = calculateVolumeM3(length, width, height);
    const distance = calculateDistance(
      pickupAddress.latitude,
      pickupAddress.longitude,
      deliveryAddress.latitude,
      deliveryAddress.longitude
    );

    const priceCalculation = calculatePrice(volumeM3, distance);

    res.status(200).json({
      message: 'Precio calculado exitosamente',
      result: {
        ...priceCalculation,
        packageDimensions: {
          ...packageDimensions,
          volumeM3,
        },
        distance,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const leaveFreight = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const role = req.user?.role!;
    const { freightId } = req.params;

    const freight = await leaveFreightService(userId, role, freightId);

    res.status(200).json({
      message: 'Has abandonado el flete exitosamente',
      result: freight,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const cancelFreight = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const role = req.user?.role!;
    const { freightId } = req.params;
    const { cancellationReason } = req.body;

    const freight = await cancelFreightService(userId, role, freightId, cancellationReason);

    res.status(200).json({
      message: 'Flete cancelado exitosamente',
      result: freight,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const markStopAsVisited = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { freightId } = req.params;
    const { participantIndex, stopType } = req.body;

    if (!['pickup', 'delivery'].includes(stopType)) {
      res.status(400).json({ error: 'stopType debe ser "pickup" o "delivery"' });
      return;
    }

    const freight = await markStopAsVisitedService(userId, freightId, participantIndex, stopType);

    const actionText = stopType === 'pickup' ? 'recogida' : 'entrega';

    res.status(200).json({
      message: `Punto de ${actionText} marcado como visitado exitosamente`,
      result: freight,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const finishFreight = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { freightId } = req.params;

    const freight = await finishFreightService(userId, freightId);

    res.status(200).json({
      message: 'Flete finalizado exitosamente',
      result: freight,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const getFreightProgress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { freightId } = req.params;
    const freight = await getFreightByIdService(freightId);

    const progress = getRouteProgress(freight);
    const nextDestination = getNextDestination(freight);

    res.status(200).json({
      message: 'Progreso del flete obtenido exitosamente',
      result: {
        progress,
        nextDestination,
        routeCompleted: progress.percentage === 100,
        freight: {
          _id: freight._id,
          status: freight.status,
          totalStops: freight.suggestedRoute?.totalStops || 0,
          estimatedDuration: freight.suggestedRoute?.estimatedDuration || 0,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const checkStopPermissions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { freightId } = req.params;
    const { participantIndex, stopType } = req.query;

    if (
      typeof participantIndex !== 'string' ||
      !['pickup', 'delivery'].includes(stopType as string)
    ) {
      res.status(400).json({ error: 'Parámetros inválidos' });
      return;
    }

    const freight = await getFreightByIdService(freightId);
    const canMark = canMarkStopAsVisited(
      freight,
      userId,
      parseInt(participantIndex),
      stopType as 'pickup' | 'delivery'
    );

    res.status(200).json({
      message: 'Permisos verificados exitosamente',
      result: canMark,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

export const getFreightRoute = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { freightId } = req.params;
    const freight = await getFreightByIdService(freightId);

    if (!freight.suggestedRoute) {
      res.status(404).json({ error: 'No se encontró ruta para este flete' });
      return;
    }

    const progress = getRouteProgress(freight);
    const nextDestination = getNextDestination(freight);

    res.status(200).json({
      message: 'Ruta del flete obtenida exitosamente',
      result: {
        ...freight.suggestedRoute,
        progress,
        nextDestination,
        routeCompleted: progress.percentage === 100,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};
