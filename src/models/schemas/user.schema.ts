import { Schema } from 'mongoose';
import { addressSchema } from './address.schema';
import { vehicleSchema } from './vehicle.schema';
import { IUser } from '../User.model';

export const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'customer', 'transporter'] },
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    phone: { type: String, required: false },
    address: { type: addressSchema, required: false },
    vehicle: { type: vehicleSchema, required: false },
    licenseUrl: { type: String, required: false },
    licenseStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      required: false,
    },
    isProfileCompleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);
