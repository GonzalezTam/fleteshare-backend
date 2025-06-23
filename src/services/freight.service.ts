import { Types } from 'mongoose';
import { Freight, IFreight, IFreightParticipant } from '@/models/freight.model';
import { User } from '@/models/User.model';
import { UserRole } from '@/types/user.types';
import { VALID_TRANSITIONS } from '@/utils/constants';
import {
  CreateFreightRequest,
  JoinFreightRequest,
  FreightQuery,
  FreightStatus,
} from '@/types/freight.types';
import {
  getStartOfTodayUTC,
  getDateAtNoonUTC,
  createDateFilters,
  isTodayOrFuture,
} from '@/utils/time.utils';
import {
  calculateVolumeM3,
  calculatePackagePrice,
  calculateDistance,
  validatePackageDimensions,
  validateCanJoinFreight,
  calculateVehicleVolumeM3,
  generateOptimizedSuggestedRoute,
} from '@/utils/freight.utils';

// ==========================================
// CREATE NEW FREIGHT SERVICE
// ==========================================
export const createFreightService = async (
  userId: string,
  freightData: CreateFreightRequest
): Promise<IFreight> => {
  // Verificar que el usuario existe y tiene perfil completo
  const user = await User.findById(userId);
  if (!user) throw new Error('Usuario no encontrado');
  if (!user.isProfileCompleted) throw new Error('Debe completar su perfil antes de crear un flete');
  if (user.role !== 'customer') throw new Error('Solo los clientes pueden crear fletes');

  // Validar que la fecha programada sea válida
  if (!isTodayOrFuture(freightData.scheduledDate))
    throw new Error('La fecha programada debe ser hoy o en el futuro');

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
    user: new Types.ObjectId(userId),
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

  const optimizedSuggestedRoute = generateOptimizedSuggestedRoute(routeData);

  // Crear el flete con fecha al mediodía UTC para evitar problemas de zona horaria
  const freight = new Freight({
    createdBy: userId,
    participants: [initialParticipant],
    status: 'requested',
    totalPrice: priceCalculation.totalPrice,
    usedVolumeM3: volumeM3,
    scheduledDate: getDateAtNoonUTC(freightData.scheduledDate),
    suggestedRoute: optimizedSuggestedRoute,
  });

  const savedFreight = await freight.save();

  // TODO: create a notification for the user (who created the freight)

  return savedFreight;
};

// ==========================================
// JOIN FREIGHT SERVICE
// ==========================================
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

  // Verificar que el flete aún sea válido (fecha futura o hoy)
  if (!isTodayOrFuture(freight.scheduledDate))
    throw new Error('No puedes unirte a un flete con fecha vencida');

  // Verificar que el usuario no esté ya en el flete
  const alreadyParticipating = freight.participants.some(p => p.user.toString() === userId);
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
    throw new Error(`Ups, no podés unirte al flete: ${validation.reasons.join(', ')}`);

  // Calcular precio
  const priceCalculation = calculatePackagePrice(volumeM3, distance);

  // Crear nuevo participante
  const newParticipant: IFreightParticipant = {
    user: new Types.ObjectId(userId),
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

  // Recalcular ruta optimizada SIEMPRE (con o sin transportista)
  const routeData = freight.participants.map((participant, index) => ({
    index,
    pickupAddress: participant.pickupAddress,
    deliveryAddress: participant.deliveryAddress,
  }));

  // Generar nueva ruta optimizada
  const optimizedSuggestedRoute = generateOptimizedSuggestedRoute(routeData);

  freight.suggestedRoute = optimizedSuggestedRoute;
  if (freight.suggestedRoute.optimizedRoute.length === 0)
    throw new Error('No se pudo generar una ruta válida para el flete');

  // Guardar el flete actualizado
  const updatedFreight = await freight.save();

  // TODO: create a notification for the freight creator

  if (freight.transporterId) {
    // TODO: create a notification for the transporter
  }

  // TODO: create a notification for the user (who joined the freight)
  return updatedFreight;
};

// ==========================================
// LEAVE FREIGHT SERVICE
// ==========================================
export const leaveFreightService = async (
  userId: string,
  userRole: UserRole,
  freightId: string
): Promise<IFreight> => {
  const freight = await Freight.findById(freightId);
  if (!freight) throw new Error('Flete no encontrado');

  if (userRole === 'customer') {
    return await handleCustomerLeave(userId, freight);
  } else if (userRole === 'transporter') {
    return await handleTransporterLeave(userId, freight);
  } else {
    throw new Error('Rol no válido para abandonar flete');
  }
};

