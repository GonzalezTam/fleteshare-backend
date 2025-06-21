import { Types } from 'mongoose';
import { Freight, IFreight, IFreightParticipant } from '@/models/freight.model';
import { User } from '@/models/User.model';
import {
  CreateFreightRequest,
  JoinFreightRequest,
  FreightQuery,
  FreightStatus,
} from '@/types/freight.types';
import {
  calculateVolumeM3,
  calculatePackagePrice,
  calculateDistance,
  validatePackageDimensions,
  generateSuggestedRoute,
  validateCanJoinFreight,
  calculateVehicleVolumeM3,
} from '@/utils/freight.utils';

// Crear un nuevo flete
export const createFreightService = async (
  userId: string,
  freightData: CreateFreightRequest
): Promise<IFreight> => {
  // Verificar que el usuario existe y tiene perfil completo
  const user = await User.findById(userId);
  if (!user) throw new Error('Usuario no encontrado');
  if (!user.isProfileCompleted) throw new Error('Debe completar su perfil antes de crear un flete');
  if (user.role !== 'customer') throw new Error('Solo los clientes pueden crear fletes');

  // Validar dimensiones del paquete
  const { length, width, height } = freightData.packageDimensions;
  const dimensionValidation = validatePackageDimensions(length, width, height);
  if (!dimensionValidation.isValid)
    throw new Error(`Dimensiones inválidas: ${dimensionValidation.errors.join(', ')}`);

  // Calcular volumen y distancia
  const volumeM3 = calculateVolumeM3(length, width, height);
  const distance = calculateDistance(
    freightData.pickupAddress.latitude,
    freightData.pickupAddress.longitude,
    freightData.deliveryAddress.latitude,
    freightData.deliveryAddress.longitude
  );

  // Calcular precio
  const priceCalculation = calculatePackagePrice(volumeM3, distance);

  // Crear participante inicial
  const initialParticipant: IFreightParticipant = {
    userId: new Types.ObjectId(userId),
    pickupAddress: freightData.pickupAddress,
    deliveryAddress: freightData.deliveryAddress,
    packageDimensions: {
      ...freightData.packageDimensions,
      volumeM3,
    },
    price: priceCalculation.totalPrice,
    distance,
    joinedAt: new Date(),
  };

  // Generar ruta
  const routeData = [
    {
      index: 0,
      pickupAddress: freightData.pickupAddress,
      deliveryAddress: freightData.deliveryAddress,
    },
  ];

  const route = generateSuggestedRoute(routeData);

  // Crear el flete
  const freight = new Freight({
    createdBy: userId,
    participants: [initialParticipant],
    status: 'requested',
    totalPrice: priceCalculation.totalPrice,
    usedVolumeM3: volumeM3,
    availableVolumeM3: 0, // Se actualizará cuando se asigne transportista
    scheduledDate: new Date(freightData.scheduledDate),
    suggestedRoute: {
      pickupSequence: route.pickupSequence.map(idx => ({
        participantIndex: idx,
        address: freightData.pickupAddress,
      })),
      deliverySequence: route.deliverySequence.map(idx => ({
        participantIndex: idx,
        address: freightData.deliveryAddress,
      })),
      totalDistance: route.totalDistance,
    },
  });

  const savedFreight = await freight.save();

  // TODO: create a notification for the user (who created the freight)

  return savedFreight;
};

