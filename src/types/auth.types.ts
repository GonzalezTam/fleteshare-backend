import { Request } from 'express';
import { UserLicense, UserRole } from './user.types';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: UserRole;
  };
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  phone: string;
  license?: UserLicense | null;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    username: string;
    role: UserRole;
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
    role: UserRole;
  };
}
