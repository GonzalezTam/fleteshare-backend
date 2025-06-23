import { model, Document, Types } from 'mongoose';
import { FreightStatus, IAddress, ISuggestedRoute } from '@/types/freight.types';
import { freightSchema } from './schemas/freight.schema';

export interface IFreightParticipant {
  user: Types.ObjectId;
  pickupAddress: IAddress;
  deliveryAddress: IAddress;
  packageDimensions: {
    length: number; // en cm
    width: number; // en cm
    height: number; // en cm
    volumeM3: number; // volumen calculado en m³
  };
  price: number; // precio calculado para este participante
  distance: number; // distancia total de pickup a delivery en km
  joinedAt: Date;
}

export interface IFreight extends Document {
  // Cliente que inició el flete
  createdBy: Types.ObjectId;

  // Participantes del flete (incluyendo el creador)
  participants: IFreightParticipant[];

  // Transportista asignado
  transporterId?: Types.ObjectId;

  // Estado del flete
  status: FreightStatus;

  // Información del vehículo del transportista (copiada al momento de asignar)
  assignedVehicle?: {
    plate: string;
    dimensions: {
      length: number;
      width: number;
      height: number;
      totalVolumeM3: number; // volumen total del vehículo en m³
    };
  };

  // Precios y cálculos
  totalPrice: number;
  usedVolumeM3: number; // volumen total ocupado por todos los paquetes
  availableVolumeM3: number; // volumen disponible restante

  // Fechas importantes
  scheduledDate: Date; // fecha programada para el flete
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;

  // Ruta sugerida (se calculará al asignar transportista)
  suggestedRoute?: ISuggestedRoute;

  // Metadatos
  createdAt: Date;
  updatedAt: Date;
}

export const Freight = model<IFreight>('Freight', freightSchema);