const handleCustomerLeave = async (userId: string, freight: IFreight): Promise<IFreight> => {
  // Verificar que el usuario está en el flete
  const participantIndex = freight.participants.findIndex(p => p.user.toString() === userId);

  if (participantIndex === -1) {
    throw new Error('No estás participando en este flete');
  }

  // Verificar que no sea el único participante
  if (freight.participants.length <= 1) {
    throw new Error(
      'No puedes abandonar el flete siendo el único participante. Usa la opción cancelar en su lugar.'
    );
  }

  // Verificar que el flete esté en estado válido para abandonar
  if (!['requested', 'taken'].includes(freight.status)) {
    throw new Error('No puedes abandonar un flete que ya está en progreso o terminado');
  }

  // Obtener datos del participante que se va
  const leavingParticipant = freight.participants[participantIndex];

  // Eliminar al participante
  freight.participants.splice(participantIndex, 1);

  // Recalcular totales
  freight.totalPrice -= leavingParticipant.price;
  freight.usedVolumeM3 -= leavingParticipant.packageDimensions.volumeM3;

  // Recalcular volumen disponible si hay vehículo asignado
  if (freight.assignedVehicle) {
    freight.availableVolumeM3 =
      freight.assignedVehicle.dimensions.totalVolumeM3 - freight.usedVolumeM3;
  }

  // Regenerar ruta optimizada con los participantes restantes
  const routeData = freight.participants.map((participant, index) => ({
    index,
    pickupAddress: participant.pickupAddress,
    deliveryAddress: participant.deliveryAddress,
  }));

  const optimizedSuggestedRoute = generateOptimizedSuggestedRoute(routeData);
  freight.suggestedRoute = optimizedSuggestedRoute;

  const updatedFreight = await freight.save();

  // TODO: Crear notificación para los participantes restantes
  // TODO: Crear notificación para el transportista (si existe)

  return updatedFreight;
};

const handleTransporterLeave = async (userId: string, freight: IFreight): Promise<IFreight> => {
  // Verificar que el usuario es el transportista del flete
  if (!freight.transporterId || freight.transporterId.toString() !== userId) {
    throw new Error('No eres el transportista de este flete');
  }

  // Verificar que el flete esté en estado 'taken'
  if (freight.status !== 'taken') {
    throw new Error('Solo puedes abandonar un flete que esté en estado "tomado"');
  }

  // Remover transportista y vehículo
  freight.transporterId = undefined;
  freight.assignedVehicle = undefined;
  freight.status = 'requested';
  freight.availableVolumeM3 = 0;

  // Limpiar ruta sugerida específica del transportista (mantener solo la básica)
  const routeData = freight.participants.map((participant, index) => ({
    index,
    pickupAddress: participant.pickupAddress,
    deliveryAddress: participant.deliveryAddress,
  }));

  const basicRoute = generateOptimizedSuggestedRoute(routeData);
  freight.suggestedRoute = basicRoute;

  const updatedFreight = await freight.save();

  // TODO: Crear notificación para todos los participantes

  return updatedFreight;
};

// ==========================================
// CANCEL FREIGHT SERVICE
// ==========================================
export const cancelFreightService = async (
  userId: string,
  userRole: UserRole,
  freightId: string,
  cancellationReason?: string
): Promise<IFreight> => {
  const freight = await Freight.findById(freightId);
  if (!freight) throw new Error('Flete no encontrado');

  if (userRole === 'customer') {
    return await handleCustomerCancel(userId, freight, cancellationReason);
  } else if (userRole === 'transporter') {
    return await handleTransporterCancel(userId, freight, cancellationReason);
  } else {
    throw new Error('Rol no válido para cancelar flete');
  }
};

const handleCustomerCancel = async (
  userId: string,
  freight: IFreight,
  cancellationReason?: string
): Promise<IFreight> => {
  // Verificar que sea el único participante
  if (freight.participants.length > 1)
    throw new Error(
      'No puedes cancelar un flete con múltiples participantes. Usa la opción abandonar en su lugar.'
    );

  // Verificar que sea el participante del flete
  const isParticipant = freight.participants.some(p => p.user.toString() === userId);
  if (!isParticipant) throw new Error('No estás participando en este flete');

  // Verificar que el flete esté en estado válido para cancelar
  if (!['requested', 'taken', 'finished'].includes(freight.status))
    throw new Error('No puedes cancelar un flete que ya está en progreso o terminado');

  // Actualizar estado a cancelado
  freight.status = 'canceled';
  freight.cancelledAt = new Date();
  if (cancellationReason) freight.cancellationReason = cancellationReason;

  const updatedFreight = await freight.save();

  // TODO: Crear notificación para el transportista (si existe)

  return updatedFreight;
};

