import { IFreight } from '@/models/freight.model';
import {
  MARGIN_PERCENTAGE,
  DISTANCE_PRICE_PER_KM,
  FIXED_VOLUME_PRICE,
  FREIGHT_CONSTANTS,
} from './constants';
import {
  IRouteProgress,
  ISuggestedRoute,
  PriceCalculation,
  RouteStop,
} from '@/types/freight.types';

// Calcula el volumen en metros cúbicos a partir de dimensiones en centímetros
export const calculateVolumeM3 = (length: number, width: number, height: number): number => {
  const volumeCm3 = length * width * height;
  const volumeM3 = volumeCm3 / FREIGHT_CONSTANTS.VOLUME_CONVERSION_FACTOR;
  return Math.round(volumeM3 * 1000) / 1000; // Redondea a 3 decimales
};

// Calcula el precio total para un paquete basado en volumen y distancia
export const calculatePackagePrice = (volumeM3: number, distanceKm: number): PriceCalculation => {
  // Precio por volumen + margen fleteshare
  const volumePrice = volumeM3 * FIXED_VOLUME_PRICE * (1 + MARGIN_PERCENTAGE);

  // Precio por distancia (10% del precio de nafta por km) + margen fleteshare
  const distancePrice = distanceKm * DISTANCE_PRICE_PER_KM * (1 + MARGIN_PERCENTAGE);

  const totalPrice = volumePrice + distancePrice;

  return {
    volumePrice: Math.round(volumePrice),
    distancePrice: Math.round(distancePrice),
    totalPrice: Math.round(totalPrice),
    volumeM3,
    distanceKm,
  };
};

// Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Redondear a 2 decimales
};

