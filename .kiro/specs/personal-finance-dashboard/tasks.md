# Implementation Plan: Personal Finance Dashboard

## Overview

This plan implements a locally hosted personal finance and stock tracking application with a React/TypeScript frontend (Vite, TailwindCSS, Recharts, TanStack Query, Zustand) and a FastAPI/Python backend (SQLAlchemy, Pydantic, Alembic, APScheduler, yfinance). The implementation proceeds from project scaffolding through backend data layer, API layer, frontend structure, feature pages, and finally integration wiring.

## Tasks

- [ ] 1. Project scaffolding and configuration
  - [x] 1.1 Initialize backend project structure
    - Create `backend/` directory with `app/` package containing `__init__.py`, `main.py`, `config.py`, `database.py`
    - Create subdirectories: `app/models/`, `app/schemas/`, `app/routers/`, `app/services/`, `app/repositories/`
    - Create `pyproject.toml` with dependencies: fastapi, uvicorn, sqlalchemy, pydantic, alembic, apscheduler, yfinance, python-dotenv
    - Configure Black, Ruff, and mypy (strict mode) in `pyproject.toml`
    - Create `.env.example` with DATABASE_URL, MARKET_API_PROVIDER, REFRESH_INTERVAL_MINUTES
    - _Requirements: 10.1, 10.2, 10.3, 12.5, 15.3, 15.4_

  - [x] 1.2 Initialize frontend project structure
    - Create Vite React TypeScript project in `frontend/` directory
    - Install dependencies: tailwindcss, @tanstack/react-query, zustand, react-router-dom, recharts, axios
    - Configure `tsconfig.json` with strict mode: noImplicitAny, strictNullChecks, strictFunctionTypes, noUnusedLocals
    - Configure ESLint and Prettier with project root config files
    - Configure TailwindCSS with dark mode support (class strategy)
    - _Requirements: 13.6, 15.1, 15.2_

  - [x] 1.3 Set up backend testing infrastructure
    - Install test dependencies: pytest, pytest-cov, pytest-asyncio, hypothesis, httpx (for TestClient)
    - Create `backend/tests/` directory structure: `unit/`, `property/`, `integration/`
    - Create `backend/tests/conftest.py` with in-memory SQLite test database fixture and session management
    - Configure pytest in `pyproject.toml` with coverage settings (minimum 70%)
    - _Requirements: 15.6_

  - [x] 1.4 Set up frontend testing infrastructure
    - Install test dependencies: vitest, @testing-library/react, @testing-library/jest-dom, fast-check, msw, @vitest/coverage-v8
    - Create `frontend/src/__tests__/` directory structure: `unit/components/`, `unit/hooks/`, `property/`
    - Create `frontend/src/__tests__/setup.ts` with test environment configuration
    - Configure Vitest in `vite.config.ts` with coverage settings (minimum 70%)
    - _Requirements: 15.5_