const handleTransporterCancel = async (
  userId: string,
  freight: IFreight,
  cancellationReason?: string
): Promise<IFreight> => {
  // Verificar que el usuario es el transportista del flete
  if (!freight.transporterId || freight.transporterId.toString() !== userId)
    throw new Error('No eres el transportista de este flete');

  // Verificar que el flete esté en estado 'started'
  if (freight.status !== 'started')
    throw new Error('Solo puedes cancelar un flete que esté en estado "iniciado"');

  //// Verificar que se proporcione una razón
  //if (!cancellationReason || cancellationReason.trim().length === 0)
  //  throw new Error('Debes proporcionar una razón para cancelar el flete');

  // Actualizar estado a cancelado
  freight.status = 'canceled';
  freight.cancelledAt = new Date();
  if (cancellationReason) freight.cancellationReason = cancellationReason;

  const updatedFreight = await freight.save();

  // TODO: Crear notificaciones para todos los participantes

  return updatedFreight;
};

// ==========================================
// MARK STOP AS VISITED SERVICE
// ==========================================
export const markStopAsVisitedService = async (
  userId: string,
  freightId: string,
  participantIndex: number,
  stopType: 'pickup' | 'delivery'
): Promise<IFreight> => {
  const freight = await Freight.findById(freightId);
  if (!freight) throw new Error('Flete no encontrado');

  // Verificar que el usuario sea participante del flete
  const userParticipant = freight.participants.find(p => p.user.toString() === userId);
  if (!userParticipant) throw new Error('No estás participando en este flete');

  // Verificar que el índice del participante corresponda al usuario
  if (freight.participants[participantIndex]?.user.toString() !== userId)
    throw new Error('Solo puedes marcar como visitados tus propios puntos');

  // Verificar que el flete esté iniciado
  if (freight.status !== 'started')
    throw new Error('El flete debe estar iniciado para marcar puntos como visitados');

  // Verificar que existe la ruta optimizada
  if (!freight.suggestedRoute?.optimizedRoute)
    throw new Error('No se encontró ruta optimizada para este flete');

  // Encontrar el stop correspondiente
  const stopIndex = freight.suggestedRoute.optimizedRoute.findIndex(
    stop => stop.participantIndex === participantIndex && stop.type === stopType
  );

  if (stopIndex === -1) throw new Error('No se encontró el punto especificado en la ruta');

  // Verificar que el stop anterior esté visitado (si existe)
  if (stopIndex > 0) {
    const previousStop = freight.suggestedRoute.optimizedRoute[stopIndex - 1];
    if (!previousStop.visited)
      throw new Error(
        'Debes completarse el punto anterior antes de marcar este punto como visitado'
      );
  }

  // Verificar que el stop no esté ya visitado
  const currentStop = freight.suggestedRoute.optimizedRoute[stopIndex];
  if (currentStop.visited) throw new Error('Este punto ya está marcado como visitado');

  // Marcar como visitado
  freight.suggestedRoute.optimizedRoute[stopIndex].visited = true;

  // También actualizar las secuencias legacy para compatibilidad
  if (stopType === 'pickup') {
    const pickupStop = freight.suggestedRoute.pickupSequence.find(
      p => p.participantIndex === participantIndex
    );
    if (pickupStop) pickupStop.visited = true;
  } else {
    const deliveryStop = freight.suggestedRoute.deliverySequence.find(
      d => d.participantIndex === participantIndex
    );
    if (deliveryStop) deliveryStop.visited = true;
  }

  const updatedFreight = await freight.save();

  // TODO: Crear notificación para otros participantes y transportista

  return updatedFreight;
};

// ==========================================
// MARK FREIGHT AS FINISHED SERVICE
// ==========================================
export const finishFreightService = async (
  userId: string,
  freightId: string
): Promise<IFreight> => {
  const freight = await Freight.findById(freightId);
  if (!freight) throw new Error('Flete no encontrado');

  // Verificar que el usuario es el transportista
  if (!freight.transporterId || freight.transporterId.toString() !== userId)
    throw new Error('Solo el transportista puede finalizar el flete');

  // Verificar que el flete esté iniciado
  if (freight.status !== 'started')
    throw new Error('El flete debe estar iniciado para poder finalizarlo');

  // Verificar que todos los puntos estén visitados
  if (!freight.suggestedRoute?.optimizedRoute)
    throw new Error('No se encontró ruta para verificar');

  const allVisited = freight.suggestedRoute.optimizedRoute.every(stop => stop.visited);
  if (!allVisited)
    throw new Error('Todos los puntos deben estar visitados antes de finalizar el flete');

  // Finalizar flete
  freight.status = 'finished';
  freight.completedAt = new Date();

  const updatedFreight = await freight.save();

  // TODO: Crear notificaciones para todos los participantes

  return updatedFreight;
};

