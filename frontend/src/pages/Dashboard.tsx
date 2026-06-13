import { useDashboardSummary, useOptions } from '../hooks';
import {
  MetricsCards,
  PortfolioGrowthChart,
  MonthlyGainLossChart,
  SectorAllocationChart,
} from '../components/dashboard';
import { LoadingSpinner, ErrorNotification } from '../components/shared';
import { useState } from 'react';
import type { DashboardSummary } from '../types';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
}

function OptionsStats() {
  const { data: trades } = useOptions();

  const creditTypes = new Set(['sell_call', 'sell_put']);
  const debitTypes = new Set(['buy_call', 'buy_put']);

  const collected = (trades ?? []).reduce((acc: number, t: any) => {
    if (creditTypes.has(t.trade_type)) return acc + (t.premium || 0) * (t.contracts || 0) * 100;
    return acc;
  }, 0);

  const paid = (trades ?? []).reduce((acc: number, t: any) => {
    if (debitTypes.has(t.trade_type)) return acc + (t.premium || 0) * (t.contracts || 0) * 100;
    return acc;
  }, 0);

  const net = collected - paid;

  const realized = (trades ?? []).reduce((acc: number, t: any) => {
    if (t.status === 'closed' || t.status === 'expired_worthless') return acc + (t.pnl || 0);
    return acc;
  }, 0);

  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-xl p-4 bg-emerald-50 border border-emerald-100">
        <p className="text-sm font-medium text-emerald-700">Premium collected</p>
        <p className="mt-2 text-xl font-bold text-emerald-800">{formatCurrency(collected)}</p>
      </div>
      <div className="rounded-xl p-4 bg-red-50 border border-red-100">
        <p className="text-sm font-medium text-red-700">Premium paid</p>
        <p className="mt-2 text-xl font-bold text-red-800">-{formatCurrency(paid)}</p>
      </div>
      <div className={`rounded-xl p-4 ${net >= 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
        <p className="text-sm font-medium text-slate-500">Net premium</p>
        <p className={`mt-2 text-xl font-bold ${net >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>{formatCurrency(net)}</p>
      </div>
      <div className="rounded-xl p-4 bg-slate-50 border border-slate-100">
        <p className="text-sm font-medium text-slate-600">Realized P&L</p>
        <p className="mt-2 text-xl font-bold text-slate-800">{formatCurrency(realized)}</p>
      </div>
    </div>
  );
}

const emptySummary: DashboardSummary = {
  total_portfolio_value: 0,
  total_invested: 0,
  unrealized_gain: 0,
  etf_unrealized_gain: 0,
  realized_gain: 0,
  daily_change: 0,
  annual_dividend_income: 0,
  cash_position: 0,
  number_of_holdings: 0,
  stale_data: false,
  last_successful_fetch: null,
};

export default function Dashboard() {
  const { data, isLoading, isError, error } = useDashboardSummary();
  const [showError, setShowError] = useState(true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const summary: DashboardSummary = data ?? emptySummary;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your portfolio overview at a glance
        </p>
      </div>

      {isError && showError && (
        <ErrorNotification
          message={error instanceof Error ? error.message : 'Failed to load dashboard data'}
          onDismiss={() => setShowError(false)}
        />
      )}

      <MetricsCards data={summary} />

      {/* Options summary stat cards (premium collected/paid, net premium, realized P&L) */}
      <OptionsStats />

      <div className="mt-8 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <PortfolioGrowthChart />
        <SectorAllocationChart />
        <MonthlyGainLossChart />
      </div>
    </div>
  );
}
