import { Request } from 'express';
import { UserType } from './user.types';

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  confirmPassword: string;
  role: UserType;
  phone: string;
  licence?: File | null;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    username: string;
    role: UserType;
    token: string;
  };
}

export interface RecoverPasswordRequest {
  username: string;
}

export interface RecoverPasswordResponse {
  message: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: {
    id: string;
    username: string;
    role: string;
    token: string;
  };
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: UserType;
  };
}
