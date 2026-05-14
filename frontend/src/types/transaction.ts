export interface Transaction {
  id: number;
  holding_id: number | null;
  ticker: string;
  transaction_type: 'buy' | 'sell';
  quantity: number;
  price: number;
  fees: number;
  transaction_date: string;
  notes: string | null;
  created_at: string;
}

export interface TransactionCreate {
  ticker: string;
  transaction_type: 'buy' | 'sell';
  quantity: number;
  price: number;
  fees?: number;
  transaction_date: string;
  notes?: string;
}
