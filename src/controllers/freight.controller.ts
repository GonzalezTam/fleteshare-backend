import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/types/auth.types';
import {
  createFreightService,
  joinFreightService,
  assignTransporterService,
  updateFreightStatusService,
  getFreightsService,
  getUserFreightsService,
  getFreightByIdService,
} from '@/services/freight.service';

// Crear un nuevo flete
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

// Unirse a un flete existente
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

// Asignar transportista a un flete (tomar flete)
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

// Actualizar estado del flete
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

// Obtener fletes disponibles (segun role)
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

// Obtener fletes del usuario (como participante)
export const getUserFreights = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const query = req.query;

    if (req.user?.role === 'transporter') query.transporterId = userId;

    const { freights, total } = await getUserFreightsService(userId, query);

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

// Obtener flete por ID
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

// Validar si un usuario puede unirse a un flete (endpoint de validación)
export const validateJoinFreight = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { freightId } = req.params;
    const { pickupAddress, deliveryAddress, packageDimensions } = req.body;

    // Importar las utilidades necesarias
    const { validateCanJoinFreight, calculateVolumeM3, validatePackageDimensions } = await import(
      '@/utils/freight.utils'
    );
    const { Freight } = await import('@/models/freight.model');

    // Obtener el flete
    let freight = await Freight.findById(freightId);
    if (!freight) throw new Error('Flete no encontrado');

    // Validar dimensiones
    const { length, width, height } = packageDimensions;
    const dimensionValidation = validatePackageDimensions(length, width, height);
    if (!dimensionValidation.isValid) {
      res.status(400).json({
        error: `Dimensiones inválidas: ${dimensionValidation.errors.join(', ')}`,
      });
      return;
    }

    // Calcular volumen
    const volumeM3 = calculateVolumeM3(length, width, height);

    // Validar si puede unirse
    const validation = validateCanJoinFreight(
      freight,
      pickupAddress.latitude,
      pickupAddress.longitude,
      deliveryAddress.latitude,
      deliveryAddress.longitude,
      volumeM3
    );

    res.status(200).json({
      message: 'Validación completada',
      result: {
        canJoin: validation.canJoin,
        reasons: validation.reasons,
        availableVolumeM3: validation.availableVolumeM3,
        packageVolumeM3: volumeM3,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ha ocurrido un error';
    res.status(400).json({ error: message });
  }
};

// Calcular precio estimado para un paquete
export const calculatePackagePrice = async (req: Request, res: Response) => {
  try {
    const { packageDimensions, pickupAddress, deliveryAddress } = req.body;

    // Importar utilidades
    const {
      calculateVolumeM3,
      calculatePackagePrice: calculatePrice,
      calculateDistance,
      validatePackageDimensions,
    } = await import('@/utils/freight.utils');

    // Validar dimensiones
    const { length, width, height } = packageDimensions;
    const dimensionValidation = validatePackageDimensions(length, width, height);
    if (!dimensionValidation.isValid) {
      res.status(400).json({
        error: `Dimensiones inválidas: ${dimensionValidation.errors.join(', ')}`,
      });
      return;
    }

    // Calcular volumen y distancia
    const volumeM3 = calculateVolumeM3(length, width, height);
    const distance = calculateDistance(
      pickupAddress.latitude,
      pickupAddress.longitude,
      deliveryAddress.latitude,
      deliveryAddress.longitude
    );

    // Calcular precio
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
