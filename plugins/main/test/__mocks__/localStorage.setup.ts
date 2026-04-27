import util from 'util';

// Polyfill TextEncoder for JSDOM environments where it is absent
// (required by @cfaester/enzyme-adapter-react-18)
if (typeof TextEncoder === 'undefined') {
  Object.defineProperty(global, 'TextEncoder', { value: util.TextEncoder });
}

// Polyfill ResizeObserver for JSDOM environments
// (JSDOM does not implement the ResizeObserver Web API)
if (typeof ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Mock localStorage only in browser-like environments (JSDOM)
if (typeof window !== 'undefined') {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: jest.fn((key: string): string | null => {
        return store[key] || null;
      }),
      setItem: jest.fn((key: string, value: string): void => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string): void => {
        delete store[key];
      }),
      clear: jest.fn((): void => {
        store = {};
      }),
      length: 0,
      key: jest.fn((index: number): string => ''),
    };
  })();

  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
}
