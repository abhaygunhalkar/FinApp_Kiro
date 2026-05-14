import apiClient, { unwrapResponse } from './client';
import type { ApiResponse, Holding, HoldingCreate } from '../types';

export async function getHoldings(): Promise<Holding[]> {
  const { data } = await apiClient.get<ApiResponse<Holding[]>>('/api/holdings');
  return unwrapResponse(data);
}

export async function getHolding(id: number): Promise<Holding> {
  const { data } = await apiClient.get<ApiResponse<Holding>>(`/api/holdings/${id}`);
  return unwrapResponse(data);
}

export async function createHolding(holding: HoldingCreate): Promise<Holding> {
  const { data } = await apiClient.post<ApiResponse<Holding>>('/api/holdings', holding);
  return unwrapResponse(data);
}

export async function updateHolding(id: number, holding: Partial<HoldingCreate>): Promise<Holding> {
  const { data } = await apiClient.put<ApiResponse<Holding>>(`/api/holdings/${id}`, holding);
  return unwrapResponse(data);
}

export async function deleteHolding(id: number): Promise<null> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`/api/holdings/${id}`);
  return unwrapResponse(data);
}
