import apiClient, { unwrapResponse } from './client';
import type { ApiResponse, MarketQuote, PricePoint } from '../types';

export async function getQuote(ticker: string): Promise<MarketQuote> {
  const { data } = await apiClient.get<ApiResponse<MarketQuote>>(`/api/market/quote/${ticker}`);
  return unwrapResponse(data);
}

export async function getHistory(ticker: string, period: string = '1mo'): Promise<PricePoint[]> {
  const { data } = await apiClient.get<ApiResponse<PricePoint[]>>(`/api/market/history/${ticker}`, {
    params: { period },
  });
  return unwrapResponse(data);
}
