import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserType } from '@/types/user.types';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  role: UserType;
  phone?: string;
  licence?: File | null;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'customer', 'transporter'] },
    phone: { type: String, required: false },
    licence: { type: Schema.Types.Mixed, required: false }, // File type can be handled as Mixed
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
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
