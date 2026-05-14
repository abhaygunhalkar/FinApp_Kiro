import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: personal-finance-dashboard
 * Property 21: Theme persistence round trip
 *
 * For any valid theme value ('light' or 'dark'), setting the theme SHALL persist
 * it to localStorage such that reading the theme preference from localStorage
 * returns the same value.
 *
 * **Validates: Requirements 13.3**
 */

// Create a proper localStorage mock before importing the store
const store: Record<string, string> = {};
const localStorageMock: Storage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
  }),
  get length() {
    return Object.keys(store).length;
  },
  key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
};

vi.stubGlobal('localStorage', localStorageMock);

// Import store AFTER mocking localStorage
const { useUIStore } = await import('../../store/uiStore');

const themeArbitrary = fc.constantFrom<'light' | 'dark'>('light', 'dark');

describe('Property 21: Theme persistence round trip', () => {
  beforeEach(() => {
    // Clear the mock store data
    for (const key of Object.keys(store)) {
      delete store[key];
    }
    vi.clearAllMocks();
    // Reset the Zustand store state
    useUIStore.setState({ theme: 'light' });
  });

  it('setting theme persists to localStorage and reads back correctly', () => {
    fc.assert(
      fc.property(themeArbitrary, (theme) => {
        // Act: set the theme via the store
        useUIStore.getState().setTheme(theme);

        // Assert 1: The store's theme state reflects the set value
        const storeTheme = useUIStore.getState().theme;
        expect(storeTheme).toBe(theme);

        // Assert 2: localStorage contains the persisted value
        const storedValue = store['theme'];
        expect(storedValue).toBe(theme);

        // Assert 3: The round trip is consistent (store state === localStorage value)
        expect(storeTheme).toBe(storedValue);
      }),
      { numRuns: 100 },
    );
  });

  it('theme persists correctly across a random sequence of theme changes', () => {
    fc.assert(
      fc.property(fc.array(themeArbitrary, { minLength: 1, maxLength: 50 }), (themes) => {
        for (const theme of themes) {
          // Act: set each theme in sequence
          useUIStore.getState().setTheme(theme);

          // Assert: after each change, store and localStorage are in sync
          const storeTheme = useUIStore.getState().theme;
          const storedValue = store['theme'];

          expect(storeTheme).toBe(theme);
          expect(storedValue).toBe(theme);
        }
      }),
      { numRuns: 100 },
    );
  });
});
