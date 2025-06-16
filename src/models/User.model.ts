import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { addressSchema } from './schemas/address.schema';
import { vehicleSchema } from './schemas/vehicle.schema';
import { UserLicenseStatus, UserRole } from '@/types/user.types';
import { IAddress } from '@/types/freight.types';

export interface IUser extends Document {
  username: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: IAddress;
  vehicle?: {
    plate: string;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
  };
  licenseUrl?: string;
  licenseStatus?: UserLicenseStatus;
  isProfileCompleted: boolean;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
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

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

userSchema.index({ username: 1, isActive: 1 });

export const User = model<IUser>('User', userSchema);
