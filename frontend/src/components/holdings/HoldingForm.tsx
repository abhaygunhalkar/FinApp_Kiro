import { useState, useEffect, useCallback } from 'react';
import { useCreateHolding, useUpdateHolding } from '../../hooks/useHoldings';
import apiClient from '../../api/client';
import type { Holding, HoldingCreate } from '../../types';
import { AxiosError } from 'axios';

interface HoldingFormProps {
  holding?: Holding | null;
  onClose: () => void;
}

interface FormErrors {
  ticker?: string;
  quantity?: string;
  buy_price?: string;
  general?: string;
}

interface FormData {
  ticker: string;
  quantity: string;
  buy_price: string;
  company_name: string;
  sector: string;
  industry: string;
  broker: string;
  notes: string;
}

interface TickerInfo {
  company_name: string | null;
  sector: string | null;
  industry: string | null;
  notes: string | null;
}

export default function HoldingForm({ holding, onClose }: HoldingFormProps) {
  const isEditing = !!holding;
  const createMutation = useCreateHolding();
  const updateMutation = useUpdateHolding();

  const [formData, setFormData] = useState<FormData>({
    ticker: holding?.ticker ?? '',
    quantity: holding?.quantity?.toString() ?? '',
    buy_price: holding?.average_buy_price?.toString() ?? '',
    company_name: holding?.company_name ?? '',
    sector: holding?.sector ?? '',
    industry: holding?.industry ?? '',
    broker: holding?.broker ?? '',
    notes: '',
  });

  const [brokers, setBrokers] = useState<string[]>([]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [infoFetched, setInfoFetched] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch broker options on mount
  useEffect(() => {
    apiClient.get('/api/market/brokers').then((res) => {
      if (res.data.success) {
        setBrokers(res.data.data);
      }
    }).catch(() => {
      setBrokers(['Robinhood', 'Schwab', 'Merrill']);
    });
  }, []);

  useEffect(() => {
    if (holding) {
      setFormData({
        ticker: holding.ticker,
        quantity: holding.quantity.toString(),
        buy_price: holding.average_buy_price.toString(),
        company_name: holding.company_name ?? '',
        sector: holding.sector ?? '',
        industry: holding.industry ?? '',
        broker: holding.broker ?? '',
        notes: '',
      });
      setInfoFetched(true);
    }
  }, [holding]);

  const fetchTickerInfo = useCallback(async (ticker: string) => {
    if (!ticker || ticker.length < 1 || !/^[A-Z]{1,5}$/.test(ticker)) {
      return;
    }

    setIsFetchingInfo(true);
    setFetchError(null);

    try {
      const response = await apiClient.get(`/api/market/info/${ticker}`);
      const data = response.data;

      if (data.success && data.data) {
        const info: TickerInfo = data.data;
        setFormData((prev) => ({
          ...prev,
          company_name: info.company_name ?? '',
          sector: info.sector ?? '',
          industry: info.industry ?? '',
          notes: info.notes ?? '',
        }));
        setInfoFetched(true);
        setFetchError(null);
      } else {
        setFetchError('Could not find company info for this ticker');
        setInfoFetched(false);
      }
    } catch {
      setFetchError('Could not fetch company info. You can still add the holding.');
      setInfoFetched(false);
    } finally {
      setIsFetchingInfo(false);
    }
  }, []);

  // Auto-fetch when ticker changes and is valid
  useEffect(() => {
    if (isEditing) return;

    const ticker = formData.ticker.trim();
    if (ticker.length >= 1 && /^[A-Z]{1,5}$/.test(ticker)) {
      const debounce = setTimeout(() => {
        fetchTickerInfo(ticker);
      }, 600);
      return () => clearTimeout(debounce);
    } else {
      setInfoFetched(false);
      setFetchError(null);
      setFormData((prev) => ({
        ...prev,
        company_name: '',
        sector: '',
        industry: '',
        notes: '',
      }));
    }
  }, [formData.ticker, isEditing, fetchTickerInfo]);

  function validate(): FormErrors {
    const newErrors: FormErrors = {};

    const ticker = formData.ticker.trim().toUpperCase();
    if (!ticker) {
      newErrors.ticker = 'Ticker is required';
    } else if (!/^[A-Z]{1,5}$/.test(ticker)) {
      newErrors.ticker = 'Ticker must be 1-5 uppercase letters';
    }

    const quantity = parseFloat(formData.quantity);
    if (!formData.quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(quantity) || quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    const buyPrice = parseFloat(formData.buy_price);
    if (!formData.buy_price.trim()) {
      newErrors.buy_price = 'Buy price is required';
    } else if (isNaN(buyPrice) || buyPrice < 0.01) {
      newErrors.buy_price = 'Buy price must be at least $0.01';
    }

    return newErrors;
  }

  function parseBackendErrors(error: unknown): FormErrors {
    if (error instanceof AxiosError && error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 422) {
        if (data?.detail && Array.isArray(data.detail)) {
          const fieldErrors: FormErrors = {};
          for (const err of data.detail) {
            const field = err.loc?.[err.loc.length - 1];
            if (field && typeof field === 'string') {
              fieldErrors[field as keyof FormErrors] = err.msg;
            }
          }
          return fieldErrors;
        }
        if (data?.error) {
          return { general: data.error };
        }
      }

      if (data?.error) {
        return { general: data.error };
      }
    }

    if (error instanceof Error) {
      return { general: error.message };
    }

    return { general: 'An unexpected error occurred' };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    const payload: HoldingCreate = {
      ticker: formData.ticker.trim().toUpperCase(),
      quantity: parseFloat(formData.quantity),
      buy_price: parseFloat(formData.buy_price),
      ...(formData.company_name.trim() && { company_name: formData.company_name.trim() }),
      ...(formData.sector.trim() && { sector: formData.sector.trim() }),
      ...(formData.industry.trim() && { industry: formData.industry.trim() }),
      ...(formData.broker && { broker: formData.broker }),
      ...(formData.notes.trim() && { notes: formData.notes.trim() }),
    };

    try {
      if (isEditing && holding) {
        await updateMutation.mutateAsync({
          id: holding.id,
          holding: {
            company_name: formData.company_name.trim() || undefined,
            sector: formData.sector.trim() || undefined,
            industry: formData.industry.trim() || undefined,
            notes: formData.notes.trim() || undefined,
          },
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (error: unknown) {
      const backendErrors = parseBackendErrors(error);
      setErrors(backendErrors);
    }
  }

  function handleTickerChange(value: string) {
    const upper = value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
    setFormData((prev) => ({ ...prev, ticker: upper }));
    if (errors.ticker) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.ticker;
        return next;
      });
    }
  }

  function handleChange(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as keyof FormErrors];
        return next;
      });
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="holding-form-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2
            id="holding-form-title"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            {isEditing ? 'Edit Holding' : 'Add Holding'}
          </h2>
          {!isEditing && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter a ticker symbol and we'll fetch the company details automatically.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {errors.general && (
            <div className="p-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {errors.general}
            </div>
          )}

          {/* Ticker */}
          <div>
            <label
              htmlFor="ticker"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Ticker Symbol <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="ticker"
                type="text"
                value={formData.ticker}
                onChange={(e) => handleTickerChange(e.target.value)}
                disabled={isEditing}
                maxLength={5}
                placeholder="e.g. AAPL"
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  errors.ticker
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {isFetchingInfo && (
                <div className="absolute right-3 top-2.5">
                  <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}
            </div>
            {errors.ticker && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.ticker}</p>
            )}
            {fetchError && !errors.ticker && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{fetchError}</p>
            )}
          </div>

          {/* Company Info (auto-fetched, shown as read-only when populated) */}
          {infoFetched && formData.company_name && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 space-y-1">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Company info loaded
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                {formData.company_name}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {[formData.sector, formData.industry].filter(Boolean).join(' • ')}
              </p>
              {formData.notes && (
                <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1 line-clamp-2">
                  {formData.notes}
                </p>
              )}
            </div>
          )}

          {/* Quantity */}
          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Quantity (Shares) <span className="text-red-500">*</span>
            </label>
            <input
              id="quantity"
              type="number"
              step="any"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
              disabled={isEditing}
              placeholder="e.g. 10"
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.quantity
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed`}
            />
            {errors.quantity && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.quantity}</p>
            )}
          </div>

          {/* Buy Price */}
          <div>
            <label
              htmlFor="buy_price"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Buy Price per Share <span className="text-red-500">*</span>
            </label>
            <input
              id="buy_price"
              type="number"
              step="0.01"
              value={formData.buy_price}
              onChange={(e) => handleChange('buy_price', e.target.value)}
              disabled={isEditing}
              placeholder="e.g. 150.00"
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.buy_price
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed`}
            />
            {errors.buy_price && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.buy_price}</p>
            )}
          </div>

          {/* Broker */}
          <div>
            <label
              htmlFor="broker"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Broker
            </label>
            <select
              id="broker"
              value={formData.broker}
              onChange={(e) => handleChange('broker', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="">Select broker...</option>
              {brokers.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || isFetchingInfo}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Holding'}
          </button>
        </div>
      </div>
    </div>
  );
}
