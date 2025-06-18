import { localStorageStatePersistenceManager } from './local-storage-state-persistence-manager';
import { buildKey } from './build-key';
import { DataGridState } from './types';

describe('localStorageStatePersistenceManager', () => {
  const moduleId = 'test-module';
  const testKey = buildKey(moduleId);
  const mockState: DataGridState = {
    columns: { test: { width: 100 } },
    sort: { field: 'test', direction: 'asc' },
    pagination: { pageIndex: 0, pageSize: 10 },
  };
  // Mock localStorage
  let getItemMock: jest.SpyInstance;
  let setItemMock: jest.SpyInstance;
  let removeItemMock: jest.SpyInstance;

  beforeEach(() => {
    // Setup localStorage mocks
    getItemMock = jest.spyOn(globalThis.localStorage, 'getItem');
    setItemMock = jest.spyOn(globalThis.localStorage, 'setItem');
    removeItemMock = jest.spyOn(globalThis.localStorage, 'removeItem');

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('retrieveState', () => {
    it('should retrieve and parse state from localStorage', () => {
      getItemMock.mockReturnValue(JSON.stringify(mockState));

      const manager = localStorageStatePersistenceManager(moduleId);
      const result = manager.retrieveState();

      expect(getItemMock).toHaveBeenCalledWith(testKey);
      expect(result).toEqual(mockState);
    });

    it('should return empty object if localStorage has no state', () => {
      getItemMock.mockReturnValue(null);

      const manager = localStorageStatePersistenceManager(moduleId);
      const result = manager.retrieveState();

      expect(getItemMock).toHaveBeenCalledWith(testKey);
      expect(result).toEqual({});
    });

    it('should return empty object if JSON parse fails', () => {
      getItemMock.mockReturnValue('invalid-json');

      const manager = localStorageStatePersistenceManager(moduleId);
      const result = manager.retrieveState();

      expect(getItemMock).toHaveBeenCalledWith(testKey);
      expect(result).toEqual({});
    });
  });

  describe('persistState', () => {
    it('should stringify and save state to localStorage', () => {
      const manager = localStorageStatePersistenceManager(moduleId);

      manager.persistState(mockState);

      expect(setItemMock).toHaveBeenCalledWith(
        testKey,
        JSON.stringify(mockState),
      );
    });
  });

  describe('clearState', () => {
    it('should remove state from localStorage', () => {
      const manager = localStorageStatePersistenceManager(moduleId);

      manager.clearState();

      expect(removeItemMock).toHaveBeenCalledWith(testKey);
    });
  });
});
