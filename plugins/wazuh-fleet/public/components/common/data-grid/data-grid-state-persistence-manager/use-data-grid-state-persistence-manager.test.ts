import { renderHook } from '@testing-library/react-hooks';
import { DEFAULT_PAGE_SIZE } from '../constants';
import useDataGridStatePersistenceManager from './use-data-grid-state-persistence-manager';
import { DataGridState } from './types';

describe('useDataGridStatePersistenceManager', () => {
  // Mock default state
  const defaultState = {
    columns: ['col1', 'col2'],
    columnsWidth: { col1: 100, col2: 200 },
    pageSize: DEFAULT_PAGE_SIZE,
  } as const satisfies DataGridState;
  // Mock column schema definitions
  const columnSchemaDefinitionsMap = {
    col1: { label: 'Column 1' },
    col2: { label: 'Column 2' },
    col3: { label: 'Column 3' },
  };
  // Mock state management
  const mockStateManagement = {
    retrieveState: jest.fn(),
    persistState: jest.fn(),
    clearState: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve state correctly when valid', () => {
    const persistedState = {
      columns: ['col1', 'col3'],
      columnsWidth: { col1: 150, col3: 250 },
      pageSize: 50,
    } satisfies Partial<DataGridState>;

    mockStateManagement.retrieveState.mockReturnValue(persistedState);

    const { result } = renderHook(() =>
      useDataGridStatePersistenceManager({
        stateManagement: mockStateManagement,
        defaultState,
        columnSchemaDefinitionsMap,
      }),
    );
    const retrievedState = result.current.retrieveState();

    expect(mockStateManagement.retrieveState).toHaveBeenCalled();
    expect(retrievedState).toEqual({
      ...defaultState,
      ...persistedState,
    });
  });

  it('should return merged state when persisted state is partial', () => {
    const persistedState = {
      columns: ['col2', 'col3'],
    };

    mockStateManagement.retrieveState.mockReturnValue(persistedState);

    const { result } = renderHook(() =>
      useDataGridStatePersistenceManager({
        stateManagement: mockStateManagement,
        defaultState,
        columnSchemaDefinitionsMap,
      }),
    );
    const retrievedState = result.current.retrieveState();

    expect(mockStateManagement.retrieveState).toHaveBeenCalled();
    expect(retrievedState).toEqual({
      ...defaultState,
      columns: ['col2', 'col3'],
    });
  });

  it('should reset columns when invalid column ids are found', () => {
    const persistedState = {
      columns: ['col1', 'nonExistentColumn'],
    };

    mockStateManagement.retrieveState.mockReturnValue(persistedState);

    const { result } = renderHook(() =>
      useDataGridStatePersistenceManager({
        stateManagement: mockStateManagement,
        defaultState,
        columnSchemaDefinitionsMap,
      }),
    );
    const retrievedState = result.current.retrieveState();

    expect(mockStateManagement.retrieveState).toHaveBeenCalled();
    expect(retrievedState.columns).toEqual([]);
  });

  it('should reset column widths when invalid', () => {
    const persistedState = {
      columnsWidth: { col1: 5 }, // Too small width
    };

    mockStateManagement.retrieveState.mockReturnValue(persistedState);

    const { result } = renderHook(() =>
      useDataGridStatePersistenceManager({
        stateManagement: mockStateManagement,
        defaultState,
        columnSchemaDefinitionsMap,
      }),
    );
    const retrievedState = result.current.retrieveState();

    expect(mockStateManagement.retrieveState).toHaveBeenCalled();
    expect(retrievedState.columnsWidth).toEqual({});
  });

  it('should reset page size when invalid', () => {
    const persistedState = {
      pageSize: 'invalid' as unknown as number,
    };

    mockStateManagement.retrieveState.mockReturnValue(persistedState);

    const { result } = renderHook(() =>
      useDataGridStatePersistenceManager({
        stateManagement: mockStateManagement,
        defaultState,
        columnSchemaDefinitionsMap,
      }),
    );
    const retrievedState = result.current.retrieveState();

    expect(mockStateManagement.retrieveState).toHaveBeenCalledTimes(1);
    expect(retrievedState.pageSize).toEqual(DEFAULT_PAGE_SIZE);
  });

  it('should persist state correctly', () => {
    const newState = {
      columns: ['col3'],
      pageSize: 25,
    };
    const { result } = renderHook(() =>
      useDataGridStatePersistenceManager({
        stateManagement: mockStateManagement,
        defaultState,
        columnSchemaDefinitionsMap,
      }),
    );

    result.current.persistState(newState);

    expect(mockStateManagement.persistState).toHaveBeenCalledWith(newState);
  });

  it('should update state by merging with existing state', () => {
    const currentState = {
      columns: ['col1', 'col2'],
      columnsWidth: { col1: 100, col2: 200 },
      pageSize: 15,
    };
    const updatePayload = {
      columns: ['col2', 'col3'],
    };

    mockStateManagement.retrieveState.mockReturnValue(currentState);

    const { result } = renderHook(() =>
      useDataGridStatePersistenceManager({
        stateManagement: mockStateManagement,
        defaultState,
        columnSchemaDefinitionsMap,
      }),
    );

    result.current.updateState(updatePayload);

    expect(mockStateManagement.persistState).toHaveBeenCalledWith({
      ...currentState,
      ...updatePayload,
    });
  });

  it('should clear state correctly', () => {
    const { result } = renderHook(() =>
      useDataGridStatePersistenceManager({
        stateManagement: mockStateManagement,
        defaultState,
        columnSchemaDefinitionsMap,
      }),
    );

    result.current.clearState();

    expect(mockStateManagement.clearState).toHaveBeenCalled();
  });
});
