export interface MarketQuote {
  ticker: string;
  current_price: number;
  previous_close: number;
  daily_change: number;
  daily_change_pct: number;
  week_52_high: number;
  week_52_low: number;
  market_cap: number | null;
  pe_ratio: number | null;
  dividend_yield: number;
  analyst_rating: string | null;
}

export interface PricePoint {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}
