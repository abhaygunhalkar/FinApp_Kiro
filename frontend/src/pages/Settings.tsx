import { useUIStore } from '../store/uiStore';

export default function Settings() {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  const refreshIntervalMinutes = 15;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Settings
      </h1>

      {/* Theme Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Appearance
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Choose your preferred display theme. Your selection is saved automatically.
        </p>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === 'light'}
              onChange={() => setTheme('light')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Light
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === 'dark'}
              onChange={() => setTheme('dark')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Dark
            </span>
          </label>
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Current theme: <span className="font-medium capitalize">{theme}</span>
        </p>
      </section>

      {/* Refresh Interval Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Data Refresh
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Market data is refreshed automatically at the interval configured on the backend.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Refresh interval:
          </span>
          <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300">
            {refreshIntervalMinutes} minutes
          </span>
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          This value is configured via the REFRESH_INTERVAL_MINUTES environment variable on the backend server.
        </p>
      </section>
    </div>
  );
}
