import apiClient, { unwrapResponse } from './client';
import type { ApiResponse } from '../types';

export interface OptionPayload {
  ticker: string;
  trade_type: 'sell_put' | 'sell_call' | 'buy_call' | 'buy_put';
  strike_price: number;
  premium: number;
  contracts: number;
  open_date: string;
  expiry_date: string;
  status: 'open' | 'closed' | 'expired_worthless' | 'assigned';
  close_price?: number | null;
  notes?: string | null;
}

export async function getOptions() {
  const { data } = await apiClient.get<ApiResponse<any[]>>('/api/options');
  return unwrapResponse(data);
}

export async function getOption(id: number) {
  const { data } = await apiClient.get<ApiResponse<any>>(`/api/options/${id}`);
  return unwrapResponse(data);
}

export async function createOption(payload: OptionPayload) {
  const { data } = await apiClient.post<ApiResponse<any>>('/api/options', payload);
  return unwrapResponse(data);
}

export async function updateOption(id: number, payload: OptionPayload) {
  const { data } = await apiClient.put<ApiResponse<any>>(`/api/options/${id}`, payload);
  return unwrapResponse(data);
}

export async function deleteOption(id: number) {
  const { data } = await apiClient.delete<ApiResponse<null>>(`/api/options/${id}`);
  return unwrapResponse(data);
}

export async function getOptionsSummary() {
  const { data } = await apiClient.get<ApiResponse<any>>('/api/options/summary');
  return unwrapResponse(data);
}
