import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WatchlistTable from './WatchlistTable';
import type { WatchlistItem } from '../../types';

function createWatchlistItem(
  overrides: Partial<WatchlistItem> = {}
): WatchlistItem {
  return {
    id: 1,
    ticker: 'AAPL',
    company_name: 'Apple Inc.',
    current_price: 175.5,
    daily_change_pct: 2.35,
    week_52_high: 199.62,
    week_52_low: 124.17,
    target_buy_price: 150.0,
    analyst_rating: 'Buy',
    pe_ratio: 28.5,
    market_cap: 2750000000000,
    sector: 'Technology',
    notes: 'Strong fundamentals',
    priority: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
    ...overrides,
  };
}

const mockItems: WatchlistItem[] = [
  createWatchlistItem({ id: 1, ticker: 'AAPL', priority: 1 }),
  createWatchlistItem({
    id: 2,
    ticker: 'MSFT',
    company_name: 'Microsoft Corp',
    current_price: 420.0,
    daily_change_pct: -1.5,
    market_cap: 3100000000000,
    priority: 2,
  }),
  createWatchlistItem({
    id: 3,
    ticker: 'TSLA',
    company_name: 'Tesla Inc.',
    current_price: 250.0,
    daily_change_pct: 0,
    market_cap: 800000000000,
    pe_ratio: null,
    target_buy_price: null,
    priority: 3,
  }),
];

describe('WatchlistTable', () => {
  it('renders all column headers', () => {
    render(<WatchlistTable items={mockItems} />);
    expect(screen.getByText('Ticker')).toBeInTheDocument();
    expect(screen.getByText('Company Name')).toBeInTheDocument();
    expect(screen.getByText('Current Price')).toBeInTheDocument();
    expect(screen.getByText('Daily Change %')).toBeInTheDocument();
    expect(screen.getByText('52 Week High')).toBeInTheDocument();
    expect(screen.getByText('52 Week Low')).toBeInTheDocument();
    expect(screen.getByText('Target Buy Price')).toBeInTheDocument();
    expect(screen.getByText('Analyst Rating')).toBeInTheDocument();
    expect(screen.getByText('PE Ratio')).toBeInTheDocument();
    expect(screen.getByText('Market Cap')).toBeInTheDocument();
    expect(screen.getByText('Sector')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Watch Priority')).toBeInTheDocument();
  });

  it('renders all watchlist item rows', () => {
    render(<WatchlistTable items={mockItems} />);
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('MSFT')).toBeInTheDocument();
    expect(screen.getByText('TSLA')).toBeInTheDocument();
  });

  it('displays priority as integer 1-5', () => {
    render(<WatchlistTable items={mockItems} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('color-codes positive daily change in green', () => {
    render(<WatchlistTable items={[createWatchlistItem({ daily_change_pct: 2.35 })]} />);
    const changeEl = screen.getByText('2.35%');
    expect(changeEl).toHaveClass('text-green-600');
  });

  it('color-codes negative daily change in red', () => {
    render(
      <WatchlistTable
        items={[createWatchlistItem({ id: 2, daily_change_pct: -1.5 })]}
      />
    );
    const changeEl = screen.getByText('-1.50%');
    expect(changeEl).toHaveClass('text-red-600');
  });

  it('formats market cap with B abbreviation for billions', () => {
    render(
      <WatchlistTable
        items={[createWatchlistItem({ market_cap: 2750000000000 })]}
      />
    );
    expect(screen.getByText('$2.75T')).toBeInTheDocument();
  });

  it('formats market cap with M abbreviation for millions', () => {
    render(
      <WatchlistTable
        items={[createWatchlistItem({ id: 4, market_cap: 500000000 })]}
      />
    );
    expect(screen.getByText('$500.00M')).toBeInTheDocument();
  });

  it('shows dash for null values', () => {
    render(
      <WatchlistTable
        items={[
          createWatchlistItem({
            id: 5,
            target_buy_price: null,
            pe_ratio: null,
            market_cap: null,
          }),
        ]}
      />
    );
    // Should show dashes for null fields
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it('renders empty table body when items array is empty', () => {
    render(<WatchlistTable items={[]} />);
    // Headers should still be present
    expect(screen.getByText('Ticker')).toBeInTheDocument();
    // No data rows
    expect(screen.queryByText('AAPL')).not.toBeInTheDocument();
  });
});
