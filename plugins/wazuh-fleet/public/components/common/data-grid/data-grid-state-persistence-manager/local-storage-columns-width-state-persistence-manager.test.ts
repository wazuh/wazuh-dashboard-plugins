import { localStorageColumnsWidthStatePersistenceManager } from './local-storage-columns-width-state-persistence-manager';
import { buildKey } from './build-key';
import { KEY_STATE } from './constants';
import { setupLocalStorageMock } from './mocks/local-storage-mock';
import type { DataGridState } from './types';

describe('localStorageColumnsWidthStatePersistenceManager', () => {
  // Setup localStorage mock
  const localStorageMock = setupLocalStorageMock();

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('retrieveState', () => {
    it('should return parsed columns width when valid data exists', () => {
      // Arrange
      const moduleId = 'test-module';
      const mockColumnsWidth: DataGridState['columnsWidth'] = {
        col1: 100,
        col2: 200,
      };

      localStorage.setItem(
        buildKey(moduleId, KEY_STATE.COLUMN_WIDTH),
        JSON.stringify(mockColumnsWidth),
      );

      // Act
      const result =
        localStorageColumnsWidthStatePersistenceManager.retrieveState(moduleId);

      // Assert
      expect(result).toEqual(mockColumnsWidth);
      expect(localStorage.getItem).toHaveBeenCalledWith(
        buildKey(moduleId, KEY_STATE.COLUMN_WIDTH),
      );
    });

    it('should return empty object when data exists but is invalid JSON', () => {
      // Arrange
      const moduleId = 'test-module';

      localStorage.setItem(
        buildKey(moduleId, KEY_STATE.COLUMN_WIDTH),
        'invalid-json',
      );

      // Act
      const result =
        localStorageColumnsWidthStatePersistenceManager.retrieveState(moduleId);

      // Assert
      expect(result).toEqual({});
      expect(localStorage.getItem).toHaveBeenCalledWith(
        buildKey(moduleId, KEY_STATE.COLUMN_WIDTH),
      );
    });

    it('should return empty object when no data exists', () => {
      // Arrange
      const moduleId = 'test-module';
      // Act
      const result =
        localStorageColumnsWidthStatePersistenceManager.retrieveState(moduleId);

      // Assert
      expect(result).toEqual({});
      expect(localStorage.getItem).toHaveBeenCalledWith(
        buildKey(moduleId, KEY_STATE.COLUMN_WIDTH),
      );
    });
  });

  describe('persistState', () => {
    it('should store columns width in localStorage', () => {
      // Arrange
      const moduleId = 'test-module';
      const mockColumnsWidth: DataGridState['columnsWidth'] = {
        col1: 100,
        col2: 200,
        col3: 300,
      };

      // Act
      localStorageColumnsWidthStatePersistenceManager.persistState(
        moduleId,
        mockColumnsWidth,
      );

      // Assert
      expect(localStorage.setItem).toHaveBeenCalledWith(
        buildKey(moduleId, KEY_STATE.COLUMN_WIDTH),
        JSON.stringify(mockColumnsWidth),
      );
    });
  });

  describe('clearState', () => {
    it('should remove columns width data from localStorage', () => {
      // Arrange
      const moduleId = 'test-module';

      // Act
      localStorageColumnsWidthStatePersistenceManager.clearState(moduleId);

      // Assert
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        buildKey(moduleId, KEY_STATE.COLUMN_WIDTH),
      );
    });
  });
});
