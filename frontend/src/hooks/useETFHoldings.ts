import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getETFHoldings, createETFHolding } from '../api/etfHoldings';
import type { HoldingCreate } from '../types';

export function useETFHoldings() {
  return useQuery({
    queryKey: ['etf-holdings'],
    queryFn: getETFHoldings,
  });
}

export function useCreateETFHolding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (holding: HoldingCreate) => createETFHolding(holding),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etf-holdings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
