import { renderHook, act } from '@testing-library/react-hooks';
import useDataGridColumns from './use-data-grid-column-manager';
import useDataGridStatePersistenceManager from './data-grid-state-persistence-manager/use-data-grid-state-persistence-manager';
import { DataGridColumn } from './types';

// Mock the persistence manager hook
jest.mock(
  './data-grid-state-persistence-manager/use-data-grid-state-persistence-manager',
);

describe('useDataGridColumns', () => {
  // Mock functions for state persistence manager
  const mockPersistState = jest.fn();
  const mockRetrieveState = jest.fn();
  const mockUpdateState = jest.fn();
  const mockClearState = jest.fn();
  // Sample test data
  const appId = 'test-app';
  const defaultColumns: DataGridColumn[] = [
    { id: 'col1', display: 'Column 1' },
    { id: 'col2', display: 'Column 2' },
  ];
  // Add a mapping for column definitions
  const columnSchemaDefinitionsMap = {
    col1: { id: 'col1', display: 'Column 1' },
    col2: { id: 'col2', display: 'Column 2' },
    col3: { id: 'col3', display: 'Column 3' },
  };
  const columnSchemaDefinitions: DataGridColumn[] = [
    { id: 'col1', display: 'Column 1' },
    { id: 'col2', display: 'Column 2' },
    { id: 'col3', display: 'Column 3' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementation for the persistence manager
    (useDataGridStatePersistenceManager as jest.Mock).mockImplementation(
      () => ({
        persistState: mockPersistState,
        retrieveState: mockRetrieveState,
        updateState: mockUpdateState,
        clearState: mockClearState,
      }),
    );

    // Default behavior for retrieveState function
    mockRetrieveState.mockReturnValue({
      columns: [],
      columnWidths: {},
      pageSize: 10,
    });
  });

  it('should initialize with default columns', () => {
    const { result } = renderHook(() =>
      useDataGridColumns({
        appId,
        defaultColumns,
        columnSchemaDefinitionsMap,
        indexPatternExists: true,
      }),
    );

    expect(result.current.columns).toHaveLength(defaultColumns.length);
    expect(result.current.columnVisibility.visibleColumns).toEqual(
      defaultColumns.map(col => col.id),
    );
  });

  it('should load persisted columns when available', () => {
    const persistedColumns = ['col2', 'col1'];

    mockRetrieveState.mockReturnValue({
      columns: persistedColumns,
      columnWidths: {},
      pageSize: 10,
    });

    const { result } = renderHook(() =>
      useDataGridColumns({
        appId,
        defaultColumns,
        columnSchemaDefinitionsMap,
        indexPatternExists: true,
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
        columnSchemaDefinitionsMap,
        indexPatternExists: true,
      }),
    );
    const newVisibleColumns = ['col2', 'col3'];

    act(() => {
      result.current.columnVisibility.setVisibleColumns(newVisibleColumns);
    });

    expect(result.current.columnVisibility.visibleColumns).toEqual(
      newVisibleColumns,
    );
    expect(mockUpdateState).toHaveBeenCalledWith({
      columns: newVisibleColumns,
    });
  });

  it('should order columns correctly in columnsAvailable', () => {
    // Use defaultColumns to get column IDs but in reversed order
    mockRetrieveState.mockReturnValue({
      columns: defaultColumns.map(col => col.id).reverse(),
      columnWidths: {},
      pageSize: 10,
    });

    const { result } = renderHook(() =>
      useDataGridColumns({
        appId,
        defaultColumns,
        columnSchemaDefinitionsMap,
        indexPatternExists: true,
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
    mockRetrieveState.mockReturnValue({
      columns: ['col1', 'col2'],
      columnWidths: {
        col1: 250,
        col2: 200,
      },
      pageSize: 10,
    });

    const { result } = renderHook(() =>
      useDataGridColumns({
        appId,
        defaultColumns,
        columnSchemaDefinitionsMap,
        indexPatternExists: true,
      }),
    );

    act(() => {
      result.current.onColumnResize({
        columnId: testColumnId,
        width: testColumnWidth,
      });
    });

    expect(mockUpdateState).toHaveBeenCalledWith({
      columnWidths: {
        col1: testColumnWidth,
        col2: 200,
      },
    });
  });

  it('should handle resize of column not in current width state', () => {
    const testColumnId = 'col3';
    const testColumnWidth = 180;

    // Mock column widths with only some columns
    mockRetrieveState.mockReturnValue({
      columns: ['col1', 'col2', 'col3'],
      columnWidths: {
        col1: 250,
      },
      pageSize: 10,
    });

    const { result } = renderHook(() =>
      useDataGridColumns({
        appId,
        defaultColumns,
        columnSchemaDefinitionsMap,
        indexPatternExists: true,
      }),
    );

    act(() => {
      result.current.onColumnResize({
        columnId: testColumnId,
        width: testColumnWidth,
      });
    });

    // Should add the new column to the existing widths
    expect(mockUpdateState).toHaveBeenCalledWith({
      columnWidths: {
        col1: 250,
        col3: testColumnWidth,
      },
    });
  });

  it('should initialize with empty column widths when none are persisted', () => {
    // Mock empty column widths
    mockRetrieveState.mockReturnValue({
      columns: ['col1', 'col2'],
      columnWidths: {},
      pageSize: 10,
    });

    const { result } = renderHook(() =>
      useDataGridColumns({
        appId,
        defaultColumns,
        columnSchemaDefinitionsMap,
        indexPatternExists: true,
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
    expect(mockUpdateState).toHaveBeenCalledWith({
      columnWidths: {
        col1: testColumnWidth,
      },
    });
  });

  it('should handle multiple column resizes', () => {
    // Initial column widths
    mockRetrieveState.mockReturnValue({
      columns: ['col1', 'col2'],
      columnWidths: {
        col1: 200,
        col2: 200,
      },
      pageSize: 10,
    });

    const { result } = renderHook(() =>
      useDataGridColumns({
        appId,
        defaultColumns,
        columnSchemaDefinitionsMap,
        indexPatternExists: true,
      }),
    );

    // First resize
    act(() => {
      result.current.onColumnResize({
        columnId: 'col1',
        width: 250,
      });
    });

    // Update the mock for the next call
    mockRetrieveState.mockReturnValue({
      columns: ['col1', 'col2'],
      columnWidths: {
        col1: 250,
        col2: 200,
      },
      pageSize: 10,
    });

    expect(mockUpdateState).toHaveBeenCalledWith({
      columnWidths: {
        col1: 250,
        col2: 200,
      },
    });

    // Second resize
    act(() => {
      result.current.onColumnResize({
        columnId: 'col2',
        width: 300,
      });
    });

    expect(mockUpdateState).toHaveBeenLastCalledWith({
      columnWidths: {
        col1: 250,
        col2: 300,
      },
    });
  });

  it('should handle resize with invalid column ID', () => {
    mockRetrieveState.mockReturnValue({
      columns: ['col1', 'col2'],
      columnWidths: {
        col1: 200,
        col2: 200,
      },
      pageSize: 10,
    });

    const { result } = renderHook(() =>
      useDataGridColumns({
        appId,
        defaultColumns,
        columnSchemaDefinitionsMap,
        indexPatternExists: true,
      }),
    );

    // Resize with invalid column ID
    act(() => {
      result.current.onColumnResize({
        columnId: 'nonexistent',
        width: 300,
      });
    });

    expect(mockUpdateState).toHaveBeenCalledTimes(0);
  });

  it('should handle missing columns gracefully', () => {
    // Constants for readability
    const validColumnId = 'col1';
    const nonexistentColumnId = 'nonexistent';
    const mockPersistedColumns = [validColumnId, nonexistentColumnId];

    // Mock retrieving columns that don't exist in the schema
    mockRetrieveState.mockReturnValue({
      columns: mockPersistedColumns,
      columnWidths: {},
      pageSize: 10,
    });

    const { result } = renderHook(() =>
      useDataGridColumns({
        appId,
        defaultColumns,
        columnSchemaDefinitionsMap,
        indexPatternExists: true,
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
    expect(mockUpdateState).toHaveBeenCalledWith({
      columns: [validColumnId],
    });
  });
});