// Valida las dimensiones de un paquete
export const validatePackageDimensions = (
  length: number,
  width: number,
  height: number
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (length < FREIGHT_CONSTANTS.MIN_PACKAGE_DIMENSION_CM) {
    errors.push(`El largo debe ser al menos ${FREIGHT_CONSTANTS.MIN_PACKAGE_DIMENSION_CM}cm`);
  }

  if (width < FREIGHT_CONSTANTS.MIN_PACKAGE_DIMENSION_CM) {
    errors.push(`El ancho debe ser al menos ${FREIGHT_CONSTANTS.MIN_PACKAGE_DIMENSION_CM}cm`);
  }

  if (height < FREIGHT_CONSTANTS.MIN_PACKAGE_DIMENSION_CM) {
    errors.push(`El alto debe ser al menos ${FREIGHT_CONSTANTS.MIN_PACKAGE_DIMENSION_CM}cm`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Calcula el volumen total del vehículo en metros cúbicos
export const calculateVehicleVolumeM3 = (length: number, width: number, height: number): number =>
  calculateVolumeM3(length, width, height);

// Verifica si un paquete puede caber en el espacio disponible del vehículo
export const canPackageFitInVehicle = (
  packageVolumeM3: number,
  usedVolumeM3: number,
  vehicleTotalVolumeM3: number
): { canFit: boolean; availableVolumeM3: number; requiredVolumeM3: number } => {
  const availableVolumeM3 = vehicleTotalVolumeM3 - usedVolumeM3;
  const canFit = packageVolumeM3 <= availableVolumeM3;

  return {
    canFit,
    availableVolumeM3: Math.round(availableVolumeM3 * 1000) / 1000,
    requiredVolumeM3: packageVolumeM3,
  };
};

const estimateRouteDuration = (route: RouteStop[]): number => {
  const AVERAGE_SPEED_KMH = 25; // Velocidad promedio en ciudad
  const STOP_TIME_MINUTES = 30; // Tiempo promedio por parada

  const totalDistance = route.reduce((total, stop) => total + (stop.distanceFromPrevious || 0), 0);

  const drivingTimeMinutes = (totalDistance / AVERAGE_SPEED_KMH) * 60;
  const stopTimeMinutes = route.length * STOP_TIME_MINUTES;

  return Math.round(drivingTimeMinutes + stopTimeMinutes);
};

const generateOptimizedRouteStops = (
  participants: Array<{
    index: number;
    pickupAddress: any;
    deliveryAddress: any;
  }>
): RouteStop[] => {
  if (participants.length === 0) return [];

  // Crear todos los puntos posibles
  interface TempRoutePoint {
    participantIndex: number;
    type: 'pickup' | 'delivery';
    address: any;
    latitude: number;
    longitude: number;
  }

  const allPoints: TempRoutePoint[] = [];

  participants.forEach(participant => {
    allPoints.push({
      participantIndex: participant.index,
      type: 'pickup',
      address: participant.pickupAddress,
      latitude: participant.pickupAddress.latitude,
      longitude: participant.pickupAddress.longitude,
    });

    allPoints.push({
      participantIndex: participant.index,
      type: 'delivery',
      address: participant.deliveryAddress,
      latitude: participant.deliveryAddress.latitude,
      longitude: participant.deliveryAddress.longitude,
    });
  });

  // Algoritmo de vecino más cercano con restricciones
  const route: TempRoutePoint[] = [];
  const remainingPoints = [...allPoints];
  const pickedUpParticipants = new Set<number>();

  // Empezar desde el primer pickup
  let currentLat = participants[0].pickupAddress.latitude;
  let currentLng = participants[0].pickupAddress.longitude;

  while (remainingPoints.length > 0) {
    let closestIndex = -1;
    let shortestDistance = Infinity;

    // Encontrar el punto más cercano que se pueda visitar
    remainingPoints.forEach((point, index) => {
      // Verificar restricción: no se puede entregar antes de recoger
      if (point.type === 'delivery' && !pickedUpParticipants.has(point.participantIndex)) return;

      const distance = calculateDistance(currentLat, currentLng, point.latitude, point.longitude);

      if (distance < shortestDistance) {
        shortestDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex === -1) break;

    // Agregar el punto más cercano a la ruta
    const nextPoint = remainingPoints.splice(closestIndex, 1)[0];
    route.push(nextPoint);

    // Actualizar posición actual
    currentLat = nextPoint.latitude;
    currentLng = nextPoint.longitude;

    // Marcar como recogido si es pickup
    if (nextPoint.type === 'pickup') pickedUpParticipants.add(nextPoint.participantIndex);
  }

  // Convertir a RouteStop con información adicional
  const optimizedRoute: RouteStop[] = route.map((point, index) => {
    let distanceFromPrevious = 0;

    if (index > 0) {
      const prevPoint = route[index - 1];
      distanceFromPrevious = calculateDistance(
        prevPoint.latitude,
        prevPoint.longitude,
        point.latitude,
        point.longitude
      );
    }

    return {
      participantIndex: point.participantIndex,
      type: point.type,
      address: point.address,
      visited: false,
      distanceFromPrevious: Math.round(distanceFromPrevious * 100) / 100,
    };
  });

  return optimizedRoute;
};

export const generateOptimizedSuggestedRoute = (
  participants: Array<{
    index: number;
    pickupAddress: any;
    deliveryAddress: any;
  }>
): ISuggestedRoute => {
  if (participants.length === 0) {
    return {
      pickupSequence: [],
      deliverySequence: [],
      totalDistance: 0,
      optimizedRoute: [],
      totalStops: 0,
    };
  }

  // Generar la ruta optimizada
  const optimizedRoute = generateOptimizedRouteStops(participants);

  // Mantener compatibilidad con estructura anterior
  const pickupSequence = optimizedRoute
    .filter(stop => stop.type === 'pickup')
    .map(stop => ({
      participantIndex: stop.participantIndex,
      address: stop.address,
      visited: stop.visited,
    }));

  const deliverySequence = optimizedRoute
    .filter(stop => stop.type === 'delivery')
    .map(stop => ({
      participantIndex: stop.participantIndex,
      address: stop.address,
      visited: stop.visited,
    }));

  const totalDistance = optimizedRoute.reduce(
    (total, stop) => total + (stop.distanceFromPrevious || 0),
    0
  );

  return {
    pickupSequence,
    deliverySequence,
    totalDistance: Math.round(totalDistance * 100) / 100,
    optimizedRoute,
    totalStops: optimizedRoute.length,
    estimatedDuration: estimateRouteDuration(optimizedRoute),
  };
};

export const updateFreightWithOptimizedRoute = (freight: any, participants: any[]) => {
  // Preparar datos para el algoritmo
  const routeData = participants.map((participant, index) => ({
    index,
    pickupAddress: participant.pickupAddress,
    deliveryAddress: participant.deliveryAddress,
  }));

  // Generar nueva ruta optimizada
  const suggestedRoute = generateOptimizedSuggestedRoute(routeData);

  // Actualizar el freight
  freight.suggestedRoute = suggestedRoute;

  return freight;
};

// Función auxiliar para mostrar la ruta de forma legible
export const formatRouteForDisplay = (route: RouteStop[]): string => {
  return route
    .map((stop, index) => {
      const action = stop.type === 'pickup' ? 'Recoger' : 'Entregar';
      const participant = `Participante ${stop.participantIndex}`;
      const address = `${stop.address.street} ${stop.address.number}, ${stop.address.city}`;
      const distance = stop.distanceFromPrevious
        ? ` (${stop.distanceFromPrevious}km desde parada anterior)`
        : '';

      return `${index + 1}. ${action} - ${participant} en ${address}${distance}`;
    })
    .join('\n');
};

// Verifica si un usuario puede marcar una parada como visitada
export const canMarkStopAsVisited = (
  freight: IFreight,
  userId: string,
  participantIndex: number,
  stopType: 'pickup' | 'delivery'
): { canMark: boolean; reason?: string } => {
  const userParticipant = freight.participants.find(p => p.user.toString() === userId);
  if (!userParticipant) return { canMark: false, reason: 'No estás participando en este flete' };

  if (freight.participants[participantIndex]?.user.toString() !== userId)
    return { canMark: false, reason: 'Solo puedes marcar tus propios puntos' };

  if (freight.status !== 'started')
    return { canMark: false, reason: 'El flete debe estar iniciado' };

  if (!freight.suggestedRoute?.optimizedRoute)
    return { canMark: false, reason: 'No se encontró ruta optimizada' };

  const stopIndex = freight.suggestedRoute.optimizedRoute.findIndex(
    stop => stop.participantIndex === participantIndex && stop.type === stopType
  );

  if (stopIndex === -1) return { canMark: false, reason: 'No se encontró el punto en la ruta' };

  if (freight.suggestedRoute.optimizedRoute[stopIndex].visited)
    return { canMark: false, reason: 'Este punto ya está visitado' };

  if (stopIndex > 0) {
    const previousStop = freight.suggestedRoute.optimizedRoute[stopIndex - 1];
    if (!previousStop.visited) {
      return { canMark: false, reason: 'Debes completar el punto anterior primero' };
    }
  }

  return { canMark: true };
};

// Función para marcar una parada como visitada
export const markStopAsVisited = (
  freight: any,
  participantIndex: number,
  type: 'pickup' | 'delivery'
): boolean => {
  const stop = freight.suggestedRoute.optimizedRoute.find(
    (s: RouteStop) => s.participantIndex === participantIndex && s.type === type
  );

  if (stop && !stop.visited) {
    stop.visited = true;

    // También actualizar las secuencias antiguas para compatibilidad
    if (type === 'pickup') {
      const pickupStop = freight.suggestedRoute.pickupSequence.find(
        (p: any) => p.participantIndex === participantIndex
      );
      if (pickupStop) pickupStop.visited = true;
    } else {
      const deliveryStop = freight.suggestedRoute.deliverySequence.find(
        (d: any) => d.participantIndex === participantIndex
      );
      if (deliveryStop) deliveryStop.visited = true;
    }

    return true;
  }

  return false;
};

// Verifica si un usuario puede unirse a un flete basado en las reglas de negocio
export const validateCanJoinFreight = (
  freight: IFreight,
  userPickupLat: number,
  userPickupLng: number,
  userDeliveryLat: number,
  userDeliveryLng: number,
  packageVolumeM3: number
): {
  canJoin: boolean;
  reasons: string[];
  availableVolumeM3?: number;
} => {
  const reasons: string[] = [];

  // Verificar número máximo de participantes
  if (freight.participants.length >= FREIGHT_CONSTANTS.MAX_PARTICIPANTS)
    reasons.push('El flete ya tiene el máximo de participantes permitidos');

  // Verificar que el flete esté en estado correcto
  if (freight.status !== 'requested' && freight.status !== 'taken')
    reasons.push('El flete no está disponible para nuevos participantes');

  // Verificar capacidad del vehículo
  let availableVolumeM3 = 0;
  if (freight.assignedVehicle) {
    availableVolumeM3 = freight.assignedVehicle.dimensions.totalVolumeM3 - freight.usedVolumeM3;
    if (packageVolumeM3 > availableVolumeM3)
      reasons.push('El paquete no cabe en el espacio disponible del vehículo');
  }

  // Verificar distancia (al menos un participante debe estar en rango)
  const withinRange = freight.participants.some(participant => {
    const pickupDistance = calculateDistance(
      userPickupLat,
      userPickupLng,
      participant.pickupAddress.latitude,
      participant.pickupAddress.longitude
    );
    const deliveryDistance = calculateDistance(
      userDeliveryLat,
      userDeliveryLng,
      participant.deliveryAddress.latitude,
      participant.deliveryAddress.longitude
    );

    return (
      pickupDistance <= FREIGHT_CONSTANTS.MAX_DISTANCE_RANGE_KM &&
      deliveryDistance <= FREIGHT_CONSTANTS.MAX_DISTANCE_RANGE_KM
    );
  });

  if (!withinRange)
    reasons.push(
      `Las direcciones deben estar dentro de ${FREIGHT_CONSTANTS.MAX_DISTANCE_RANGE_KM}km de otro participante`
    );

  return {
    canJoin: reasons.length === 0,
    reasons,
    availableVolumeM3: Math.round(availableVolumeM3 * 1000) / 1000,
  };
};

export const getRouteProgress = (freight: IFreight): IRouteProgress => {
  if (!freight.suggestedRoute?.optimizedRoute) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  const total = freight.suggestedRoute.optimizedRoute.length;
  const completed = freight.suggestedRoute.optimizedRoute.filter(stop => stop.visited).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
};

export const getNextDestination = (freight: IFreight) => {
  if (!freight.suggestedRoute?.optimizedRoute) return null;
  return freight.suggestedRoute.optimizedRoute.find(stop => !stop.visited) || null;
};
