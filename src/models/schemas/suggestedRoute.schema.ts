import { Schema } from 'mongoose';
import { addressSchema } from './address.schema';

// Schema para un stop individual en la ruta optimizada
const routeStopSchema = new Schema(
  {
    participantIndex: { type: Number, required: true },
    type: { type: String, enum: ['pickup', 'delivery'], required: true },
    address: { type: addressSchema, required: true },
    visited: { type: Boolean, default: false },
    estimatedArrivalTime: { type: Date },
    distanceFromPrevious: { type: Number, min: 0 },
  },
  { _id: true }
);

// Schema para puntos de ruta legacy (compatibilidad hacia atrás)
const routePointSchema = new Schema(
  {
    participantIndex: { type: Number, required: true },
    address: { type: addressSchema, required: true },
    estimatedTime: { type: Date },
    visited: { type: Boolean, default: false },
  },
  { _id: true }
);

// Schema para la ruta sugerida completa
export const suggestedRouteSchema = new Schema(
  {
    // Secuencias legacy (mantener compatibilidad)
    pickupSequence: {
      type: [routePointSchema],
      default: [],
    },
    deliverySequence: {
      type: [routePointSchema],
      default: [],
    },

    // Nueva ruta optimizada paso a paso
    optimizedRoute: {
      type: [routeStopSchema],
      default: [],
      validate: {
        validator: function (route: any[]) {
          // Validar que cada participante tenga exactamente un pickup y un delivery
          const participantCounts = new Map();

          route.forEach(stop => {
            const key = `${stop.participantIndex}-${stop.type}`;
            participantCounts.set(key, (participantCounts.get(key) || 0) + 1);
          });

          // Verificar que no haya duplicados
          for (const count of participantCounts.values()) {
            if (count > 1) return false;
          }

          return true;
        },
        message: 'Cada participante debe tener exactamente un pickup y un delivery en la ruta',
      },
    },

    // Métricas de la ruta
    totalDistance: { type: Number, required: true, min: 0 },
    totalStops: { type: Number, min: 0 },
    estimatedDuration: { type: Number, min: 0 }, // En minutos
  },
  { _id: false }
);
