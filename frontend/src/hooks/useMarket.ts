import { useQuery } from '@tanstack/react-query';
import { getQuote, getMarketHistory } from '../api';

export function useMarketQuote(ticker: string) {
  return useQuery({
    queryKey: ['market', 'quote', ticker],
    queryFn: () => getQuote(ticker),
    enabled: ticker.length > 0,
  });
}

export function useMarketHistory(ticker: string, period: string = '1mo') {
  return useQuery({
    queryKey: ['market', 'history', ticker, period],
    queryFn: () => getMarketHistory(ticker, period),
    enabled: ticker.length > 0,
  });
}