// Unirse a un flete existente
export const joinFreightService = async (
  userId: string,
  joinData: JoinFreightRequest
): Promise<IFreight> => {
  // Verificar usuario
  const user = await User.findById(userId);
  if (!user || user.role !== 'customer' || !user.isProfileCompleted)
    throw new Error('Usuario no válido o perfil incompleto');

  // Obtener el flete
  const freight = await Freight.findById(joinData.freightId);
  if (!freight) throw new Error('Flete no encontrado');

  // Verificar que el usuario no esté ya en el flete
  const alreadyParticipating = freight.participants.some(p => p.userId.toString() === userId);
  if (alreadyParticipating) throw new Error('Ya estás participando en este flete');

  // Validar dimensiones
  const { length, width, height } = joinData.packageDimensions;
  const dimensionValidation = validatePackageDimensions(length, width, height);
  if (!dimensionValidation.isValid)
    throw new Error(`Dimensiones inválidas: ${dimensionValidation.errors.join(', ')}`);

  // Calcular volumen y distancia
  const volumeM3 = calculateVolumeM3(length, width, height);
  const distance = calculateDistance(
    joinData.pickupAddress.latitude,
    joinData.pickupAddress.longitude,
    joinData.deliveryAddress.latitude,
    joinData.deliveryAddress.longitude
  );

  // Validar si puede unirse al flete
  const validation = validateCanJoinFreight(
    freight,
    joinData.pickupAddress.latitude,
    joinData.pickupAddress.longitude,
    joinData.deliveryAddress.latitude,
    joinData.deliveryAddress.longitude,
    volumeM3
  );

  if (!validation.canJoin)
    throw new Error(`No puedes unirte al flete: ${validation.reasons.join(', ')}`);

  // Calcular precio
  const priceCalculation = calculatePackagePrice(volumeM3, distance);

  // Crear nuevo participante
  const newParticipant: IFreightParticipant = {
    userId: new Types.ObjectId(userId),
    pickupAddress: joinData.pickupAddress,
    deliveryAddress: joinData.deliveryAddress,
    packageDimensions: {
      ...joinData.packageDimensions,
      volumeM3,
    },
    price: priceCalculation.totalPrice,
    distance,
    joinedAt: new Date(),
  };

  // Actualizar el flete
  freight.participants.push(newParticipant);
  freight.totalPrice += priceCalculation.totalPrice;
  freight.usedVolumeM3 += volumeM3;
  freight.availableVolumeM3 = freight.assignedVehicle
    ? freight.assignedVehicle.dimensions.totalVolumeM3 - freight.usedVolumeM3
    : 0;

  // Recalcular ruta sugerida si hay transportista asignado
  if (freight.transporterId && freight.assignedVehicle) {
    const routeData = freight.participants.map((p, index) => ({
      index,
      pickupAddress: p.pickupAddress,
      deliveryAddress: p.deliveryAddress,
    }));

    const route = generateSuggestedRoute(routeData);
    freight.suggestedRoute = {
      pickupSequence: route.pickupSequence.map(idx => ({
        participantIndex: idx,
        address: freight.participants[idx].pickupAddress,
      })),
      deliverySequence: route.deliverySequence.map(idx => ({
        participantIndex: idx,
        address: freight.participants[idx].deliveryAddress,
      })),
      totalDistance: route.totalDistance,
    };
  }

  const updatedFreight = await freight.save();

  // TODO: create a notification for the freight creator

  if (freight.transporterId) {
    // TODO: create a notification for the transporter
  }

  // TODO: create a notification for the user (who joined the freight)
  return updatedFreight;
};

// Asignar transportista a un flete
export const assignTransporterService = async (
  transporterId: string,
  freightId: string
): Promise<IFreight> => {
  // Verificar transportista
  const transporter = await User.findById(transporterId);
  if (!transporter || transporter.role !== 'transporter')
    throw new Error('Transportista no válido');

  if (!transporter.isProfileCompleted) throw new Error('El transportista debe completar su perfil');
  if (transporter.licenseStatus !== 'approved')
    throw new Error('El transportista debe tener licencia aprobada');
  if (!transporter.vehicle) throw new Error('El transportista debe tener vehículo configurado');

  // Verificar que no tenga otro flete activo
  const activeFreight = await Freight.findOne({
    transporterId: transporterId,
    status: { $in: ['taken', 'started', 'going'] },
  });

  if (activeFreight) throw new Error('El transportista ya tiene un flete activo');

  // Obtener el flete
  const freight = await Freight.findById(freightId);
  if (!freight) throw new Error('Flete no encontrado');

  if (freight.status !== 'requested')
    throw new Error('El flete no está disponible para ser tomado');
  if (freight.transporterId) throw new Error('El flete ya tiene transportista asignado');

  // Calcular volumen del vehículo
  const vehicleVolumeM3 = calculateVehicleVolumeM3(
    transporter.vehicle.dimensions.length,
    transporter.vehicle.dimensions.width,
    transporter.vehicle.dimensions.height
  );

  // Verificar que el vehículo tenga capacidad suficiente
  if (freight.usedVolumeM3 > vehicleVolumeM3)
    throw new Error('El vehículo no tiene suficiente capacidad para este flete');

  // Asignar transportista y vehículo
  freight.transporterId = new Types.ObjectId(transporterId);
  freight.status = 'taken';
  freight.assignedVehicle = {
    plate: transporter.vehicle.plate,
    dimensions: {
      length: transporter.vehicle.dimensions.length,
      width: transporter.vehicle.dimensions.width,
      height: transporter.vehicle.dimensions.height,
      totalVolumeM3: vehicleVolumeM3,
    },
  };
  freight.availableVolumeM3 = vehicleVolumeM3 - freight.usedVolumeM3;

  // Generar ruta sugerida
  const routeData = freight.participants.map((p, index) => ({
    index,
    pickupAddress: p.pickupAddress,
    deliveryAddress: p.deliveryAddress,
  }));

  const route = generateSuggestedRoute(routeData);
  freight.suggestedRoute = {
    pickupSequence: route.pickupSequence.map(idx => ({
      participantIndex: idx,
      address: freight.participants[idx].pickupAddress,
    })),
    deliverySequence: route.deliverySequence.map(idx => ({
      participantIndex: idx,
      address: freight.participants[idx].deliveryAddress,
    })),
    totalDistance: route.totalDistance,
  };

  const updatedFreight = await freight.save();

  // TODO: create a notification for the transporter

  //for (const participant of freight.participants) {
  // TODO: create a notification for the freight participants
  //}

  return updatedFreight;
};

