import bcrypt from 'bcryptjs';
import { model, Document } from 'mongoose';
import { userSchema } from './schemas/user.schema';
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
