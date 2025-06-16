import { Schema } from 'mongoose';

export const addressSchema = new Schema(
  {
    street: { type: String, required: true },
    number: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: false },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    formattedAddress: { type: String, required: true },
    neighborhood: { type: String, required: false },
  },
  { _id: false }
);
