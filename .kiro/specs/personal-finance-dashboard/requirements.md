# Requirements Document

## Introduction

A locally hosted personal finance and stock tracking application designed for single-user use on a laptop. The application provides portfolio tracking for owned stocks, watchlist monitoring for potential investments, a financial dashboard with summaries and analytics, historical tracking of stock performance, and personal finance insights. The system follows an offline-first architecture with a React frontend, FastAPI backend, and SQLite database, all running on localhost.

## Glossary

- **Dashboard**: The main summary page displaying portfolio metrics, charts, and recent activity
- **Holdings_Page**: The page displaying all owned stock positions with detailed columns and CRUD operations
- **Watchlist_Page**: The page displaying stocks being monitored for potential purchase
- **Backend**: The FastAPI Python server running on localhost:8000 serving REST API endpoints
- **Frontend**: The React TypeScript application running on localhost:3000
- **Database**: The SQLite database file (finance_tracker.db) storing all application data
- **Market_Data_Service**: The service using yfinance to fetch current stock prices and market data
- **Portfolio**: The collection of all stock holdings owned by the user
- **Holding**: A single stock position consisting of ticker, quantity, and average buy price
- **Transaction**: A record of a buy or sell action for a specific stock
- **Watchlist_Item**: A stock being monitored with target buy price and notes
- **Unrealized_Gain**: The calculated profit or loss on a holding that has not been sold, computed as (Current Price - Average Buy Price) × Quantity
- **Realized_Gain**: The actual profit or loss from completed sell transactions
- **Allocation_Percentage**: The proportion of a single holding's value relative to total portfolio value, computed as (Holding Value / Total Portfolio Value) × 100
- **Annual_Dividend_Income**: The projected yearly dividend earnings for a holding, computed as Dividend Per Share × Shares Owned
- **Price_History**: Historical price records for stocks stored in the database

## Requirements

### Requirement 1: Portfolio Holdings Display

**User Story:** As a user, I want to view all my stock holdings in a comprehensive table, so that I can monitor my investment positions at a glance.

#### Acceptance Criteria

1. WHEN the user navigates to the Holdings_Page, THE Frontend SHALL display a table with columns: Ticker, Company Name, Quantity, Average Buy Price, Current Price, Total Invested, Current Value, Unrealized Gain/Loss, Unrealized Gain %, Sector, Industry, Dividend Yield, Annual Dividend Income, Portfolio Allocation %, and Last Updated
2. THE Backend SHALL calculate Unrealized_Gain for each Holding as (Current Price - Average Buy Price) × Quantity, and Unrealized Gain % as ((Current Price - Average Buy Price) / Average Buy Price) × 100, rounded to 2 decimal places
3. THE Backend SHALL calculate Allocation_Percentage for each Holding as (Holding Value / Total Portfolio Value) × 100, rounded to 2 decimal places
4. THE Backend SHALL calculate Annual_Dividend_Income for each Holding as Dividend Per Share (retrieved from Market_Data_Service) × Quantity, returning 0 if dividend data is unavailable for a ticker
5. WHEN the user expands a holding row, THE Frontend SHALL display the transaction history for that Holding ordered by transaction date descending, showing transaction type, quantity, price, fees, and date for each record
6. IF the user has no holdings in the Database, THEN THE Frontend SHALL display an empty state message indicating no holdings exist and prompting the user to add a holding
7. IF Total Portfolio Value is zero, THEN THE Backend SHALL return 0 for Allocation_Percentage for all holdings

### Requirement 2: Holdings Search and Filter

**User Story:** As a user, I want to search, sort, and filter my holdings, so that I can quickly find specific stocks and analyze my portfolio by different criteria.

#### Acceptance Criteria

1. WHEN the user enters text in the search field, THE Frontend SHALL filter holdings by case-insensitive partial match against ticker symbol or company name, displaying only holdings where the ticker or company name contains the entered text
2. WHEN the user selects a sort option, THE Frontend SHALL sort holdings by the selected column in ascending or descending order, with the default sort direction being descending for numeric columns (gains, allocation, dividends, prices, values) and ascending for text columns (ticker, company name, sector)
3. WHEN the user selects a sector filter, THE Frontend SHALL display only holdings belonging to the selected sector, with sector options dynamically populated from the distinct sectors present in the user's holdings and an "All Sectors" option to reset the filter
4. WHEN the user selects a performance filter, THE Frontend SHALL display only holdings matching the selected category, where the available categories are: Gainers (Unrealized Gain > 0), Losers (Unrealized Gain < 0), and All (no performance filter applied)
5. IF the active combination of search text, sector filter, and performance filter results in zero matching holdings, THEN THE Frontend SHALL display an empty state message indicating no holdings match the current filters

