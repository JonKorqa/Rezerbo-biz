export interface ServicePackage {
  id: string;
  name: string;
  description?: string;
  includedServiceIds: string[];
  price: number;
  active: boolean;
}