- [ ] 2. Backend data layer (models, schemas, database)
  - [ ] 2.1 Create SQLAlchemy models
    - Implement `backend/app/models/holding.py` with Holding model (all columns per design ER diagram)
    - Implement `backend/app/models/transaction.py` with Transaction model and FK to holdings
    - Implement `backend/app/models/watchlist_item.py` with WatchlistItem model
    - Implement `backend/app/models/price_history.py` with PriceHistory model and unique constraint on (ticker, date)
    - Implement `backend/app/models/cash_balance.py` with CashBalance model
    - Create `backend/app/models/__init__.py` exporting all models
    - _Requirements: 10.1, 10.2_

  - [ ] 2.2 Create Pydantic schemas
    - Implement `backend/app/schemas/holding.py` with HoldingCreate, HoldingUpdate, HoldingResponse
    - Implement `backend/app/schemas/transaction.py` with TransactionCreate, TransactionResponse
    - Implement `backend/app/schemas/watchlist.py` with WatchlistCreate, WatchlistUpdate, WatchlistResponse
    - Implement `backend/app/schemas/dashboard.py` with DashboardSummary, ActivityEvent, PortfolioSnapshot
    - Implement `backend/app/schemas/market.py` with MarketQuote, PricePoint
    - Implement `backend/app/schemas/common.py` with ApiResponse generic envelope
    - _Requirements: 11.6, 11.7_

  - [ ] 2.3 Set up database configuration and Alembic migrations
    - Implement `backend/app/database.py` with engine creation, session factory, and get_db dependency
    - Initialize Alembic with `alembic init` and configure `alembic.ini` and `env.py`
    - Create initial migration for all 5 tables (holdings, transactions, watchlist, price_history, cash_balance)
    - Implement startup check: verify DB file exists or create with tables; exit on corruption
    - _Requirements: 10.3, 10.4, 10.5, 10.6_

  - [ ] 2.4 Implement repository layer
    - Implement `backend/app/repositories/holdings_repository.py` with CRUD operations
    - Implement `backend/app/repositories/transaction_repository.py` with CRUD and ordered queries
    - Implement `backend/app/repositories/watchlist_repository.py` with CRUD operations
    - Implement `backend/app/repositories/price_history_repository.py` with history queries and cleanup
    - Implement `backend/app/repositories/cash_balance_repository.py` with balance read/update
    - _Requirements: 10.2, 10.7_

  - [ ] 2.5 Write property tests for data validation schemas
    - **Property 6: Reject invalid holding inputs** — verify quantity <= 0 or buy_price < 0.01 always rejected
    - **Property 12: Watchlist input validation** — verify ticker pattern, target_buy_price range, priority range, notes length
    - **Validates: Requirements 3.6, 5.2**

- [ ] 3. Backend service layer
  - [ ] 3.1 Implement holdings service
    - Create `backend/app/services/holdings_service.py` with get_all, get_by_id, create, update, delete
    - Implement portfolio metrics calculation: unrealized_gain, unrealized_gain_pct, allocation_pct, annual_dividend_income
    - On create: also create initial buy transaction and update cash balance
    - On delete: cascade delete transactions and update cash balance
    - _Requirements: 1.2, 1.3, 1.4, 1.7, 3.1, 3.2, 3.3, 3.5_

  - [ ] 3.2 Implement transaction service
    - Create `backend/app/services/transaction_service.py` with get_by_holding, create, delete
    - Implement buy logic: weighted average recalculation, quantity increase, cash balance decrease
    - Implement sell logic: realized gain calculation, quantity decrease, cash balance increase, reject if sell > quantity
    - Implement delete logic: replay remaining transactions to recalculate holding; remove holding if last transaction deleted
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ] 3.3 Implement watchlist service
    - Create `backend/app/services/watchlist_service.py` with get_all, create, update, delete, move_to_holdings
    - Validate duplicate ticker on create
    - Implement move_to_holdings: create holding from watchlist item, delete watchlist item
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ] 3.4 Implement dashboard service
    - Create `backend/app/services/dashboard_service.py` with get_summary, get_activity_feed, get_portfolio_history
    - Calculate aggregate metrics: total_portfolio_value, total_invested, daily_change, cash_position
    - Build activity feed from holdings, transactions, and watchlist events ordered by timestamp descending, limited to 20
    - Build portfolio history from price_history data for configurable day ranges
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ] 3.5 Implement market data service
    - Create `backend/app/services/market_data_service.py` with fetch_quote, fetch_history, refresh_all_prices
    - Implement retry logic: 3 attempts with 5-second delay
    - Validate fetched data: skip if currentPrice missing or non-numeric
    - Store fetched prices in price_history; delete records older than 365 days
    - Update current_price on holdings and watchlist items after successful fetch
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 14.4_

  - [ ] 3.6 Write property tests for metrics calculations
    - **Property 1: Per-holding metrics calculation** — verify unrealized_gain, unrealized_gain_pct, allocation_pct, annual_dividend_income formulas
    - **Property 13: Portfolio aggregate metrics** — verify total_portfolio_value, total_invested, daily_change sums
    - **Property 14: Cash position tracking** — verify cash balance after sequences of buys and sells
    - **Property 15: Top gainers and losers selection** — verify correct top-5 selection by unrealized_gain_pct
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.7, 6.2, 6.3, 6.4, 6.6, 7.3**

  - [ ] 3.7 Write property tests for transaction logic
    - **Property 7: Buy transaction weighted average** — verify weighted average formula after buy
    - **Property 8: Sell transaction realized gain** — verify realized gain and quantity decrease
    - **Property 10: Transaction deletion recalculates holding** — verify replay produces correct state
    - **Property 11: Reject sell exceeding quantity** — verify 422 rejection without DB modification
    - **Validates: Requirements 4.1, 4.2, 4.4, 4.5**