### Requirement 3: Holdings CRUD Operations

**User Story:** As a user, I want to add, edit, and delete stock holdings, so that I can keep my portfolio data accurate and up to date.

#### Acceptance Criteria

1. WHEN the user submits a new holding form with ticker, quantity, and buy price, THE Backend SHALL create a new Holding record and a corresponding Transaction record (with transaction_type set to "buy", the submitted quantity, price, and transaction_date defaulting to the current date) in the Database
2. WHEN the user submits an edit to an existing holding's editable fields (company_name, sector, industry, or notes), THE Backend SHALL update the Holding record in the Database and set the updated_at timestamp
3. WHEN the user confirms deletion of a holding, THE Backend SHALL remove the Holding record and associated Transaction records from the Database
4. IF the user submits a holding form with missing required fields (ticker, quantity, or buy price), THEN THE Frontend SHALL display a validation error message identifying each missing field before submitting to the Backend
5. WHEN a Holding is created or updated, THE Backend SHALL return the complete Holding object including calculated fields (current_value, total_invested, Unrealized_Gain, Unrealized Gain percentage, Allocation_Percentage, and Annual_Dividend_Income) in the API response
6. IF the user submits a holding form with a quantity less than or equal to zero or a buy price less than 0.01, THEN THE Backend SHALL reject the request and return an error message indicating the invalid field values
7. IF the user submits a create, edit, or delete request for a holding that does not exist (invalid holding ID), THEN THE Backend SHALL return an error response indicating the holding was not found
8. IF the user submits a new holding with a ticker that already exists in the Portfolio, THEN THE Backend SHALL reject the creation and return an error message indicating a holding for that ticker already exists

### Requirement 4: Transaction Management

**User Story:** As a user, I want to manually record buy and sell transactions, so that I can maintain an accurate history of my trading activity.

#### Acceptance Criteria

1. WHEN the user submits a buy transaction with ticker, quantity, price, and date, THE Backend SHALL create a Transaction record and update the corresponding Holding average buy price using the weighted average formula: new_avg = ((old_avg × old_qty) + (price × quantity)) / (old_qty + quantity), and increase the Holding quantity by the transaction quantity
2. WHEN the user submits a sell transaction with ticker, quantity, price, and date, THE Backend SHALL create a Transaction record, calculate the Realized_Gain as (Sell Price - Average Buy Price) × Quantity Sold, decrease the Holding quantity by the sold quantity, and include any fees in the transaction record
3. WHEN the user requests transaction history for a holding, THE Backend SHALL return all Transaction records for that Holding ordered by transaction_date descending, including fields: id, transaction_type, quantity, price, fees, transaction_date, and notes
4. WHEN the user deletes a transaction, THE Backend SHALL remove the Transaction record and recalculate the Holding average buy price and quantity by replaying all remaining buy transactions in chronological order
5. IF the user submits a sell transaction with quantity exceeding the current holding quantity, THEN THE Backend SHALL reject the transaction and return a 422 status code with an error message stating insufficient shares
6. IF the user submits a buy transaction for a ticker that does not have an existing Holding, THEN THE Backend SHALL create a new Holding record with the transaction's ticker, quantity, and price as the initial values
7. IF the user deletes the last remaining transaction for a Holding, THEN THE Backend SHALL remove the Holding record from the Database

### Requirement 5: Watchlist Display and Management

**User Story:** As a user, I want to maintain a watchlist of stocks I am considering purchasing, so that I can monitor their prices and make informed buy decisions.

#### Acceptance Criteria

