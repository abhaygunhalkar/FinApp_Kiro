import { useState } from 'react';
import { useHoldings } from '../hooks/useHoldings';
import { HoldingsTable, SearchFilter, HoldingForm } from '../components/holdings';
import { LoadingSpinner, EmptyState } from '../components/shared';
import apiClient from '../api/client';
import { useQueryClient } from '@tanstack/react-query';

export default function Holdings() {
  const { data: holdings, isLoading, isError } = useHoldings();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefreshPrices = async () => {
    setIsRefreshing(true);
    try {
      await apiClient.post('/api/market/refresh');
      // Invalidate holdings query to re-fetch with updated prices
      await queryClient.invalidateQueries({ queryKey: ['holdings'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch {
      // Silently fail — prices will update on next scheduled refresh
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <p className="text-red-600 dark:text-red-400">
          Failed to load holdings. Please try again.
        </p>
      </div>
    );
  }

  const holdingsList = holdings ?? [];

  if (holdingsList.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Holdings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Manage your stock portfolio
        </p>
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          title="No holdings yet"
          description="Add your first stock holding to start tracking your portfolio."
          actionLabel="Add Holding"
          onAction={() => setShowAddForm(true)}
        />

        {showAddForm && <HoldingForm onClose={() => setShowAddForm(false)} />}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Holdings
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your stock portfolio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshPrices}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Fetch latest prices from market"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh Prices'}
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Holding
          </button>
        </div>
      </div>
      <SearchFilter holdings={holdingsList} />
      <HoldingsTable holdings={holdingsList} />

      {showAddForm && <HoldingForm onClose={() => setShowAddForm(false)} />}
    </div>
  );
}
