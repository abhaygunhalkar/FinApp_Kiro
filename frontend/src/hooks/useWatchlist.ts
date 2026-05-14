import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWatchlist,
  createWatchlistItem,
  updateWatchlistItem,
  deleteWatchlistItem,
} from '../api';
import type { WatchlistCreate, WatchlistUpdate } from '../types';

export function useWatchlist() {
  return useQuery({
    queryKey: ['watchlist'],
    queryFn: getWatchlist,
  });
}

export function useCreateWatchlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: WatchlistCreate) => createWatchlistItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateWatchlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, item }: { id: number; item: WatchlistUpdate }) =>
      updateWatchlistItem(id, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}

export function useDeleteWatchlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteWatchlistItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
