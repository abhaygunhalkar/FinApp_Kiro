import { useUIStore } from '../../store/uiStore';
import type { Holding } from '../../types';

interface SearchFilterProps {
  holdings: Holding[];
}

export default function SearchFilter({ holdings }: SearchFilterProps) {
  const { holdingsFilter, setHoldingsFilter } = useUIStore();

  const sectors = Array.from(
    new Set(
      holdings
        .map((h) => h.sector)
        .filter((s): s is string => s !== null && s !== '')
    )
  ).sort();

  return (
    <div className="flex flex-wrap items-center gap-4 mb-4">
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="holdings-search" className="sr-only">
          Search holdings
        </label>
        <input
          id="holdings-search"
          type="text"
          placeholder="Search by ticker or company name..."
          value={holdingsFilter.search}
          onChange={(e) => setHoldingsFilter({ search: e.target.value })}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="sector-filter" className="sr-only">
          Filter by sector
        </label>
        <select
          id="sector-filter"
          value={holdingsFilter.sector ?? ''}
          onChange={(e) =>
            setHoldingsFilter({
              sector: e.target.value === '' ? null : e.target.value,
            })
          }
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Sectors</option>
          {sectors.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="performance-filter" className="sr-only">
          Filter by performance
        </label>
        <select
          id="performance-filter"
          value={holdingsFilter.performance}
          onChange={(e) =>
            setHoldingsFilter({
              performance: e.target.value as 'all' | 'gainers' | 'losers',
            })
          }
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Performance</option>
          <option value="gainers">Gainers</option>
          <option value="losers">Losers</option>
        </select>
      </div>
    </div>
  );
}
