export interface TransactionItem {
  name: string;
  price: number;
}

export interface Transaction {
  id: string;
  businessId: string;
  clientId: string | null;
  amount: number;
  method: 'cash';
  items: TransactionItem[];
  status: string;
  createdAt: Date;
}
