// Mock localStorage for tests
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
