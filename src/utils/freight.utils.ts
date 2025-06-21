import {
  MARGIN_PERCENTAGE,
  DISTANCE_PRICE_PER_KM,
  FIXED_VOLUME_PRICE,
  FREIGHT_CONSTANTS,
} from './constants';
import { PriceCalculation } from '@/types/freight.types';

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

// Genera una ruta sugerida basada en proximidad geográfica. Primero todos los pickups, luego todos los deliveries
export const generateSuggestedRoute = (
  participants: Array<{
    index: number;
    pickupAddress: { latitude: number; longitude: number };
    deliveryAddress: { latitude: number; longitude: number };
  }>
): {
  pickupSequence: number[];
  deliverySequence: number[];
  totalDistance: number;
} => {
  if (participants.length === 0) {
    return { pickupSequence: [], deliverySequence: [], totalDistance: 0 };
  }

  // Algoritmo simple de vecino más cercano para pickup
  const pickupSequence: number[] = [];
  const remainingPickups = [...participants];
  let currentLat = participants[0].pickupAddress.latitude;
  let currentLng = participants[0].pickupAddress.longitude;

  while (remainingPickups.length > 0) {
    let closestIndex = 0;
    let shortestDistance = Infinity;

    remainingPickups.forEach((participant, index) => {
      const distance = calculateDistance(
        currentLat,
        currentLng,
        participant.pickupAddress.latitude,
        participant.pickupAddress.longitude
      );

      if (distance < shortestDistance) {
        shortestDistance = distance;
        closestIndex = index;
      }
    });

    const closest = remainingPickups.splice(closestIndex, 1)[0];
    pickupSequence.push(closest.index);
    currentLat = closest.pickupAddress.latitude;
    currentLng = closest.pickupAddress.longitude;
  }

  // Algoritmo similar para delivery, empezando desde el último pickup
  const deliverySequence: number[] = [];
  const remainingDeliveries = [...participants];

  while (remainingDeliveries.length > 0) {
    let closestIndex = 0;
    let shortestDistance = Infinity;

    remainingDeliveries.forEach((participant, index) => {
      const distance = calculateDistance(
        currentLat,
        currentLng,
        participant.deliveryAddress.latitude,
        participant.deliveryAddress.longitude
      );

      if (distance < shortestDistance) {
        shortestDistance = distance;
        closestIndex = index;
      }
    });

    const closest = remainingDeliveries.splice(closestIndex, 1)[0];
    deliverySequence.push(closest.index);
    currentLat = closest.deliveryAddress.latitude;
    currentLng = closest.deliveryAddress.longitude;
  }

  // Calcular distancia total aproximada
  let totalDistance = 0;

  // Distancia entre pickups
  for (let i = 0; i < pickupSequence.length - 1; i++) {
    const from = participants.find(p => p.index === pickupSequence[i])!;
    const to = participants.find(p => p.index === pickupSequence[i + 1])!;
    totalDistance += calculateDistance(
      from.pickupAddress.latitude,
      from.pickupAddress.longitude,
      to.pickupAddress.latitude,
      to.pickupAddress.longitude
    );
  }

  // Distancia del último pickup al primer delivery
  if (pickupSequence.length > 0 && deliverySequence.length > 0) {
    const lastPickup = participants.find(
      p => p.index === pickupSequence[pickupSequence.length - 1]
    )!;
    const firstDelivery = participants.find(p => p.index === deliverySequence[0])!;
    totalDistance += calculateDistance(
      lastPickup.pickupAddress.latitude,
      lastPickup.pickupAddress.longitude,
      firstDelivery.deliveryAddress.latitude,
      firstDelivery.deliveryAddress.longitude
    );
  }

  // Distancia entre deliveries
  for (let i = 0; i < deliverySequence.length - 1; i++) {
    const from = participants.find(p => p.index === deliverySequence[i])!;
    const to = participants.find(p => p.index === deliverySequence[i + 1])!;
    totalDistance += calculateDistance(
      from.deliveryAddress.latitude,
      from.deliveryAddress.longitude,
      to.deliveryAddress.latitude,
      to.deliveryAddress.longitude
    );
  }

  return {
    pickupSequence,
    deliverySequence,
    totalDistance: Math.round(totalDistance * 100) / 100,
  };
};

// Verifica si un usuario puede unirse a un flete basado en las reglas de negocio
export const validateCanJoinFreight = (
  freight: {
    participants: Array<any>;
    status: string;
    transporterId?: unknown;
    usedVolumeM3: number;
    assignedVehicle?: { dimensions: { totalVolumeM3: number } };
  },
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

  // Verificar que tenga transportista asignado
  if (!freight.transporterId) reasons.push('El flete debe tener un transportista asignado');

  // Verificar capacidad del vehículo
  let availableVolumeM3 = 0;
  if (freight.assignedVehicle) {
    availableVolumeM3 = freight.assignedVehicle.dimensions.totalVolumeM3 - freight.usedVolumeM3;
    if (packageVolumeM3 > availableVolumeM3)
      reasons.push('El paquete no cabe en el espacio disponible del vehículo');
  } else reasons.push('No hay información del vehículo asignado');

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
