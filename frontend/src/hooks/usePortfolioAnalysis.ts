import { useQuery } from '@tanstack/react-query';
import { getPortfolioAnalysis } from '../api/portfolioAnalysis';

export function usePortfolioAnalysis() {
  return useQuery({
    queryKey: ['portfolio', 'analysis'],
    queryFn: getPortfolioAnalysis,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
