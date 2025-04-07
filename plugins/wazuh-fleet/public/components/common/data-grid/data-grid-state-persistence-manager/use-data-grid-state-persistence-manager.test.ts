import { renderHook } from '@testing-library/react-hooks';
import useDataGridStatePersistenceManager from './use-data-grid-state-persistence-manager';
import { DataGridStatePersistenceManager } from './types';

// Mock state type that extends DataGridState
type MockState = number;

describe('useDataGridStatePersistenceManager', () => {
  // Mock module ID for testing
  const moduleId = 'test-module';
  // Mock stateManagement ID for testing
  const stateManagementId = 'test-state-management';
  // Mock default state
  const defaultState: MockState = 10;
  // Mock persisted state
  const persistedState: MockState = 20;
  // Mock state management
  const mockStateManagement: jest.MockedObject<
    DataGridStatePersistenceManager<MockState>
  > = {
    retrieveState: jest.fn(),
    persistState: jest.fn(),
    clearState: jest.fn(),
  };
  // Mock validation function
  const mockValidateState = jest.fn(
    (state: MockState) => typeof state === 'number',
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve persisted state when available and valid', () => {
    mockStateManagement.retrieveState.mockReturnValueOnce(persistedState);
    mockValidateState.mockReturnValueOnce(true);

    const { result } = renderHook(() =>
      useDataGridStatePersistenceManager({
        stateManagementId,
        stateManagement: mockStateManagement,
        defaultState,
        validateState: mockValidateState,
      }),
    );
    const retrievedState = result.current.retrieveState(moduleId);

    expect(mockStateManagement.retrieveState).toHaveBeenCalledWith(moduleId);
    expect(mockValidateState).toHaveBeenCalledWith(persistedState);
    expect(retrievedState).toEqual(persistedState);
  });

  it('should return default state when persisted state is not available', () => {
    mockStateManagement.retrieveState.mockReturnValueOnce(null);

    const { result } = renderHook(() =>
      useDataGridStatePersistenceManager({
        stateManagementId,
        stateManagement: mockStateManagement,
        defaultState,
        validateState: mockValidateState,
      }),
    );
    const retrievedState = result.current.retrieveState(moduleId);

    expect(mockStateManagement.retrieveState).toHaveBeenCalledWith(moduleId);
    expect(mockValidateState).not.toHaveBeenCalled();
    expect(retrievedState).toEqual(defaultState);
  });

  it('should return default state when persisted state is invalid', () => {
    mockStateManagement.retrieveState.mockReturnValueOnce(persistedState);
    mockValidateState.mockReturnValueOnce(false);

    const { result } = renderHook(() =>
      useDataGridStatePersistenceManager({
        stateManagementId,
        stateManagement: mockStateManagement,
        defaultState,
        validateState: mockValidateState,
      }),
    );
    const retrievedState = result.current.retrieveState(moduleId);

    expect(mockStateManagement.retrieveState).toHaveBeenCalledWith(moduleId);
    expect(mockValidateState).toHaveBeenCalledWith(persistedState);
    expect(retrievedState).toEqual(defaultState);
  });

  it('should clear state when validation throws an error', () => {
    mockStateManagement.retrieveState.mockReturnValueOnce(persistedState);
    mockValidateState.mockImplementationOnce(() => {
      throw new Error('Validation error');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const { result } = renderHook(() =>
      useDataGridStatePersistenceManager({
        stateManagementId,
        stateManagement: mockStateManagement,
        defaultState,
        validateState: mockValidateState,
      }),
    );
    const retrievedState = result.current.retrieveState(moduleId);

    expect(mockStateManagement.retrieveState).toHaveBeenCalledWith(moduleId);
    expect(mockValidateState).toHaveBeenCalledWith(persistedState);
    expect(mockStateManagement.clearState).toHaveBeenCalledWith(moduleId);
    expect(consoleSpy).toHaveBeenCalled();
    expect(retrievedState).toEqual(defaultState);

    consoleSpy.mockRestore();
  });

  it('should persist state correctly', () => {
    const { result } = renderHook(() =>
      useDataGridStatePersistenceManager({
        stateManagementId,
        stateManagement: mockStateManagement,
        defaultState,
        validateState: mockValidateState,
      }),
    );

    result.current.persistState(moduleId, persistedState);

    expect(mockStateManagement.persistState).toHaveBeenCalledWith(
      moduleId,
      persistedState,
    );
  });

  it('should clear state correctly', () => {
    const { result } = renderHook(() =>
      useDataGridStatePersistenceManager({
        stateManagementId,
        stateManagement: mockStateManagement,
        defaultState,
        validateState: mockValidateState,
      }),
    );

    result.current.clearState(moduleId);

    expect(mockStateManagement.clearState).toHaveBeenCalledWith(moduleId);
  });
});
