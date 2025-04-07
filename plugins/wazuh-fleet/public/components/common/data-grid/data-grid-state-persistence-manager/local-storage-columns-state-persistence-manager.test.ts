import { localStorageColumnsStatePersistenceManager } from './local-storage-columns-state-persistence-manager';
import { buildKey } from './build-key';
import { KEY_STATE } from './constants';
import type { DataGridState } from './types';

describe('localStorageColumnsStatePersistenceManager', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      }),
    };
  })();

  // Replace the global localStorage with our mock
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('retrieveState', () => {
    it('should return parsed columns when valid data exists', () => {
      // Arrange
      const moduleId = 'test-module';
      const mockColumns: DataGridState['columns'] = ['col1', 'col2'];

      localStorage.setItem(
        buildKey(moduleId, KEY_STATE.COLUMN),
        JSON.stringify(mockColumns),
      );

      // Act
      const result =
        localStorageColumnsStatePersistenceManager.retrieveState(moduleId);

      // Assert
      expect(result).toEqual(mockColumns);
      expect(localStorage.getItem).toHaveBeenCalledWith(
        buildKey(moduleId, KEY_STATE.COLUMN),
      );
    });

    it('should return empty array when data exists but is invalid JSON', () => {
      // Arrange
      const moduleId = 'test-module';

      localStorage.setItem(
        buildKey(moduleId, KEY_STATE.COLUMN),
        'invalid-json',
      );

      // Act
      const result =
        localStorageColumnsStatePersistenceManager.retrieveState(moduleId);

      // Assert
      expect(result).toEqual([]);
      expect(localStorage.getItem).toHaveBeenCalledWith(
        buildKey(moduleId, KEY_STATE.COLUMN),
      );
    });

    it('should return empty array when no data exists', () => {
      // Arrange
      const moduleId = 'test-module';
      // Act
      const result =
        localStorageColumnsStatePersistenceManager.retrieveState(moduleId);

      // Assert
      expect(result).toEqual([]);
      expect(localStorage.getItem).toHaveBeenCalledWith(
        buildKey(moduleId, KEY_STATE.COLUMN),
      );
    });
  });

  describe('persistState', () => {
    it('should store columns in localStorage', () => {
      // Arrange
      const moduleId = 'test-module';
      const mockColumns: DataGridState['columns'] = ['col1', 'col2', 'col3'];

      // Act
      localStorageColumnsStatePersistenceManager.persistState(
        moduleId,
        mockColumns,
      );

      // Assert
      expect(localStorage.setItem).toHaveBeenCalledWith(
        buildKey(moduleId, KEY_STATE.COLUMN),
        JSON.stringify(mockColumns),
      );
    });
  });

  describe('clearState', () => {
    it('should remove columns data from localStorage', () => {
      // Arrange
      const moduleId = 'test-module';

      // Act
      localStorageColumnsStatePersistenceManager.clearState(moduleId);

      // Assert
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        buildKey(moduleId, KEY_STATE.COLUMN),
      );
    });
  });
});
