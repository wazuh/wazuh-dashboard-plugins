import { renderHook, act } from '@testing-library/react';
import useDataGridColumns from './use-data-grid-columns';
import { useDataGridStatePersistenceManager } from './data-grid-state-persistence-manager/use-data-grid-state-persistence-manager';
import { tDataGridColumn } from './types';

// Mock functions for state persistence manager
const mockPersistState = jest.fn();
const mockRetrieveState = jest.fn();
const mockUpdateState = jest.fn();
const mockClearState = jest.fn();
const mockClearStateColumns = jest.fn();

// Mock the persistence manager hook
jest.mock(
  './data-grid-state-persistence-manager/use-data-grid-state-persistence-manager',
  () => ({
    useDataGridStatePersistenceManager: jest.fn(),
  }),
);

describe('useDataGridColumns', () => {
  // Sample test data
  const moduleId = 'test-app';
  const defaultColumns: tDataGridColumn[] = [
    { id: 'col1', display: 'Column 1' },
    { id: 'col2', display: 'Column 2' },
  ];
  // Add a mapping for column definitions
  const columnSchemaDefinitionsMap = {
    col1: { id: 'col1', display: 'Column 1' },
    col2: { id: 'col2', display: 'Column 2' },
    col3: { id: 'col3', display: 'Column 3' },
  };
  const columnSchemaDefinitions: tDataGridColumn[] = [
    { id: 'col1', display: 'Column 1' },
    { id: 'col2', display: 'Column 2' },
    { id: 'col3', display: 'Column 3' },
  ];

  // Mock the dataGridStatePersistenceManager object
  const mockDataGridStatePersistenceManager = {
    persistState: mockPersistState,
    retrieveState: mockRetrieveState,
    updateState: mockUpdateState,
    clearState: mockClearState,
    clearStateColumns: mockClearStateColumns,
    isStateMatchingDefaults: false,
  };

  const renderColumns = (
    overrides: Partial<Parameters<typeof useDataGridColumns>[0]> = {},
  ) =>
    renderHook(() =>
      useDataGridColumns({
        moduleId,
        defaultColumns,
        columnSchemaDefinitionsMap,
        indexPatternExists: true,
        dataGridStatePersistenceManager: mockDataGridStatePersistenceManager,
        ...overrides,
      }),
    );

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementation for the persistence manager
    (useDataGridStatePersistenceManager as jest.Mock).mockReturnValue(
      mockDataGridStatePersistenceManager,
    );

    // Default behavior for retrieveState function
    mockRetrieveState.mockReturnValue({
      columns: [],
      columnWidths: {},
      pageSize: 10,
    });
  });

  it('should initialize with default columns', () => {
    const { result } = renderColumns();

    expect(result.current.columnVisibility.visibleColumns).toEqual(
      defaultColumns.map(column => column.id),
    );
    expect(result.current.columns.map(column => column.id)).toEqual(
      defaultColumns.map(column => column.id),
    );
  });

  it('should load persisted columns when available', () => {
    const persistedColumns = ['col2', 'col1'];

    mockRetrieveState.mockReturnValue({
      columns: persistedColumns,
      columnWidths: {},
      pageSize: 10,
    });

    const { result } = renderColumns();

    expect(result.current.columnVisibility.visibleColumns).toEqual(
      persistedColumns,
    );
  });

  it('should update visible columns when setVisibleColumns is called', () => {
    const { result } = renderColumns();
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

    const { result } = renderColumns();

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

    const { result } = renderColumns();

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

    const { result } = renderColumns();

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

    const { result } = renderColumns();
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

    const { result } = renderColumns();

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

    const { result } = renderColumns();

    // Resize with invalid column ID
    act(() => {
      result.current.onColumnResize({
        columnId: 'nonexistent',
        width: 300,
      });
    });

    expect(mockUpdateState).toHaveBeenCalledTimes(0);
  });

  it('should drop the column whose field is missing and persist only the valid ones', () => {
    const mockPersistedColumns = ['col1', 'nonexistent'];

    mockRetrieveState.mockReturnValue({
      columns: mockPersistedColumns,
      columnWidths: {},
      pageSize: 10,
    });

    const { result } = renderColumns();

    expect(result.current.columnVisibility.visibleColumns).toEqual(['col1']);
    expect(result.current.columns).toEqual([
      expect.objectContaining({ id: 'col1' }),
    ]);
    expect(result.current.columns.every(column => Boolean(column.id))).toBe(
      true,
    );

    act(() => {
      result.current.columnVisibility.setVisibleColumns(mockPersistedColumns);
    });

    expect(mockUpdateState).toHaveBeenCalledWith({ columns: ['col1'] });
  });

  it('should not filter columns while the index pattern has not loaded yet', () => {
    const mockPersistedColumns = ['col1', 'nonexistent'];

    mockRetrieveState.mockReturnValue({
      columns: mockPersistedColumns,
      columnWidths: {},
      pageSize: 10,
    });

    const { result } = renderColumns({ indexPatternExists: false });

    expect(result.current.columnVisibility.visibleColumns).toEqual(
      defaultColumns.map(column => column.id),
    );
  });

  it('should not filter columns while the schema definitions map is empty', () => {
    mockRetrieveState.mockReturnValue({
      columnWidths: {},
      pageSize: 10,
    });

    const { result } = renderColumns({ columnSchemaDefinitionsMap: {} });

    expect(result.current.columnVisibility.visibleColumns).toEqual(
      defaultColumns.map(column => column.id),
    );
  });

  it('should keep the output unchanged when all configured fields exist (no-op regression guard)', () => {
    const mockPersistedColumns = ['col2', 'col1'];

    mockRetrieveState.mockReturnValue({
      columns: mockPersistedColumns,
      columnWidths: {},
      pageSize: 10,
    });

    const { result } = renderColumns();

    expect(result.current.columnVisibility.visibleColumns).toEqual(
      mockPersistedColumns,
    );
    expect(result.current.columns.map(column => column.id)).toEqual(
      mockPersistedColumns,
    );
  });

  it('should preserve persisted column widths for surviving columns after filtering', () => {
    const mockPersistedColumns = ['col1', 'nonexistent'];

    mockRetrieveState.mockReturnValue({
      columns: mockPersistedColumns,
      columnWidths: {
        col1: 275,
      },
      pageSize: 10,
    });

    const { result } = renderColumns();

    expect(result.current.columns).toEqual([
      expect.objectContaining({ id: 'col1', initialWidth: 275 }),
    ]);
  });

  it('should return empty columns and visibleColumns when all configured fields are missing', () => {
    const mockPersistedColumns = ['nonexistent1', 'nonexistent2'];

    mockRetrieveState.mockReturnValue({
      columns: mockPersistedColumns,
      columnWidths: {},
      pageSize: 10,
    });

    const { result } = renderColumns();

    expect(result.current.columnVisibility.visibleColumns).toEqual([]);
    expect(result.current.columns).toEqual([]);
  });

  it('should keep columnsAvailable consistent with the filtered visible set', () => {
    const mockPersistedColumns = ['col1', 'nonexistent'];

    mockRetrieveState.mockReturnValue({
      columns: mockPersistedColumns,
      columnWidths: {},
      pageSize: 10,
    });

    const { result } = renderColumns();

    const availableIds = result.current.columnsAvailable.map(
      column => column.id,
    );

    expect(availableIds).toEqual(
      expect.arrayContaining(['col1', 'col2', 'col3']),
    );
    expect(availableIds).not.toContain('nonexistent');
    expect(result.current.columnsAvailable.length).toBe(
      columnSchemaDefinitions.length,
    );
  });

  it('should keep the visible columns when the persisted state was reset to an empty list', () => {
    mockRetrieveState.mockReturnValue({
      columns: [],
      columnWidths: {},
      pageSize: 10,
    });

    const { result } = renderColumns();

    expect(result.current.columnVisibility.visibleColumns).toEqual(
      defaultColumns.map(column => column.id),
    );
  });

  it('should self-heal and show the column again once its field appears in the schema map', () => {
    const mockPersistedColumns = ['col1', 'col3'];

    mockRetrieveState.mockReturnValue({
      columns: mockPersistedColumns,
      columnWidths: {},
      pageSize: 10,
    });

    const partialSchemaMap = {
      col1: { id: 'col1', display: 'Column 1' },
    };

    const { result, rerender } = renderHook(
      ({ columnSchemaDefinitionsMap: schemaMap }) =>
        useDataGridColumns({
          moduleId,
          defaultColumns,
          columnSchemaDefinitionsMap: schemaMap,
          indexPatternExists: true,
          dataGridStatePersistenceManager: mockDataGridStatePersistenceManager,
        }),
      { initialProps: { columnSchemaDefinitionsMap: partialSchemaMap } },
    );

    expect(result.current.columnVisibility.visibleColumns).toEqual(['col1']);

    rerender({ columnSchemaDefinitionsMap });

    expect(result.current.columnVisibility.visibleColumns).toEqual([
      'col1',
      'col3',
    ]);
  });
});
