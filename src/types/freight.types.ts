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
