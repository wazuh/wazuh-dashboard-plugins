import { renderHook, act } from '@testing-library/react-hooks';
import useDataGridColumns from './use-data-grid-columns';
import useDataGridStatePersistenceManager from './data-grid-state-persistence-manager/use-data-grid-state-persistence-manager';
import { TDataGridColumn } from './types';

// Mock the persistence manager hook
jest.mock(
  './data-grid-state-persistence-manager/use-data-grid-state-persistence-manager',
);

describe('useDataGridColumns', () => {
  // Mock functions for column visibility state
  const mockPersistColumnsState = jest.fn();
  const mockRetrieveColumnsState = jest.fn();
  // Mock functions for column width state
  const mockPersistColumnsWidthState = jest.fn();
  const mockRetrieveColumnsWidthState = jest.fn();
  // Sample test data
  const appId = 'test-app';
  const defaultColumns: TDataGridColumn[] = [
    { id: 'col1', display: 'Column 1' },
    { id: 'col2', display: 'Column 2' },
  ];
  const columnSchemaDefinitions: TDataGridColumn[] = [
    { id: 'col1', display: 'Column 1' },
    { id: 'col2', display: 'Column 2' },
    { id: 'col3', display: 'Column 3' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementation to return different values for each call
    (useDataGridStatePersistenceManager as jest.Mock).mockImplementation(
      params => {
        // Determine which state manager to return based on the stateManagementId
        if (params.stateManagementId === 'column') {
          // This is the columns visibility state manager
          return {
            persistState: mockPersistColumnsState,
            retrieveState: mockRetrieveColumnsState,
          };
        } else if (params.stateManagementId === 'column-width') {
          // This is the columns width state manager
          return {
            persistState: mockPersistColumnsWidthState,
            retrieveState: mockRetrieveColumnsWidthState,
          };
        }

        // Default case, return empty functions
        return {
          persistState: jest.fn(),
          retrieveState: jest.fn(),
          clearState: jest.fn(),
        };
      },
    );

    // Default behavior for retrieveState functions
    mockRetrieveColumnsState.mockReturnValue([]);
    mockRetrieveColumnsWidthState.mockReturnValue({});
  });

  it('should initialize with default columns', () => {
    const { result } = renderHook(() =>
      useDataGridColumns({
        appId,
        defaultColumns,
        columnSchemaDefinitions,
      }),
    );

    expect(result.current.columns).toHaveLength(defaultColumns.length);
    expect(result.current.columnVisibility.visibleColumns).toEqual(
      defaultColumns.map(col => col.id),
    );
  });

  it('should load persisted columns when available', () => {
    const persistedColumns = ['col2', 'col1'];

    mockRetrieveColumnsState.mockReturnValue(persistedColumns);

    const { result } = renderHook(() =>
      useDataGridColumns({
        appId,
        defaultColumns,
        columnSchemaDefinitions,
      }),
    );

    expect(result.current.columnVisibility.visibleColumns).toEqual(
      persistedColumns,
    );
  });

  it('should update visible columns when setVisibleColumns is called', () => {
    const { result } = renderHook(() =>
      useDataGridColumns({
        appId,
        defaultColumns,
        columnSchemaDefinitions,
      }),
    );
    const newVisibleColumns = ['col2', 'col3'];

    act(() => {
      result.current.columnVisibility.setVisibleColumns(newVisibleColumns);
    });

    expect(result.current.columnVisibility.visibleColumns).toEqual(
      newVisibleColumns,
    );
    expect(mockPersistColumnsState).toHaveBeenCalledWith(
      appId,
      newVisibleColumns,
    );
  });

  it('should order columns correctly in columnsAvailable', () => {
    // Use defaultColumns to get column IDs but in reversed order
    mockRetrieveColumnsState.mockReturnValue(
      defaultColumns.map(col => col.id).reverse(),
    );

    const { result } = renderHook(() =>
      useDataGridColumns({
        appId,
        defaultColumns,
        columnSchemaDefinitions,
      }),
    );

    // First columns should be the visible ones in the correct order
    expect(result.current.columnsAvailable[0].id).toBe('col2');
    expect(result.current.columnsAvailable[1].id).toBe('col1');
    // The last column should be col3 which is defined in columnSchemaDefinitions but not in visibleColumns
    expect(result.current.columnsAvailable[2].id).toBe('col3');
    // Ensure all columns from columnSchemaDefinitions are present
    expect(result.current.columnsAvailable.length).toBe(
      columnSchemaDefinitions.length,
    );
  });

  it('should persist column width when onColumnResize is called', () => {
    const testColumnId = 'col1';
    const testColumnWidth = 150;

    // Mock column widths
    mockRetrieveColumnsWidthState.mockReturnValue({
      col1: 250,
      col2: 200,
    });

    const { result } = renderHook(() =>
      useDataGridColumns({
        appId,
        defaultColumns,
        columnSchemaDefinitions,
      }),
    );

    act(() => {
      result.current.onColumnResize({
        columnId: testColumnId,
        width: testColumnWidth,
      });
    });

    expect(mockPersistColumnsWidthState).toHaveBeenCalledWith(appId, {
      col1: testColumnWidth,
      col2: 200,
    });
  });

  it('should handle resize of column not in current width state', () => {
    const testColumnId = 'col3';
    const testColumnWidth = 180;

    // Mock column widths with only some columns
    mockRetrieveColumnsWidthState.mockReturnValue({
      col1: 250,
    });

    const { result } = renderHook(() =>
      useDataGridColumns({
        appId,
        defaultColumns,
        columnSchemaDefinitions,
      }),
    );

    act(() => {
      result.current.onColumnResize({
        columnId: testColumnId,
        width: testColumnWidth,
      });
    });

    // Should add the new column to the existing widths
    expect(mockPersistColumnsWidthState).toHaveBeenCalledWith(appId, {
      col1: 250,
      col3: testColumnWidth,
    });
  });

  it('should initialize with empty column widths when none are persisted', () => {
    // Mock empty column widths
    mockRetrieveColumnsWidthState.mockReturnValue({});

    const { result } = renderHook(() =>
      useDataGridColumns({
        appId,
        defaultColumns,
        columnSchemaDefinitions,
      }),
    );
    const testColumnId = 'col1';
    const testColumnWidth = 150;

    act(() => {
      result.current.onColumnResize({
        columnId: testColumnId,
        width: testColumnWidth,
      });
    });

    // Should persist only the resized column
    expect(mockPersistColumnsWidthState).toHaveBeenCalledWith(appId, {
      col1: testColumnWidth,
    });
  });

  it('should handle multiple column resizes', () => {
    // Initial column widths
    mockRetrieveColumnsWidthState.mockReturnValue({
      col1: 200,
      col2: 200,
    });

    const { result } = renderHook(() =>
      useDataGridColumns({
        appId,
        defaultColumns,
        columnSchemaDefinitions,
      }),
    );

    // First resize
    act(() => {
      result.current.onColumnResize({
        columnId: 'col1',
        width: 250,
      });
    });

    mockRetrieveColumnsWidthState.mockReturnValue({
      col1: 250,
      col2: 200,
    });

    expect(mockPersistColumnsWidthState).toHaveBeenCalledWith(appId, {
      col1: 250,
      col2: 200,
    });

    // Second resize
    act(() => {
      result.current.onColumnResize({
        columnId: 'col2',
        width: 300,
      });
    });

    expect(mockPersistColumnsWidthState).toHaveBeenLastCalledWith(appId, {
      col1: 250,
      col2: 300,
    });
  });

  it('should handle resize with invalid column ID', () => {
    mockRetrieveColumnsWidthState.mockReturnValue({
      col1: 200,
      col2: 200,
    });

    const { result } = renderHook(() =>
      useDataGridColumns({
        appId,
        defaultColumns,
        columnSchemaDefinitions,
      }),
    );

    // Resize with invalid column ID
    act(() => {
      result.current.onColumnResize({
        columnId: 'nonexistent',
        width: 300,
      });
    });

    expect(mockPersistColumnsWidthState).toHaveBeenCalledTimes(0);
  });

  it('should handle missing columns gracefully', () => {
    // Constants for readability
    const validColumnId = 'col1';
    const nonexistentColumnId = 'nonexistent';
    const mockPersistedColumns = [validColumnId, nonexistentColumnId];

    // Mock retrieving columns that don't exist in the schema
    mockRetrieveColumnsState.mockReturnValue(mockPersistedColumns);

    const { result } = renderHook(() =>
      useDataGridColumns({
        appId,
        defaultColumns,
        columnSchemaDefinitions,
      }),
    );

    // It should filter out non-existent columns when persisting
    expect(result.current.columnVisibility.visibleColumns).toEqual(
      mockPersistedColumns,
    );

    act(() => {
      // This will trigger filtering of invalid columns
      result.current.columnVisibility.setVisibleColumns(mockPersistedColumns);
    });

    // Only the valid column should be persisted
    expect(mockPersistColumnsState).toHaveBeenCalledWith(appId, [
      validColumnId,
    ]);
  });

  it('should reset to default columns when validation fails', () => {
    // Setup mock to throw an error for column state
    mockRetrieveColumnsState
      .mockImplementationOnce(() => {
        throw new Error('Validation error');
      })
      .mockReturnValueOnce([]);

    const { result } = renderHook(() =>
      useDataGridColumns({
        appId,
        defaultColumns,
        columnSchemaDefinitions,
      }),
    );

    // Should fall back to default columns
    expect(result.current.columnVisibility.visibleColumns).toEqual(
      defaultColumns.map(col => col.id),
    );
  });
});
