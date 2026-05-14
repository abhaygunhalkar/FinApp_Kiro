import apiClient, { unwrapResponse } from './client';
import type { ApiResponse, WatchlistItem, WatchlistCreate, WatchlistUpdate } from '../types';

export async function getWatchlist(): Promise<WatchlistItem[]> {
  const { data } = await apiClient.get<ApiResponse<WatchlistItem[]>>('/api/watchlist');
  return unwrapResponse(data);
}

export async function createWatchlistItem(item: WatchlistCreate): Promise<WatchlistItem> {
  const { data } = await apiClient.post<ApiResponse<WatchlistItem>>('/api/watchlist', item);
  return unwrapResponse(data);
}

export async function updateWatchlistItem(
  id: number,
  item: WatchlistUpdate,
): Promise<WatchlistItem> {
  const { data } = await apiClient.put<ApiResponse<WatchlistItem>>(`/api/watchlist/${id}`, item);
  return unwrapResponse(data);
}

export async function deleteWatchlistItem(id: number): Promise<null> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`/api/watchlist/${id}`);
  return unwrapResponse(data);
}
