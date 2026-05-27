import apiClient, { unwrapResponse } from './client';
import type { ApiResponse, Holding, HoldingCreate } from '../types';

export async function getETFHoldings(): Promise<Holding[]> {
  const { data } = await apiClient.get<ApiResponse<Holding[]>>('/api/etf-holdings');
  return unwrapResponse(data);
}

export async function createETFHolding(holding: HoldingCreate): Promise<Holding> {
  const { data } = await apiClient.post<ApiResponse<Holding>>('/api/etf-holdings', holding);
  return unwrapResponse(data);
}