1. WHEN the user navigates to the Watchlist_Page, THE Frontend SHALL display a table with columns: Ticker, Company Name, Current Price, Daily Change %, 52 Week High, 52 Week Low, Target Buy Price, Analyst Rating, PE Ratio, Market Cap, Sector, Notes, and Watch Priority (displayed as integer 1 through 5 where 1 is highest priority)
2. WHEN the user submits a new watchlist item with a ticker (1 to 5 uppercase alphabetic characters), optional target buy price (between 0.01 and 999,999.99), optional priority (integer 1 to 5, defaulting to 3), and optional notes (maximum 500 characters), THE Backend SHALL validate the inputs and create a Watchlist_Item record in the Database
3. WHEN the user edits a watchlist item's target buy price, priority, sector, or notes fields, THE Backend SHALL update the corresponding Watchlist_Item record with the new values
4. WHEN the user removes a watchlist item, THE Backend SHALL delete the Watchlist_Item record from the Database
5. WHEN the user selects "Move to Holdings" for a watchlist item, THE Frontend SHALL present the add holding form pre-populated with the watchlist item ticker and remove the item from the Watchlist after successful holding creation
6. IF the user submits a new watchlist item with a ticker that already exists in the Watchlist, THEN THE Backend SHALL reject the request and return an error message indicating the ticker is already on the watchlist
7. IF the user submits a watchlist item with an invalid ticker format or a target buy price outside the allowed range, THEN THE Frontend SHALL display a validation error message identifying the invalid fields
8. IF the "Move to Holdings" operation fails during holding creation, THEN THE Frontend SHALL display an error notification and retain the watchlist item unchanged

### Requirement 6: Dashboard Summary Metrics

**User Story:** As a user, I want to see a summary dashboard with key portfolio metrics, so that I can quickly assess my overall financial position.

#### Acceptance Criteria

1. WHEN the user navigates to the Dashboard, THE Backend SHALL return summary metrics including: Total Portfolio Value, Total Invested, Unrealized Gain/Loss, Realized Gain/Loss, Daily Change, Annual Dividend Income, Cash Position, and Number of Holdings
2. THE Backend SHALL calculate Total Portfolio Value as the sum of (Current Price × Quantity) for all holdings
3. THE Backend SHALL calculate Total Invested as the sum of (Average Buy Price × Quantity) for all holdings
4. THE Backend SHALL calculate Daily Change as the sum of ((Current Price - Previous Close Price) × Quantity) for all holdings, where Previous Close Price is the most recent closing price retrieved from the Market_Data_Service
5. WHEN the Dashboard loads, THE Frontend SHALL display all summary metrics within 1 second on localhost
6. THE Backend SHALL calculate Cash Position as a user-maintained balance that is increased by sell transaction proceeds and decreased by buy transaction costs, with an initial value of zero unless manually adjusted by the user
7. IF the Portfolio contains no holdings, THEN THE Backend SHALL return all summary metrics as zero values with Number of Holdings equal to 0
8. IF current price data is unavailable for one or more holdings, THEN THE Backend SHALL calculate metrics using the most recently cached price for those holdings and include a stale data indicator in the response

### Requirement 7: Dashboard Charts and Visualizations

**User Story:** As a user, I want to see visual charts of my portfolio data, so that I can understand trends and allocation patterns.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Frontend SHALL display a Portfolio Growth line chart showing portfolio value over time using Price_History data, defaulting to the last 30 days with selectable ranges of 7 days, 30 days, 90 days, and 1 year
2. WHEN the Dashboard loads, THE Frontend SHALL display a Sector Allocation pie chart showing the percentage of portfolio value in each sector, calculated as the sum of holding values per sector divided by total portfolio value
3. WHEN the Dashboard loads, THE Frontend SHALL display a Top Gainers and Losers bar chart showing the 5 holdings with the highest Unrealized Gain % and the 5 holdings with the lowest Unrealized Gain %
4. WHEN the Dashboard loads, THE Frontend SHALL display a Dividend Forecast chart showing projected monthly dividend income for the next 12 months, calculated from Annual_Dividend_Income divided equally across 12 months for each holding
5. WHEN the Dashboard loads, THE Frontend SHALL display a Watchlist Movers chart showing watchlist items with a Daily Change % greater than or equal to 2% or less than or equal to -2%
6. IF no data is available for a chart, THEN THE Frontend SHALL display an empty state message indicating no data is available for that chart instead of rendering an empty or broken chart

### Requirement 8: Dashboard Activity Feed

**User Story:** As a user, I want to see a feed of recent portfolio activity, so that I can review my latest actions and changes.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Frontend SHALL display a Recent Activity Feed showing the 20 most recent portfolio events
2. THE Backend SHALL include added holdings events in the activity feed, with each event containing: event type "holding_added", ticker, company name, quantity, buy price, and timestamp (from holdings.created_at)
3. THE Backend SHALL include sold stock events in the activity feed, with each event containing: event type "stock_sold", ticker, quantity sold, sell price, realized gain, and timestamp (from transactions.transaction_date)
4. THE Backend SHALL include watchlist addition and removal events in the activity feed, with each event containing: event type "watchlist_added" or "watchlist_removed", ticker, and timestamp
5. THE Backend SHALL include notes update events in the activity feed, with each event containing: event type "notes_updated", ticker, and timestamp (from holdings.updated_at or watchlist updated timestamp)
6. THE Backend SHALL return activity feed items ordered by timestamp descending, limited to the 20 most recent events
7. IF no activity events exist, THEN THE Frontend SHALL display an empty state message indicating no recent activity

