import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHoldings, getHolding, createHolding, updateHolding, deleteHolding } from '../api';
import type { HoldingCreate } from '../types';

export function useHoldings() {
  return useQuery({
    queryKey: ['holdings'],
    queryFn: getHoldings,
  });
}

export function useHolding(id: number) {
  return useQuery({
    queryKey: ['holdings', id],
    queryFn: () => getHolding(id),
    enabled: id > 0,
  });
}

export function useCreateHolding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (holding: HoldingCreate) => createHolding(holding),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateHolding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, holding }: { id: number; holding: Partial<HoldingCreate> }) =>
      updateHolding(id, holding),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteHolding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteHolding(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
