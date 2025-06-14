import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserType } from '@/types/user.types';

export interface IUser extends Document {
  username: string;
  password: string;
  role: UserType;
  firstName?: string;
  lastName?: string;
  phone?: string;
  licence?: File | null;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  isValidated: boolean;
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
    licence: { type: Schema.Types.Mixed, required: false },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
    isActive: { type: Boolean, default: true },
    isValidated: { type: Boolean, default: false },
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