### Requirement 9: Market Data Integration

**User Story:** As a user, I want current stock prices fetched automatically, so that my portfolio values and watchlist data remain up to date.

#### Acceptance Criteria

1. THE Market_Data_Service SHALL fetch current stock prices from yfinance for all tickers present in holdings and watchlist at a configurable interval (REFRESH_INTERVAL_MINUTES environment variable) defaulting to 15 minutes, accepting values between 1 and 1440 minutes
2. WHEN the Market_Data_Service fetches new prices, THE Backend SHALL update the current price for all holdings and watchlist items in the Database
3. WHEN the Market_Data_Service fetches new prices, THE Backend SHALL store the price data in the Price_History table, retaining records for a maximum of 365 days and deleting older entries during each fetch cycle
4. IF the Market_Data_Service fails to fetch prices from yfinance, THEN THE Backend SHALL retry the request up to 3 times with a 5-second delay between attempts and log each failure without crashing
5. IF the Market_Data_Service fails after all 3 retry attempts, THEN THE Backend SHALL continue serving the most recently cached prices to the Frontend and include a staleness indicator with the timestamp of the last successful fetch in the API response

### Requirement 10: Data Persistence

**User Story:** As a user, I want all my portfolio and watchlist data stored locally, so that my data persists between sessions without requiring cloud connectivity.

#### Acceptance Criteria

1. THE Backend SHALL persist all holdings, transactions, watchlist items, and price history in a SQLite Database file
2. THE Backend SHALL use SQLAlchemy ORM for all Database operations
3. THE Backend SHALL use Alembic for Database schema migrations
4. WHEN the application starts, THE Backend SHALL verify the Database file exists and create it with the holdings, transactions, watchlist, and price_history tables if it does not exist
5. THE Database SHALL store data in a single file named finance_tracker.db
6. IF the Database file cannot be opened or is corrupted at application startup, THEN THE Backend SHALL log the error and terminate with a non-zero exit code within 5 seconds
7. THE Backend SHALL wrap all write operations (create, update, delete) in database transactions and roll back the transaction if any operation within it fails
8. IF an Alembic migration fails, THEN THE Backend SHALL roll back the failed migration, log the error, and terminate with a non-zero exit code without modifying existing data

### Requirement 11: REST API Design

**User Story:** As a user, I want a well-structured API, so that the frontend can reliably communicate with the backend.

#### Acceptance Criteria

1. THE Backend SHALL expose Holdings endpoints at GET, POST, PUT, DELETE /api/holdings and /api/holdings/{id}
2. THE Backend SHALL expose Transaction endpoints at GET, POST, DELETE /api/transactions and /api/transactions/{id}
3. THE Backend SHALL expose Watchlist endpoints at GET, POST, PUT, DELETE /api/watchlist and /api/watchlist/{id}
4. THE Backend SHALL expose a Dashboard summary endpoint at GET /api/dashboard/summary
5. THE Backend SHALL expose Market Data endpoints at GET /api/market/quote/{ticker} and GET /api/market/history/{ticker}
6. IF the Backend receives a request body that fails Pydantic validation, THEN THE Backend SHALL return a 422 status code with an error response identifying each field that failed validation and the reason for failure
7. THE Backend SHALL return JSON responses using the standard envelope format containing a success boolean, a data object, and an error field that is null on success
8. THE Backend SHALL return HTTP status code 200 for successful retrieval and update operations, 201 for successful creation operations, 422 for validation errors, 404 when a requested resource does not exist, and 500 for internal server errors
9. IF the Backend receives a request for a resource with an id that does not exist, THEN THE Backend SHALL return a 404 status code with an error response indicating the resource was not found

### Requirement 12: Application Performance

**User Story:** As a user, I want the application to load quickly and respond promptly, so that I can efficiently manage my finances.

#### Acceptance Criteria

