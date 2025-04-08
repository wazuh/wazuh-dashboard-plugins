import { DEFAULT_PAGE_SIZE } from '../constants';
import { localStoragePageSizeStatePersistenceManager } from './local-storage-page-size-state-persistence-manager';
import { buildKey } from './build-key';
import { KEY_STATE } from './constants';
import { setupLocalStorageMock } from './mocks/local-storage-mock';
import type { DataGridState } from './types';

describe('localStoragePageSizeStatePersistenceManager', () => {
  // Setup localStorage mock
  const localStorageMock = setupLocalStorageMock();

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('retrieveState', () => {
    it('should return parsed page size when valid data exists', () => {
      // Arrange
      const moduleId = 'test-module';
      const mockPageSize: DataGridState['pageSize'] = 25;

      localStorage.setItem(
        buildKey(moduleId, KEY_STATE.PAGE_SIZE),
        String(mockPageSize),
      );

      // Act
      const result =
        localStoragePageSizeStatePersistenceManager.retrieveState(moduleId);

      // Assert
      expect(result).toEqual(mockPageSize);
      expect(localStorage.getItem).toHaveBeenCalledWith(
        buildKey(moduleId, KEY_STATE.PAGE_SIZE),
      );
    });

    it('should return default page size when data exists but is invalid JSON', () => {
      // Arrange
      const moduleId = 'test-module';

      localStorage.setItem(
        buildKey(moduleId, KEY_STATE.PAGE_SIZE),
        'invalid-json',
      );

      // Act
      const result =
        localStoragePageSizeStatePersistenceManager.retrieveState(moduleId);

      // Assert
      expect(result).toEqual(DEFAULT_PAGE_SIZE);
      expect(localStorage.getItem).toHaveBeenCalledWith(
        buildKey(moduleId, KEY_STATE.PAGE_SIZE),
      );
    });

    it('should return default page size when no data exists', () => {
      // Arrange
      const moduleId = 'test-module';
      // Act
      const result =
        localStoragePageSizeStatePersistenceManager.retrieveState(moduleId);

      // Assert
      expect(result).toEqual(DEFAULT_PAGE_SIZE);
      expect(localStorage.getItem).toHaveBeenCalledWith(
        buildKey(moduleId, KEY_STATE.PAGE_SIZE),
      );
    });
  });

  describe('persistState', () => {
    it('should store page size in localStorage', () => {
      // Arrange
      const moduleId = 'test-module';
      const mockPageSize: DataGridState['pageSize'] = 50;

      // Act
      localStoragePageSizeStatePersistenceManager.persistState(
        moduleId,
        mockPageSize,
      );

      // Assert
      expect(localStorage.setItem).toHaveBeenCalledWith(
        buildKey(moduleId, KEY_STATE.PAGE_SIZE),
        String(mockPageSize),
      );
    });
  });

  describe('clearState', () => {
    it('should remove page size data from localStorage', () => {
      // Arrange
      const moduleId = 'test-module';

      // Act
      localStoragePageSizeStatePersistenceManager.clearState(moduleId);

      // Assert
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        buildKey(moduleId, KEY_STATE.PAGE_SIZE),
      );
    });
  });
});
