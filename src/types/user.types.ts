export type UserType = 'admin' | 'customer' | 'transporter';

export interface UserUpdateProfileBodyRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  licence?: File | null;
  latitude?: number;
  longitude?: number;
  password?: string;
  confirmPassword?: string;
}

export interface UserQuery {
  search?: string;
  page?: string | number;
  limit?: string | number;
}