- [ ] 4. Checkpoint - Backend services complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Backend API layer (routers and error handling)
  - [ ] 5.1 Implement FastAPI application setup and error handling
    - Create `backend/app/main.py` with FastAPI app, CORS middleware (allow localhost:3000), lifespan events
    - Implement global exception handler returning envelope format without internal details
    - Implement RequestValidationError handler with field-level error messages
    - Configure APScheduler for background market data refresh on startup
    - Read REFRESH_INTERVAL_MINUTES from environment (default 15, range 1-1440)
    - Bind to localhost only (127.0.0.1)
    - _Requirements: 11.7, 11.8, 12.4, 12.5, 14.1, 14.2, 14.5_

  - [ ] 5.2 Implement holdings router
    - Create `backend/app/routers/holdings.py` with GET /api/holdings, GET /api/holdings/{id}, POST /api/holdings, PUT /api/holdings/{id}, DELETE /api/holdings/{id}
    - Return 201 on create, 200 on get/update, 404 on not found, 422 on validation error
    - Wrap responses in ApiResponse envelope
    - _Requirements: 11.1, 11.8, 11.9, 3.5, 3.7, 3.8_

  - [ ] 5.3 Implement transactions router
    - Create `backend/app/routers/transactions.py` with GET /api/transactions?holding_id={id}, POST /api/transactions, DELETE /api/transactions/{id}
    - Return 201 on create, 200 on get, 422 on sell exceeding quantity
    - _Requirements: 11.2, 11.8_

  - [ ] 5.4 Implement watchlist router
    - Create `backend/app/routers/watchlist.py` with GET /api/watchlist, POST /api/watchlist, PUT /api/watchlist/{id}, DELETE /api/watchlist/{id}
    - Return 201 on create, 200 on get/update, 404 on not found, 422 on duplicate/validation
    - _Requirements: 11.3, 11.8, 11.9_

  - [ ] 5.5 Implement dashboard router
    - Create `backend/app/routers/dashboard.py` with GET /api/dashboard/summary, GET /api/dashboard/activity, GET /api/dashboard/history?days={n}
    - Include stale_data indicator and last_successful_fetch in summary response
    - _Requirements: 11.4, 6.8_

  - [ ] 5.6 Implement market router
    - Create `backend/app/routers/market.py` with GET /api/market/quote/{ticker}, GET /api/market/history/{ticker}?period={p}
    - _Requirements: 11.5_

  - [ ] 5.7 Write property tests for API contracts and error handling
    - **Property 19: API response contract** — verify envelope format for all success/error responses
    - **Property 20: Error responses hide internals** — verify 500 responses never contain stack traces, file paths, or query strings
    - **Validates: Requirements 11.6, 11.7, 14.1, 14.2**

  - [ ] 5.8 Write property tests for data integrity
    - **Property 18: Database transaction rollback** — verify failed writes leave DB unchanged
    - **Validates: Requirements 10.7, 14.5**

