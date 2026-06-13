# FinApp_Kiro
Finance Portfolio Management

# Setup
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name

brew install python

brew install node

# Running

Frontend:
npm run dev
http://localhost:3000/

Backend:


# Personal Finance Dashboard

A locally hosted stock portfolio tracker with a React frontend and FastAPI backend. All data is stored in a local SQLite file. Market data is fetched from Yahoo Finance (yfinance).

## How to Run

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

** ENV
# Database connection URL (SQLite file path)
DATABASE_URL=sqlite:///./finance_tracker.db

# Market data provider (currently only yfinance is supported)
MARKET_API_PROVIDER=yfinance

# Interval in minutes between automatic market data refreshes (1-1440)
REFRESH_INTERVAL_MINUTES=15


**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, TailwindCSS, Recharts, TanStack Query, Zustand |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic, APScheduler |
| Database | SQLite (single file: `finance_tracker.db`) |
| Market Data | yfinance (Yahoo Finance, free, no API key) |

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `holdings` | Active stock positions (ticker, quantity, avg buy price, current price, sector, broker) |
| `transactions` | All buy/sell records (type, qty, price, fees, date, broker). Preserved even after holding is deleted. |
| `watchlist` | Stocks being monitored for potential purchase (ticker, target price, priority) |
| `price_history` | Historical daily prices per ticker. Used for portfolio growth chart. Cleaned up after 365 days. |
| `cash_balance` | Single-row table tracking available cash. Updated on every buy/sell. |

---

## Internal API Endpoints (Backend → Frontend)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/holdings` | List all holdings with calculated metrics |
| POST | `/api/holdings` | Create a new holding (also fetches current price from yfinance) |
| PUT | `/api/holdings/{id}` | Update holding metadata (company name, sector, broker) |
| DELETE | `/api/holdings/{id}` | Delete holding, preserve transactions, return cash |
| GET | `/api/transactions?holding_id={id}` | Get transactions for a specific holding |
| POST | `/api/transactions` | Record a buy or sell transaction |
| DELETE | `/api/transactions/{id}` | Delete a transaction, recalculate holding |
| GET | `/api/transactions/sells` | Get all sell transactions with realized gain calculation |
| GET | `/api/watchlist` | List all watchlist items (fetches live prices + RSI) |
| POST | `/api/watchlist` | Add ticker to watchlist (fetches company info from yfinance) |
| PUT | `/api/watchlist/{id}` | Update watchlist item |
| DELETE | `/api/watchlist/{id}` | Remove from watchlist |
| GET | `/api/dashboard/summary` | Portfolio metrics (total value, gains, cash, daily change) |
| GET | `/api/dashboard/activity` | Recent activity feed (last 20 events) |
| GET | `/api/dashboard/history?days={n}` | Portfolio value over time for chart |
| POST | `/api/market/refresh` | Manually trigger price refresh for all tickers |
| GET | `/api/market/quote/{ticker}` | Get live quote for a single ticker |
| GET | `/api/market/history/{ticker}?period={p}` | Get price history (7d/30d/90d/1y) |
| GET | `/api/market/info/{ticker}` | Get company name, sector, industry for a ticker |
| GET | `/api/market/brokers` | Get configured broker list |
| GET | `/health` | Health check |

---

## External API (3rd Party)

| Service | Library | Used For |
|---------|---------|----------|
| Yahoo Finance | `yfinance` (Python) | Current stock prices, historical data, company info, dividend yield, analyst ratings, 52-week high/low, PE ratio, market cap |

No API key required. Called from the backend only. The frontend never calls yfinance directly.

---

## High-Level Flow

### Adding a Holding

```
User enters ticker + quantity + buy price + broker in the UI
        │
        ▼
Frontend (React) ──POST /api/holdings──▶ Backend (FastAPI)
                                              │
                                              ├─ Validates input (Pydantic)
                                              ├─ Checks for duplicate ticker
                                              ├─ Calls yfinance → gets current price, dividend yield
                                              ├─ Calls yfinance → gets company name, sector, industry
                                              ├─ Creates Holding record in SQLite
                                              ├─ Creates initial "buy" Transaction record
                                              ├─ Decreases cash_balance
                                              │
                                              ▼
Frontend receives HoldingResponse ◀── JSON envelope {success, data, error}
        │
        ▼
TanStack Query invalidates cache → Holdings table re-renders with new data
```

