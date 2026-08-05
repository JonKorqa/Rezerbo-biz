export type BillingPeriod = 'weekly' | 'monthly' | 'yearly';

export interface Membership {
  id: string;
  name: string;
  description?: string;
  price: number;
  billingPeriod: BillingPeriod;
  includedServiceIds: string[];
  active: boolean;
}