- [ ] 6. Checkpoint - Backend API complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Frontend foundation (API client, types, store, routing)
  - [ ] 7.1 Create TypeScript type definitions
    - Create `frontend/src/types/holding.ts` with Holding, HoldingCreate interfaces
    - Create `frontend/src/types/transaction.ts` with Transaction, TransactionCreate interfaces
    - Create `frontend/src/types/watchlist.ts` with WatchlistItem, WatchlistCreate, WatchlistUpdate interfaces
    - Create `frontend/src/types/dashboard.ts` with DashboardSummary, ActivityEvent, PortfolioSnapshot interfaces
    - Create `frontend/src/types/market.ts` with MarketQuote, PricePoint interfaces
    - Create `frontend/src/types/api.ts` with ApiResponse<T> generic envelope interface
    - _Requirements: 15.1_

  - [ ] 7.2 Implement API client layer
    - Create `frontend/src/api/client.ts` with Axios instance (baseURL: http://localhost:8000, timeout: 10000ms)
    - Create `frontend/src/api/holdings.ts` with getHoldings, getHolding, createHolding, updateHolding, deleteHolding
    - Create `frontend/src/api/transactions.ts` with getTransactions, createTransaction, deleteTransaction
    - Create `frontend/src/api/watchlist.ts` with getWatchlist, createWatchlistItem, updateWatchlistItem, deleteWatchlistItem
    - Create `frontend/src/api/dashboard.ts` with getSummary, getActivity, getHistory
    - Create `frontend/src/api/market.ts` with getQuote, getHistory
    - _Requirements: 14.3_

  - [ ] 7.3 Implement TanStack Query hooks
    - Create `frontend/src/hooks/useHoldings.ts` with useHoldings, useHolding, useCreateHolding, useUpdateHolding, useDeleteHolding
    - Create `frontend/src/hooks/useTransactions.ts` with useTransactions, useCreateTransaction, useDeleteTransaction
    - Create `frontend/src/hooks/useWatchlist.ts` with useWatchlist, useCreateWatchlistItem, useUpdateWatchlistItem, useDeleteWatchlistItem
    - Create `frontend/src/hooks/useDashboard.ts` with useDashboardSummary, useActivity, usePortfolioHistory
    - Create `frontend/src/hooks/useMarket.ts` with useMarketQuote, useMarketHistory
    - Configure QueryClient with retry: 3, exponential backoff, staleTime: 30000ms
    - _Requirements: 14.3_

  - [ ] 7.4 Implement Zustand UI store
    - Create `frontend/src/store/uiStore.ts` with theme, sidebarCollapsed, holdingsFilter state
    - Implement theme persistence to localStorage on change
    - Implement setTheme, toggleSidebar, setHoldingsFilter actions
    - Read initial theme from localStorage on store creation (default: 'light')
    - _Requirements: 13.2, 13.3_

  - [ ] 7.5 Set up React Router and app layout
    - Create `frontend/src/App.tsx` with QueryClientProvider, RouterProvider
    - Create route definitions: / (Dashboard), /holdings (Holdings), /watchlist (Watchlist), /settings (Settings)
    - Create `frontend/src/components/layout/AppLayout.tsx` with sidebar and main content area
    - Create `frontend/src/components/layout/Sidebar.tsx` with navigation links
    - Create `frontend/src/components/layout/ThemeToggle.tsx` for dark/light mode switching
    - Apply TailwindCSS dark mode class to root element based on store theme
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ] 7.6 Write property test for theme persistence
    - **Property 21: Theme persistence round trip** — verify setting theme persists to localStorage and reads back correctly
    - **Validates: Requirements 13.3**

- [ ] 8. Frontend shared components
  - [ ] 8.1 Create shared UI components
    - Create `frontend/src/components/shared/EmptyState.tsx` with icon, title, description, and optional action button
    - Create `frontend/src/components/shared/ErrorNotification.tsx` as toast/notification with dismiss and auto-dismiss
    - Create `frontend/src/components/shared/LoadingSpinner.tsx` with size variants
    - Create `frontend/src/components/shared/DataTable.tsx` with sortable columns, configurable rows, and responsive layout
    - Create `frontend/src/components/shared/DeleteConfirmation.tsx` as confirmation dialog
    - Ensure minimum font size 14px, row height 40px, cell padding 8px for table components
    - _Requirements: 13.5, 1.6, 2.5, 5.8, 6.7, 7.6, 8.7_

