export type FreightStatus = 'requested' | 'taken' | 'started' | 'going' | 'finished' | 'canceled';

export interface IAddress {
  street: string;
  number: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
  neighborhood?: string;
}

export interface IPackageDimensions {
  length: number; // cm
  width: number; // cm
  height: number; // cm
  volumeM3: number; // calculado automáticamente
}

export interface IFreightParticipant {
  userId: string;
  pickupAddress: IAddress;
  deliveryAddress: IAddress;
  packageDimensions: IPackageDimensions;
  price: number;
  distance: number;
  joinedAt: Date;
}

export interface IVehicleDimensions {
  length: number;
  width: number;
  height: number;
  totalVolumeM3: number;
}

export interface IAssignedVehicle {
  plate: string;
  dimensions: IVehicleDimensions;
}

export interface IRoutePoint {
  participantIndex: number;
  address: IAddress;
  estimatedTime?: Date;
}

export interface ISuggestedRoute {
  pickupSequence: IRoutePoint[];
  deliverySequence: IRoutePoint[];
  totalDistance: number;
}

export interface IFreight {
  _id: string;
  createdBy: string;
  participants: IFreightParticipant[];
  transporterId?: string;
  status: FreightStatus;
  assignedVehicle?: IAssignedVehicle;
  totalPrice: number;
  usedVolumeM3: number;
  availableVolumeM3: number;
  scheduledDate: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  suggestedRoute?: ISuggestedRoute;
  createdAt: Date;
  updatedAt: Date;
}

// Requests para crear/actualizar fletes
export interface CreateFreightRequest {
  pickupAddress: IAddress;
  deliveryAddress: IAddress;
  packageDimensions: Omit<IPackageDimensions, 'volumeM3'>; // volumeM3 se calcula automáticamente
  scheduledDate: string; // ISO string
}

export interface JoinFreightRequest {
  freightId: string;
  pickupAddress: IAddress;
  deliveryAddress: IAddress;
  packageDimensions: Omit<IPackageDimensions, 'volumeM3'>;
}

export interface AssignTransporterRequest {
  freightId: string;
  transporterId: string;
}

export interface UpdateFreightStatusRequest {
  freightId: string;
  status: FreightStatus;
  cancellationReason?: string;
}

// Responses
export interface CreateFreightResponse {
  message: string;
  freight: IFreight;
}

export interface FreightListResponse {
  message: string;
  freights: IFreight[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FreightDetailResponse {
  message: string;
  freight: IFreight;
}

// Queries para filtrar fletes
export interface FreightQuery {
  status?: FreightStatus;
  transporterId?: string;
  createdBy?: string;
  scheduledDateFrom?: string;
  scheduledDateTo?: string;
  maxDistance?: number; // para buscar fletes cerca del transportista
  userLat?: number; // para calcular distancia
  userLng?: number; // para calcular distancia
  availableOnly?: boolean; // solo fletes que aceptan más participantes
  page?: number;
  limit?: number;
}

// Para cálculos de precios
export interface PriceCalculation {
  volumePrice: number;
  distancePrice: number;
  totalPrice: number;
  volumeM3: number;
  distanceKm: number;
}

// Para validaciones
export interface FreightValidation {
  canJoin: boolean;
  reasons: string[];
  availableVolumeM3?: number;
  maxParticipantsReached?: boolean;
  withinRange?: boolean;
  hasTransporter?: boolean;
}
