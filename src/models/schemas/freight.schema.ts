import { Schema } from 'mongoose';
import { FREIGHT_CONSTANTS } from '@/utils/constants';
import { IFreight, IFreightParticipant } from '../freight.model';
import { addressSchema } from './address.schema';
import { participantSchema } from './participant.schema';

export const freightSchema = new Schema<IFreight>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    participants: {
      type: [participantSchema],
      validate: {
        validator: function (participants: IFreightParticipant[]) {
          return participants.length >= 1 && participants.length <= 3;
        },
        message: 'El flete debe tener entre 1 y 3 participantes máximo',
      },
    },
    transporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      enum: ['requested', 'taken', 'started', 'going', 'finished', 'canceled'],
      default: 'requested',
      index: true,
    },
    assignedVehicle: {
      plate: { type: String },
      dimensions: {
        length: { type: Number }, // cm
        width: { type: Number }, // cm
        height: { type: Number }, // cm
        totalVolumeM3: { type: Number }, // m³
      },
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    usedVolumeM3: {
      type: Number,
      required: true,
      min: 0,
    },
    availableVolumeM3: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
    suggestedRoute: {
      pickupSequence: [
        {
          participantIndex: { type: Number, required: true },
          address: { type: addressSchema, required: true },
          estimatedTime: { type: Date },
        },
      ],
      deliverySequence: [
        {
          participantIndex: { type: Number, required: true },
          address: { type: addressSchema, required: true },
          estimatedTime: { type: Date },
        },
      ],
      totalDistance: { type: Number, required: true, min: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Índices para optimizar consultas
freightSchema.index({ createdBy: 1, status: 1 });
freightSchema.index({ transporterId: 1, status: 1 });
freightSchema.index({ status: 1, scheduledDate: 1 });
freightSchema.index({ 'participants.userId': 1 });
freightSchema.index({
  'participants.pickupAddress.latitude': 1,
  'participants.pickupAddress.longitude': 1,
});
freightSchema.index({
  'participants.deliveryAddress.latitude': 1,
  'participants.deliveryAddress.longitude': 1,
});

// Middleware para validar que el transportista tenga vehículo asignado cuando el status es 'taken'
freightSchema.pre('save', function (next) {
  if (this.status === 'taken' && !this.assignedVehicle)
    return next(new Error('El flete tomado debe tener un vehículo asignado'));

  // Validar que la suma de volúmenes no exceda el vehículo asignado
  if (this.assignedVehicle && this.usedVolumeM3 > this.assignedVehicle.dimensions.totalVolumeM3)
    return next(new Error('El volumen total de los paquetes excede la capacidad del vehículo'));

  next();
});

// Método para calcular si un paquete puede unirse al flete
freightSchema.methods.canAccommodatePackage = function (packageVolumeM3: number): boolean {
  return this.usedVolumeM3 + packageVolumeM3 <= this.availableVolumeM3;
};

// Método para verificar si un usuario está en el rango de distancia permitido (20km)
freightSchema.methods.isWithinRange = function (
  userPickupLat: number,
  userPickupLng: number,
  userDeliveryLat: number,
  userDeliveryLng: number
): boolean {
  // Verificar que tanto el pickup como el delivery estén dentro del rango
  // de al menos un participante existente
  return this.participants.some((participant: IFreightParticipant) => {
    const pickupDistance = this.calculateDistance(
      userPickupLat,
      userPickupLng,
      participant.pickupAddress.latitude,
      participant.pickupAddress.longitude
    );
    const deliveryDistance = this.calculateDistance(
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
};

// Método auxiliar para calcular distancia entre dos puntos (fórmula de Haversine)
freightSchema.methods.calculateDistance = function (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
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
  return R * c;
};