### Selling a Stock

```
User clicks "Record Transaction" → selects Sell → enters qty + price
        │
        ▼
Frontend ──POST /api/transactions──▶ Backend
                                        │
                                        ├─ Validates sell qty ≤ holding qty
                                        ├─ Creates "sell" Transaction record
                                        ├─ Decreases holding quantity
                                        ├─ Increases cash_balance
                                        ├─ If qty becomes 0: deletes holding (keeps transactions)
                                        │
                                        ▼
Frontend receives TransactionResponse ◀── JSON
        │
        ▼
TanStack Query invalidates holdings + dashboard + transactions caches
```

### Viewing the Dashboard

```
User navigates to Dashboard
        │
        ▼
Frontend ──GET /api/dashboard/summary──▶ Backend
                                            │
                                            ├─ Sums (current_price × qty) for all holdings
                                            ├─ Computes unrealized gain, realized gain, daily change
                                            ├─ Reads cash_balance
                                            ├─ Checks staleness of price data
                                            │
                                            ▼
Frontend renders MetricsCards + PortfolioGrowthChart
```

### Background Price Refresh (Every 15 min)

```
APScheduler triggers ──▶ MarketDataService.refresh_all_prices()
                              │
                              ├─ Gets all tickers from holdings + watchlist
                              ├─ For each ticker: calls yfinance
                              ├─ Updates current_price on holdings/watchlist
                              ├─ Stores price in price_history table
                              ├─ Deletes price_history older than 365 days
                              │
                              ▼
                         Next page load shows updated prices
```

### Manual Price Refresh

```
User clicks "Refresh Prices" button
        │
        ▼
Frontend ──POST /api/market/refresh──▶ Backend (same as background refresh)
        │
        ▼
Frontend invalidates query caches → page re-renders with fresh data
```

---

## Configuration

All config is in `backend/.env`:

```env
DATABASE_URL=sqlite:///./finance_tracker.db
MARKET_API_PROVIDER=yfinance
REFRESH_INTERVAL_MINUTES=15
BROKERS=Robinhood,Schwab,Merrill
```

- `BROKERS` — comma-separated list of broker options shown in the dropdown
- `REFRESH_INTERVAL_MINUTES` — how often the background scheduler fetches prices (1-1440)

---

## Response Envelope

Every API response follows this format:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

On error:
```json
{
  "success": false,
  "data": null,
  "error": "Human-readable error message"
}
```

---

## Pages

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/` | Portfolio summary metrics, daily change, portfolio growth chart |
| Holdings | `/holdings` | All owned stocks with sortable table, add/edit/delete, record transactions |
| Watchlist | `/watchlist` | Stocks being monitored with live prices, RSI(D), RSI(W), sortable |
| Trade History | `/trades` | All completed sell transactions with realized gain |
| Settings | `/settings` | Theme toggle (light/dark), refresh interval display |



## TO BE IMPLEMENTED

### POSSIBLE FEATURES

Portfolio Analytics

Sector allocation pie chart (you already have the data — just wire it to the dashboard)
Performance comparison vs S&P 500 / QQQ benchmark
Cost basis breakdown per broker (total invested per broker)
Win rate (% of trades that were profitable)
Alerts & Notifications

Price alerts: notify when a watchlist stock hits your target buy price
Stop-loss alerts: notify when a holding drops below a threshold %
RSI alerts: notify when RSI crosses oversold (30) or overbought (70)
Import/Export

CSV import for bulk adding holdings (from Robinhood/Schwab export files)
CSV export of trade history for tax reporting
Portfolio snapshot export (PDF report)
Tax Tracking

Short-term vs long-term capital gains classification (based on hold duration)
Tax-loss harvesting suggestions (holdings with unrealized losses you could sell)
Wash sale detection (re-buying within 30 days of selling at a loss)
Advanced Watchlist

Price target alerts (current price vs your target)
Earnings date column (next earnings report date from yfinance)
Moving averages (50-day, 200-day MA) alongside RSI
UI Improvements

Search/filter on Trade History page
Inline editing of holdings (click to edit broker, notes)
Drag-and-drop watchlist priority reordering
Mobile-optimized view for quick portfolio checks
Data

Options tracking (calls/puts with expiry dates)
Crypto holdings support
Multiple portfolios (e.g., "Retirement" vs "Trading")<!-- test -->
