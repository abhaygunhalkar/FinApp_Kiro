export interface WatchlistItem {
  id: number;
  ticker: string;
  company_name: string | null;
  current_price: number;
  daily_change_pct: number;
  week_52_high: number;
  week_52_low: number;
  target_buy_price: number | null;
  analyst_rating: string | null;
  pe_ratio: number | null;
  market_cap: number | null;
  sector: string | null;
  notes: string | null;
  priority: number;
  rsi_daily: number | null;
  rsi_weekly: number | null;
  created_at: string;
  updated_at: string;
}

export interface WatchlistCreate {
  ticker: string;
  target_buy_price?: number;
  priority?: number;
  notes?: string;
}

export interface WatchlistUpdate {
  target_buy_price?: number;
  priority?: number;
  sector?: string;
  notes?: string;
}
