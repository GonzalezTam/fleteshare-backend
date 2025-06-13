export type UserType = 'admin' | 'customer' | 'transporter';

export interface UserCreateRequest {
  username: string;
  password: string;
  role?: UserType;
}

export interface UserUpdateRequest {
  username?: string;
  password?: string;
  isActive?: boolean;
  role?: UserType;
}

export interface UserQuery {
  search?: string;
  page?: string | number;
  limit?: string | number;
}
