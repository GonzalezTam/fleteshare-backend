import { IAddress } from './freight.types';

export type UserRole = 'admin' | 'customer' | 'transporter';
export type UserLicenseStatus = 'pending' | 'approved' | 'rejected';

export interface ITransporterVehicle {
  plate: string;
  dimensions: ITransporterVehicleDimensions;
}

export interface ITransporterVehicleDimensions {
  width: number;
  length: number;
  height: number;
}

export interface UserLicense {
  data: Buffer;
  contentType: string;
  filename: string;
}

export interface UserUpdateProfileBodyRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: IAddress;
  vehicle?: ITransporterVehicle;
  license?: UserLicense | null;
}

export interface UserQuery {
  search?: string;
  page?: string | number;
  limit?: string | number;
}