1. WHEN the application starts, THE Frontend SHALL render the initial page with first contentful paint within 3 seconds on localhost, measured with a portfolio of up to 100 holdings
2. WHEN the user navigates to the Dashboard, THE Backend SHALL return the dashboard summary response within 1 second for a portfolio containing up to 100 holdings
3. WHEN the user sends a request to any Backend API endpoint other than the dashboard summary, THE Backend SHALL return the response within 2 seconds for a portfolio containing up to 100 holdings
4. THE Backend SHALL bind only to localhost (127.0.0.1) and reject connections from external network addresses
5. THE Backend SHALL read configuration from environment variables (DATABASE_URL, MARKET_API_PROVIDER, REFRESH_INTERVAL_MINUTES) stored in a .env file
6. IF the .env file is missing or a required environment variable is not set, THEN THE Backend SHALL fail to start and log an error message indicating which variables are missing

### Requirement 13: User Interface Design

**User Story:** As a user, I want a clean, responsive interface with dark mode support, so that I can comfortably view my financial data in any lighting condition.

#### Acceptance Criteria

1. THE Frontend SHALL provide a sidebar navigation with links to Dashboard, Holdings, Watchlist, and Settings pages
2. THE Frontend SHALL support dark mode and light mode display themes, with light mode as the default on first visit
3. WHEN the user selects a theme option in the Settings page or theme toggle, THE Frontend SHALL switch the display to the selected theme and persist the preference in browser local storage so it is retained across sessions
4. THE Frontend SHALL use a responsive layout that renders without horizontal scrolling at viewport widths from 768px to 1920px, with the sidebar collapsing to a toggleable menu at viewports below 1024px
5. THE Frontend SHALL present data-dense tables with a minimum font size of 14px for table cell content, a minimum row height of 40px, and a minimum cell padding of 8px
6. THE Frontend SHALL use TailwindCSS for styling and Recharts or Chart.js for chart rendering

### Requirement 14: Error Handling

**User Story:** As a user, I want the application to handle errors gracefully, so that I can continue using the application even when issues occur.

#### Acceptance Criteria

1. IF the Backend receives a request with invalid data, THEN THE Backend SHALL return a 422 status code with a JSON response in the format {"success": false, "data": null, "error": "<message>"} where the error message identifies the invalid fields and the reason each field failed validation
2. IF the Backend encounters an internal error, THEN THE Backend SHALL return a 500 status code with a JSON response in the format {"success": false, "data": null, "error": "<message>"} where the error message does not expose internal implementation details such as stack traces, file paths, or database queries, and SHALL log the exception type, exception message, and request path to the application log
3. IF the Frontend receives no response from the Backend within 10 seconds or the connection is refused, THEN THE Frontend SHALL display a connection error notification that remains visible until the user dismisses it or the next request to the Backend succeeds, and THE Frontend SHALL retry the failed request up to 3 times with exponential backoff before displaying the notification
4. IF the Market_Data_Service returns data missing a current price field or containing a non-numeric price value or returns an empty response for a ticker, THEN THE Backend SHALL skip the price update for that ticker, retain the previously stored price, and log a warning including the ticker symbol and the reason the data was rejected
5. IF a Backend request fails during a write operation, THEN THE Backend SHALL roll back any partial Database changes from that request so that the Database remains in the state it was in before the request was received

### Requirement 15: Development Standards

**User Story:** As a user, I want the codebase to follow consistent standards, so that the application remains maintainable and extensible.

#### Acceptance Criteria

1. THE Frontend SHALL use strict TypeScript configuration with noImplicitAny, strictNullChecks, strictFunctionTypes, and noUnusedLocals enabled in tsconfig.json, and all source files SHALL compile with zero type errors
2. THE Frontend SHALL use ESLint and Prettier with configuration files present in the project root, and all source files SHALL produce zero errors when checked with both tools
3. THE Backend SHALL use Black and Ruff with configuration present in pyproject.toml, and all Python source files SHALL produce zero errors when checked with both tools
4. THE Backend SHALL use mypy in strict mode for static type checking, and all Python source files SHALL produce zero type errors when checked
5. THE Frontend SHALL use Vitest and React Testing Library for unit and component testing, and all tests SHALL pass with a minimum code coverage of 70%
6. THE Backend SHALL use Pytest for unit and integration testing, and all tests SHALL pass with a minimum code coverage of 70%
7. THE Frontend and Backend SHALL each include a lint/check script in their respective package manager configuration that runs all configured linting, formatting, and type-checking tools in a single command