- [ ] 9. Frontend Holdings page
  - [ ] 9.1 Implement Holdings page with table and filters
    - Create `frontend/src/pages/Holdings.tsx` as the main page component
    - Create `frontend/src/components/holdings/HoldingsTable.tsx` displaying all columns per requirement 1.1
    - Create `frontend/src/components/holdings/HoldingRow.tsx` with expandable row showing transaction history
    - Create `frontend/src/components/holdings/SearchFilter.tsx` with search input, sector dropdown, performance filter
    - Implement client-side search filtering (case-insensitive partial match on ticker/company_name)
    - Implement client-side sorting by any column with correct default directions
    - Implement sector filter (dynamically populated) and performance filter (gainers/losers/all)
    - Show empty state when no holdings exist or no holdings match filters
    - _Requirements: 1.1, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 9.2 Implement Holdings CRUD forms
    - Create `frontend/src/components/holdings/HoldingForm.tsx` as modal form for add/edit
    - Implement form validation: required fields (ticker, quantity, buy_price), quantity > 0, buy_price >= 0.01
    - Display field-level validation errors from both frontend validation and backend 422 responses
    - On successful create/edit, invalidate holdings query cache and close modal
    - Create `frontend/src/components/holdings/DeleteConfirmation.tsx` for delete confirmation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

  - [ ] 9.3 Implement transaction history and management
    - Create `frontend/src/components/holdings/TransactionHistory.tsx` showing transactions in expanded row
    - Display transaction_type, quantity, price, fees, transaction_date, notes for each transaction
    - Add "Record Transaction" button opening transaction form (buy/sell)
    - Implement transaction form with type selector, quantity, price, fees, date fields
    - Implement transaction deletion with holding recalculation
    - _Requirements: 1.5, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 9.4 Write property tests for holdings filter and sort (frontend)
    - **Property 2: Holdings search filter** — verify filtered results match case-insensitive substring on ticker/company_name
    - **Property 3: Holdings sort correctness** — verify adjacent pairs respect sort direction
    - **Property 4: Holdings predicate filter** — verify sector and performance filters produce correct subsets
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [ ] 10. Checkpoint - Holdings feature complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Frontend Watchlist page
  - [ ] 11.1 Implement Watchlist page with table
    - Create `frontend/src/pages/Watchlist.tsx` as the main page component
    - Create `frontend/src/components/watchlist/WatchlistTable.tsx` displaying all columns per requirement 5.1
    - Show priority as integer 1-5, daily change %, 52-week high/low, analyst rating, PE ratio, market cap
    - Show empty state when no watchlist items exist
    - _Requirements: 5.1_

  - [ ] 11.2 Implement Watchlist CRUD and move-to-holdings
    - Create `frontend/src/components/watchlist/WatchlistForm.tsx` for add/edit with validation
    - Validate ticker format (1-5 uppercase), target_buy_price range, priority range, notes length
    - Display field-level validation errors
    - Create `frontend/src/components/watchlist/MoveToHoldings.tsx` flow: pre-populate holding form with ticker, on success remove from watchlist
    - Handle move-to-holdings failure: show error, retain watchlist item
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [ ] 12. Frontend Dashboard page
  - [ ] 12.1 Implement Dashboard metrics cards
    - Create `frontend/src/pages/Dashboard.tsx` as the main page component
    - Create `frontend/src/components/dashboard/MetricsCards.tsx` displaying all summary metrics
    - Show: Total Portfolio Value, Total Invested, Unrealized Gain/Loss, Realized Gain/Loss, Daily Change, Annual Dividend Income, Cash Position, Number of Holdings
    - Show stale data indicator when stale_data is true in response
    - Show empty state (all zeros) when no holdings exist
    - _Requirements: 6.1, 6.7, 6.8, 12.2_

  - [ ] 12.2 Implement Dashboard charts
    - Create `frontend/src/components/dashboard/PortfolioGrowthChart.tsx` — line chart with 7d/30d/90d/1y range selector
    - Create `frontend/src/components/dashboard/SectorAllocationChart.tsx` — pie chart of sector percentages
    - Create `frontend/src/components/dashboard/GainersLosersChart.tsx` — bar chart of top 5 gainers and losers
    - Create `frontend/src/components/dashboard/DividendForecastChart.tsx` — bar/line chart of projected monthly dividends
    - Create `frontend/src/components/dashboard/WatchlistMoversChart.tsx` — display items with |daily_change_pct| >= 2%
    - Show empty state message for each chart when no data available
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 12.3 Implement Activity Feed
    - Create `frontend/src/components/dashboard/ActivityFeed.tsx` displaying up to 20 recent events
    - Render event types: holding_added, stock_sold, watchlist_added, watchlist_removed, notes_updated
    - Show ticker, relevant details, and formatted timestamp for each event
    - Show empty state when no activity events exist
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ] 12.4 Write property tests for dashboard logic (frontend)
    - **Property 16: Watchlist movers filter** — verify movers list contains exactly items with |daily_change_pct| >= 2%
    - **Property 17: Activity feed ordering and limit** — verify max 20 events in descending timestamp order
    - **Validates: Requirements 7.5, 8.1, 8.6**

