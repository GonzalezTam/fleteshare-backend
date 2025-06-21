import { Schema } from 'mongoose';
import { IFreightParticipant } from '../freight.model';
import { addressSchema } from './address.schema';

export const participantSchema = new Schema<IFreightParticipant>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pickupAddress: {
      type: addressSchema,
      required: true,
    },
    deliveryAddress: {
      type: addressSchema,
      required: true,
    },
    packageDimensions: {
      length: { type: Number, required: true, min: 1 }, // cm
      width: { type: Number, required: true, min: 1 }, // cm
      height: { type: Number, required: true, min: 1 }, // cm
      volumeM3: { type: Number, required: true, min: 0.001 }, // m³
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    distance: {
      type: Number,
      required: true,
      min: 0,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);