//  Actualizar estado del flete
export const updateFreightStatusService = async (
  userId: string,
  freightId: string,
  newStatus: FreightStatus,
  cancellationReason?: string
): Promise<IFreight> => {
  const freight = await Freight.findById(freightId);
  if (!freight) throw new Error('Flete no encontrado');

  // Verificar permisos
  const isTransporter = freight.transporterId?.toString() === userId;
  const isParticipant = freight.participants.some(p => p.userId.toString() === userId);
  const user = await User.findById(userId);
  const isAdmin = user?.role === 'admin';

  if (!isTransporter && !isParticipant && !isAdmin)
    throw new Error('No tienes permisos para actualizar este flete');

  // Validar transiciones de estado
  const validTransitions: { [key: string]: string[] } = {
    requested: ['taken', 'canceled'],
    taken: ['started', 'canceled'],
    started: ['going', 'canceled'],
    going: ['finished', 'canceled'],
    finished: [],
    canceled: [],
  };

  const currentStatus = freight.status;
  if (!validTransitions[currentStatus]?.includes(newStatus))
    throw new Error(`No se puede cambiar el estado de '${currentStatus}' a '${newStatus}'`);

  // Solo el transportista puede cambiar a estados operativos
  if (['started', 'going', 'finished'].includes(newStatus) && !isTransporter)
    throw new Error('Solo el transportista puede actualizar el estado del flete');

  // Actualizar estado
  freight.status = newStatus as any;

  // Actualizar timestamps según el estado
  switch (newStatus) {
    case 'started':
      freight.startedAt = new Date();
      break;
    case 'finished':
      freight.completedAt = new Date();
      break;
    case 'canceled':
      freight.cancelledAt = new Date();
      if (cancellationReason) freight.cancellationReason = cancellationReason;
      break;
  }

  const updatedFreight = await freight.save();

  // Crear notificaciones según el nuevo estado
  const statusMessages: { [key: string]: string } = {
    taken: 'Tu flete ha sido tomado por un transportista',
    started: 'Tu flete ha comenzado',
    going: 'Tu flete está en camino',
    finished: 'Tu flete ha sido completado exitosamente',
    canceled: `Tu flete ha sido cancelado${cancellationReason ? `: ${cancellationReason}` : ''}`,
  };

  // TODO: create a notification for all participants

  if (freight.transporterId && freight.transporterId.toString() !== userId) {
    // TODO: create a notification for the transporter if it's not the user updating
  }

  return updatedFreight;
};

export const getFreightsService = async (
  userId: string,
  query: FreightQuery = {}
): Promise<{ freights: IFreight[]; total: number }> => {
  const user = await User.findById(userId);
  if (!user) throw new Error('Usuario no encontrado');

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Filtros base para transportistas
  let filters: any = {};

  if (user.role === 'transporter') {
    filters = {
      status: 'requested', // Solo fletes sin transportista
      transporterId: { $exists: false },
      scheduledDate: { $gte: new Date() }, // Solo flete futuros
    };
  } else if (user.role === 'customer') {
    filters = {
      'participants.userId': { $ne: new Types.ObjectId(userId) }, // Excluir fletes donde el usuario ya es participante
      status: { $in: ['requested', 'taken'] },
      scheduledDate: { $gte: new Date() }, // Solo fletes futuros
    };
  }

  // Aplicar filtros adicionales
  if (query.scheduledDateFrom)
    filters.scheduledDate = {
      ...filters.scheduledDate,
      $gte: new Date(query.scheduledDateFrom),
    };

  if (query.scheduledDateTo)
    filters.scheduledDate = {
      ...filters.scheduledDate,
      $lte: new Date(query.scheduledDateTo),
    };

  const freights = await Freight.find(filters)
    .populate('createdBy', 'firstName lastName phone')
    .populate('participants.userId', 'firstName lastName phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Freight.countDocuments(filters);

  return { freights, total };
};

// Obtener fletes de un usuario (como cliente)
export const getUserFreightsService = async (
  userId?: string,
  query: FreightQuery = {}
): Promise<{ freights: IFreight[]; total: number }> => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (userId) filters['participants.userId'] = userId;
  if (query.status) filters.status = query.status;

  const freights = await Freight.find(filters)
    .populate('createdBy', 'firstName lastName phone')
    .populate('transporterId', 'firstName lastName phone vehicle')
    .populate('participants.userId', 'firstName lastName phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Freight.countDocuments(filters);

  return { freights, total };
};

// Obtener flete por ID con validaciones de permisos
export const getFreightByIdService = async (
  freightId: string,
  userId: string
): Promise<IFreight> => {
  const freight = await Freight.findById(freightId)
    .populate('createdBy', 'firstName lastName phone')
    .populate('transporterId', 'firstName lastName phone vehicle')
    .populate('participants.userId', 'firstName lastName phone');

  if (!freight) throw new Error('Flete no encontrado');

  // Verificar permisos de acceso
  const user = await User.findById(userId);
  const isAdmin = user?.role === 'admin';
  const isTransporter = freight.transporterId?.toString() === userId;
  const isParticipant = freight.participants.some(p => p.userId.toString() === userId);

  if (!isAdmin && !isTransporter && !isParticipant)
    throw new Error('No tienes permisos para ver este flete');

  return freight;
};