- [ ] 13. Frontend Settings page
  - [ ] 13.1 Implement Settings page
    - Create `frontend/src/pages/Settings.tsx` with theme toggle (dark/light) and refresh interval display
    - Wire theme toggle to Zustand store and localStorage persistence
    - Display current refresh interval from backend config
    - _Requirements: 13.2, 13.3_

- [ ] 14. Checkpoint - All frontend pages complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Backend filter, sort, and activity feed logic
  - [ ] 15.1 Write property tests for filter/sort and activity feed (backend)
    - **Property 9: Transaction history ordering** — verify descending date order for transaction lists
    - **Property 5: Create holding produces consistent records** — verify holding + transaction created with matching data
    - **Validates: Requirements 4.3, 3.1, 3.5**

- [ ] 16. Integration wiring and final polish
  - [ ] 16.1 Wire frontend to backend with CORS and environment config
    - Verify CORS middleware allows requests from localhost:3000
    - Create `frontend/.env` with VITE_API_BASE_URL=http://localhost:8000
    - Ensure API client reads base URL from environment variable
    - Verify all API endpoints are correctly wired end-to-end
    - _Requirements: 12.4, 12.5_

  - [ ] 16.2 Implement responsive layout and accessibility
    - Ensure sidebar collapses to toggleable menu below 1024px viewport
    - Verify no horizontal scrolling from 768px to 1920px viewport width
    - Ensure table cells meet minimum font size (14px), row height (40px), padding (8px)
    - Apply dark mode class toggling to document root element
    - _Requirements: 13.4, 13.5_

  - [ ] 16.3 Add lint/check scripts
    - Add `backend` script in pyproject.toml: runs Black check, Ruff check, and mypy in one command
    - Add `frontend` script in package.json: runs ESLint, Prettier check, and TypeScript compiler check in one command
    - Verify both scripts pass with zero errors
    - _Requirements: 15.7_

  - [ ] 16.4 Write backend integration tests
    - Test full CRUD flows for holdings, transactions, and watchlist via HTTP client
    - Test dashboard summary endpoint with populated data
    - Test error responses (404, 422, 500) match envelope format
    - Test market data endpoints with mocked yfinance
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.8, 11.9_

  - [ ] 16.5 Write frontend component tests
    - Test HoldingsTable renders correct columns and data
    - Test WatchlistTable renders correct columns and data
    - Test Dashboard metrics cards display values correctly
    - Test empty states render when no data available
    - Test error notifications display on API failures
    - _Requirements: 1.1, 1.6, 5.1, 6.1, 6.7, 14.3_

- [ ] 17. Final checkpoint - Full integration verified
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (21 properties total)
- Unit tests validate specific examples and edge cases
- Backend uses Python (FastAPI, SQLAlchemy, Hypothesis for PBT)
- Frontend uses TypeScript (React, Vite, fast-check for PBT)
- All property tests should run minimum 100 iterations per property

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1", "7.1"] },
    { "id": 3, "tasks": ["2.2", "2.3"] },
    { "id": 4, "tasks": ["2.4", "2.5"] },
    { "id": 5, "tasks": ["3.1", "3.3", "7.2"] },
    { "id": 6, "tasks": ["3.2", "3.4", "3.5", "7.3"] },
    { "id": 7, "tasks": ["3.6", "3.7", "7.4", "7.5"] },
    { "id": 8, "tasks": ["5.1", "7.6", "8.1"] },
    { "id": 9, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6"] },
    { "id": 10, "tasks": ["5.7", "5.8", "9.1"] },
    { "id": 11, "tasks": ["9.2", "9.3", "11.1"] },
    { "id": 12, "tasks": ["9.4", "11.2", "12.1"] },
    { "id": 13, "tasks": ["12.2", "12.3", "13.1"] },
    { "id": 14, "tasks": ["12.4", "15.1"] },
    { "id": 15, "tasks": ["16.1", "16.2", "16.3"] },
    { "id": 16, "tasks": ["16.4", "16.5"] }
  ]
}
```
