import axios from 'axios';
import type { ApiResponse } from '../types';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Unwraps the ApiResponse envelope and returns the data field.
 * Throws an error if the response indicates failure.
 */
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error || 'An unexpected error occurred');
  }
  return response.data as T;
}

export default apiClient;