// ==========================================
// ASSIGN TRANSPORTER SERVICE
// ==========================================
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
    status: { $in: ['taken', 'started'] },
  });

  if (activeFreight) throw new Error('El transportista ya tiene un flete activo');

  // Obtener el flete
  const freight = await Freight.findById(freightId);
  if (!freight) throw new Error('Flete no encontrado');

  if (freight.status !== 'requested')
    throw new Error('El flete no está disponible para ser tomado');
  if (freight.transporterId) throw new Error('El flete ya tiene transportista asignado');

  // Verificar que el flete aún sea válido (fecha futura o hoy)
  if (!isTodayOrFuture(freight.scheduledDate))
    throw new Error('No puedes tomar un flete con fecha vencida');

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

  const optimizedSuggestedRoute = generateOptimizedSuggestedRoute(routeData);
  freight.suggestedRoute = optimizedSuggestedRoute;
  if (freight.suggestedRoute.optimizedRoute.length === 0)
    throw new Error('No se pudo generar una ruta válida para el flete');

  const updatedFreight = await freight.save();

  // TODO: create a notification for the transporter

  //for (const participant of freight.participants) {
  // TODO: create a notification for the freight participants
  //}

  return updatedFreight;
};

// ==========================================
// UPDATE FREIGHT STATUS SERVICE
// ==========================================
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
  const isParticipant = freight.participants.some(p => p.user.toString() === userId);
  const user = await User.findById(userId);
  const isAdmin = user?.role === 'admin';

  if (!isTransporter && !isParticipant && !isAdmin)
    throw new Error('No tienes permisos para actualizar este flete');

  const currentStatus = freight.status;
  if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus))
    throw new Error(`No se puede cambiar el estado de '${currentStatus}' a '${newStatus}'`);

  // Solo el transportista puede cambiar a estados operativos
  if (['started', 'finished'].includes(newStatus) && !isTransporter)
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
    started: 'Tu flete está en camino',
    finished: 'Tu flete ha sido completado exitosamente',
    canceled: `Tu flete ha sido cancelado${cancellationReason ? `: ${cancellationReason}` : ''}`,
  };

  // TODO: create a notification for all participants

  if (freight.transporterId && freight.transporterId.toString() !== userId) {
    // TODO: create a notification for the transporter if it's not the user updating
  }

  return updatedFreight;
};

// ==========================================
// GET FREIGHTS SERVICE
// ==========================================
export const getFreightsService = async (
  userId: string,
  query: FreightQuery = {}
): Promise<{ freights: IFreight[]; total: number }> => {
  const user = await User.findById(userId);
  if (!user) throw new Error('Usuario no encontrado');

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Filtros base
  let filters: any = {};

  if (user.role === 'transporter') {
    filters = {
      status: 'requested',
      transporterId: { $exists: false },
      scheduledDate: { $gte: getStartOfTodayUTC() }, // Incluir desde hoy en UTC
    };
  } else if (user.role === 'customer') {
    filters = {
      'participants.user': { $ne: new Types.ObjectId(userId) },
      status: { $in: ['requested', 'taken'] },
      scheduledDate: { $gte: getStartOfTodayUTC() }, // Incluir desde hoy en UTC
    };
  }

  // Aplicar filtros de fecha adicionales usando dateUtils
  const dateFilters = createDateFilters({
    from: query.scheduledDateFrom,
    to: query.scheduledDateTo,
  });

  if (dateFilters) {
    filters.scheduledDate = {
      ...filters.scheduledDate,
      ...dateFilters,
    };
  }

  const freights = await Freight.find(filters)
    .populate('createdBy', 'firstName lastName phone')
    .populate('participants.user', 'firstName lastName phone username')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Freight.countDocuments(filters);

  return { freights, total };
};

// ==========================================
// GET USER FREIGHTS SERVICE
// ==========================================
export const getUserFreightsService = async (
  userId?: string,
  role?: UserRole,
  query: FreightQuery = {}
): Promise<{ freights: IFreight[]; total: number }> => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (userId && role === 'customer') filters['participants.user'] = userId;
  if (userId && role === 'transporter') filters.transporterId = userId;
  if (query.status) filters.status = query.status;

  // Aplicar filtros de fecha usando dateUtils
  const dateFilters = createDateFilters({
    from: query.scheduledDateFrom,
    to: query.scheduledDateTo,
  });

  if (dateFilters) filters.scheduledDate = dateFilters;

  const freights = await Freight.find(filters)
    .populate('createdBy', 'firstName lastName phone')
    .populate('transporterId', 'firstName lastName phone vehicle')
    .populate('participants.user', 'firstName lastName phone username')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Freight.countDocuments(filters);

  return { freights, total };
};

// ==========================================
// GET FREIGHT BY ID SERVICE
// ==========================================
export const getFreightByIdService = async (freightId: string): Promise<IFreight> => {
  const freight = await Freight.findById(freightId)
    .populate('transporterId', 'firstName lastName phone vehicle')
    .populate('participants.user', 'firstName lastName phone username');

  if (!freight) throw new Error('Flete no encontrado');

  return freight;
};
