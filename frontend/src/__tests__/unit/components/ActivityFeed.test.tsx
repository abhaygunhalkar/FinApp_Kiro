import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ActivityFeed from '../../../components/dashboard/ActivityFeed';
import type { ActivityEvent } from '../../../types';

// Mock the useActivity hook
const mockUseActivity = vi.fn();
vi.mock('../../../hooks/useDashboard', () => ({
  useActivity: () => mockUseActivity(),
}));

const mockEvents: ActivityEvent[] = [
  {
    event_type: 'holding_added',
    ticker: 'AAPL',
    details: { quantity: 10, buy_price: 150.0 },
    timestamp: new Date().toISOString(),
  },
  {
    event_type: 'stock_sold',
    ticker: 'TSLA',
    details: { quantity: 5, sell_price: 250.0, realized_gain: 125.5 },
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    event_type: 'watchlist_added',
    ticker: 'MSFT',
    details: {},
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    event_type: 'watchlist_removed',
    ticker: 'GOOG',
    details: {},
    timestamp: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    event_type: 'notes_updated',
    ticker: 'AMZN',
    details: {},
    timestamp: new Date(Date.now() - 604800000).toISOString(),
  },
];

describe('ActivityFeed', () => {
  it('renders loading state', () => {
    mockUseActivity.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<ActivityFeed />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseActivity.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<ActivityFeed />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Failed to load activity feed.')).toBeInTheDocument();
  });

  it('renders empty state when no events exist', () => {
    mockUseActivity.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<ActivityFeed />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('renders holding_added event correctly', () => {
    mockUseActivity.mockReturnValue({ data: [mockEvents[0]], isLoading: false, isError: false });
    render(<ActivityFeed />);

    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('Added 10 shares of AAPL at $150')).toBeInTheDocument();
  });

  it('renders stock_sold event correctly', () => {
    mockUseActivity.mockReturnValue({ data: [mockEvents[1]], isLoading: false, isError: false });
    render(<ActivityFeed />);

    expect(screen.getByText('TSLA')).toBeInTheDocument();
    expect(screen.getByText('Sold 5 shares of TSLA at $250 (gain: $125.5)')).toBeInTheDocument();
  });

  it('renders watchlist_added event correctly', () => {
    mockUseActivity.mockReturnValue({ data: [mockEvents[2]], isLoading: false, isError: false });
    render(<ActivityFeed />);

    expect(screen.getByText('MSFT')).toBeInTheDocument();
    expect(screen.getByText('Added MSFT to watchlist')).toBeInTheDocument();
  });

  it('renders watchlist_removed event correctly', () => {
    mockUseActivity.mockReturnValue({ data: [mockEvents[3]], isLoading: false, isError: false });
    render(<ActivityFeed />);

    expect(screen.getByText('GOOG')).toBeInTheDocument();
    expect(screen.getByText('Removed GOOG from watchlist')).toBeInTheDocument();
  });

  it('renders notes_updated event correctly', () => {
    mockUseActivity.mockReturnValue({ data: [mockEvents[4]], isLoading: false, isError: false });
    render(<ActivityFeed />);

    expect(screen.getByText('AMZN')).toBeInTheDocument();
    expect(screen.getByText('Updated notes for AMZN')).toBeInTheDocument();
  });

  it('renders all event types together', () => {
    mockUseActivity.mockReturnValue({ data: mockEvents, isLoading: false, isError: false });
    render(<ActivityFeed />);

    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('TSLA')).toBeInTheDocument();
    expect(screen.getByText('MSFT')).toBeInTheDocument();
    expect(screen.getByText('GOOG')).toBeInTheDocument();
    expect(screen.getByText('AMZN')).toBeInTheDocument();
  });

  it('limits display to 20 events', () => {
    const manyEvents: ActivityEvent[] = Array.from({ length: 25 }, (_, i) => ({
      event_type: 'holding_added' as const,
      ticker: `T${i}`,
      details: { quantity: 1, buy_price: 100 },
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
    }));

    mockUseActivity.mockReturnValue({ data: manyEvents, isLoading: false, isError: false });
    render(<ActivityFeed />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(20);
  });

  it('renders formatted timestamps', () => {
    mockUseActivity.mockReturnValue({ data: [mockEvents[0]], isLoading: false, isError: false });
    render(<ActivityFeed />);

    // The most recent event should show a relative time
    const timeElement = screen.getByRole('list').querySelector('time');
    expect(timeElement).toBeInTheDocument();
    expect(timeElement?.textContent).toBeTruthy();
  });

  it('renders a list with role="list"', () => {
    mockUseActivity.mockReturnValue({ data: mockEvents, isLoading: false, isError: false });
    render(<ActivityFeed />);

    expect(screen.getByRole('list')).toBeInTheDocument();
  });
});
