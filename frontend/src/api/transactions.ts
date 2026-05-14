import apiClient, { unwrapResponse } from './client';
import type { ApiResponse, Transaction, TransactionCreate } from '../types';

export async function getTransactions(holdingId: number): Promise<Transaction[]> {
  const { data } = await apiClient.get<ApiResponse<Transaction[]>>('/api/transactions', {
    params: { holding_id: holdingId },
  });
  return unwrapResponse(data);
}

export async function createTransaction(transaction: TransactionCreate): Promise<Transaction> {
  const { data } = await apiClient.post<ApiResponse<Transaction>>('/api/transactions', transaction);
  return unwrapResponse(data);
}

export async function deleteTransaction(id: number): Promise<null> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`/api/transactions/${id}`);
  return unwrapResponse(data);
}
