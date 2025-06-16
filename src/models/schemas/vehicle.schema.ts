import { Schema } from 'mongoose';

// Esquema para las dimensiones del vehículo
const vehicleDimensionsSchema = new Schema(
  {
    length: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { _id: false }
);

// Esquema para el vehículo
export const vehicleSchema = new Schema(
  {
    plate: { type: String, required: true },
    dimensions: { type: vehicleDimensionsSchema, required: true },
  },
  { _id: false }
);
