import apiClient, { unwrapResponse } from './client';
import type { ApiResponse } from '../types';

export interface PortfolioInsight {
  rule_id: string;
  category: string;
  severity: 'info' | 'warning' | 'alert';
  title: string;
  message: string;
}

export async function getPortfolioAnalysis(): Promise<PortfolioInsight[]> {
  const { data } = await apiClient.get<ApiResponse<PortfolioInsight[]>>('/api/portfolio/analysis');
  return unwrapResponse(data);
}
