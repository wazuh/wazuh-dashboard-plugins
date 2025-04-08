import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { EuiDataGridCellValueElementProps } from '@elastic/eui';
import { useDataGrid, DataGridProps } from './use-data-grid';
import { DEFAULT_PAGINATION_OPTIONS, MAX_ENTRIES_PER_QUERY } from './constants';

// Mock dependencies
jest.mock('./data-grid-service', () => ({
  parseData: jest.fn(rows =>
    // Simple implementation that converts elastic hits to objects
    rows.map(row => ({ ...row._source, id: row._id })),
  ),
  getFieldFormatted: jest.fn(
    (rowIndex, columnId, indexPattern, rows) =>
      // Simple mock that returns the field value
      rows[rowIndex][columnId],
  ),
  parseColumns: jest.fn(() => []),
}));

jest.mock('./use-data-grid-columns', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    columnsAvailable: ['field1', 'field2'],
    columns: [
      { id: 'field1', display: 'Field 1' },
      { id: 'field2', display: 'Field 2' },
    ],
    columnVisibility: {
      visibleColumns: ['field1', 'field2'],
      setVisibleColumns: jest.fn(),
    },
    onColumnResize: jest.fn(),
  })),
}));

describe('useDataGrid hook', () => {
  // Helper to create mock search response
  const createMockSearchResponse = (hitsCount = 0, total = hitsCount) => ({
    hits: {
      hits: Array.from({ length: hitsCount })
        .fill(null)
        .map((_, i) => ({
          _id: `id-${i}`,
          _source: {
            field1: `value-${i}-1`,
            field2: `value-${i}-2`,
          },
        })),
      total,
    },
  });
  // Default props for tests
  const createBaseProps = (overrides = {}): DataGridProps => ({
    appId: 'test-app',
    indexPattern: { fields: [], id: 'test-index' } as any,
    results: createMockSearchResponse(10, 10),
    defaultColumns: [
      { id: 'field1', display: 'Field 1' },
      { id: 'field2', display: 'Field 2' },
    ],
    DocViewInspectButton: ({ rowIndex }: EuiDataGridCellValueElementProps) => (
      <div data-test-subj='doc-view-button' data-row={rowIndex}>
        Inspect
      </div>
    ),
    ariaLabelledBy: 'test-grid',
    ...overrides,
  });

  // Base case - default initialization
  it('should initialize with default values', () => {
    const props = createBaseProps();
    const { result } = renderHook(() => useDataGrid(props));

    expect(result.current).toBeDefined();
    expect(result.current['aria-labelledby']).toBe('test-grid');
    expect(result.current.rowCount).toBe(10);
    expect(result.current.pagination).toBeDefined();
    expect(result.current.columns).toHaveLength(2);
    expect(result.current.leadingControlColumns).toBeDefined();
    expect(result.current.leadingControlColumns).toHaveLength(1);
  });

  // Pagination tests
  describe('pagination', () => {
    it('should use default pagination when none provided', () => {
      const props = createBaseProps();
      const { result } = renderHook(() => useDataGrid(props));

      expect(result.current.pagination).toEqual({
        ...DEFAULT_PAGINATION_OPTIONS,
        onChangeItemsPerPage: expect.any(Function),
        onChangePage: expect.any(Function),
      });
    });

    it('should override default pagination with provided values', () => {
      const props = createBaseProps({
        pagination: {
          pageSize: 25,
          pageSizeOptions: [25, 50, 100],
        },
      });
      const { result } = renderHook(() => useDataGrid(props));

      expect(result.current.pagination.pageSize).toBe(25);
      expect(result.current.pagination.pageSizeOptions).toEqual([25, 50, 100]);
    });

    it('should handle page changes', () => {
      const props = createBaseProps({
        results: createMockSearchResponse(100, 100),
      });
      const { result } = renderHook(() => useDataGrid(props));

      act(() => {
        result.current.pagination.onChangePage(2);
      });

      expect(result.current.pagination.pageIndex).toBe(2);
    });

    it('should change page size and reset to page 0', () => {
      const props = createBaseProps({
        results: createMockSearchResponse(100, 100),
      });
      const { result } = renderHook(() => useDataGrid(props));

      // First go to page 2
      act(() => {
        result.current.pagination.onChangePage(2);
      });
      expect(result.current.pagination.pageIndex).toBe(2);

      // Then change page size, should reset to page 0
      act(() => {
        result.current.pagination.onChangeItemsPerPage(25);
      });

      expect(result.current.pagination.pageSize).toBe(25);
      expect(result.current.pagination.pageIndex).toBe(0);
    });

    it('should reset to page 0 when results change', () => {
      const props = createBaseProps();
      const { result, rerender } = renderHook(
        (props: DataGridProps) => useDataGrid(props),
        {
          initialProps: props,
        },
      );

      // Go to page 2
      act(() => {
        result.current.pagination.onChangePage(2);
      });
      expect(result.current.pagination.pageIndex).toBe(2);

      // Change results
      const newProps = {
        ...props,
        results: createMockSearchResponse(20, 20),
      };

      rerender(newProps);

      // Should be back on page 0
      expect(result.current.pagination.pageIndex).toBe(0);
    });
  });

  // Sorting tests
  describe('sorting', () => {
    it('should use default sorting when columns have sortable properties', () => {
      const props = createBaseProps({
        defaultColumns: [
          { id: 'field1', display: 'Field 1' },
          {
            id: 'field2',
            display: 'Field 2',
            isSortable: true,
            defaultSortDirection: 'desc',
          },
        ],
      });
      const { result } = renderHook(() => useDataGrid(props));

      expect(result.current.sorting.columns).toEqual([
        { id: 'field2', direction: 'desc' },
      ]);
    });

    it('should handle sort changes', () => {
      const props = createBaseProps();
      const { result } = renderHook(() => useDataGrid(props));
      const newSortingColumns = [{ id: 'field1', direction: 'asc' }];

      act(() => {
        result.current.sorting.onSort(newSortingColumns);
      });

      expect(result.current.sorting.columns).toEqual(newSortingColumns);
    });
  });

  // Row handling tests
  describe('row handling', () => {
    it('should handle empty results', () => {
      const props = createBaseProps({
        results: createMockSearchResponse(0, 0),
      });
      const { result } = renderHook(() => useDataGrid(props));

      expect(result.current.rowCount).toBe(0);
    });

    it('should limit rows to MAX_ENTRIES_PER_QUERY', () => {
      const props = createBaseProps({
        results: createMockSearchResponse(10, MAX_ENTRIES_PER_QUERY + 100),
      });
      const { result } = renderHook(() => useDataGrid(props));

      expect(result.current.rowCount).toBe(MAX_ENTRIES_PER_QUERY);
    });

    it('should update rows when results change', () => {
      const props = createBaseProps({
        results: createMockSearchResponse(5, 5),
      });
      const { result, rerender } = renderHook(
        (props: DataGridProps) => useDataGrid(props),
        {
          initialProps: props,
        },
      );

      expect(result.current.rowCount).toBe(5);

      const newProps = {
        ...props,
        results: createMockSearchResponse(10, 10),
      };

      rerender(newProps);

      expect(result.current.rowCount).toBe(10);
    });
  });

  // Cell rendering tests
  describe('cell rendering', () => {
    it('should render cells using getFieldFormatted when no custom render', () => {
      const props = createBaseProps({
        results: createMockSearchResponse(1),
      });
      const { result } = renderHook(() => useDataGrid(props));
      const cellValue = result.current.renderCellValue({
        rowIndex: 0,
        columnId: 'field1',
      });

      // Since we mocked getFieldFormatted to return the field value
      expect(cellValue).toBeDefined();
    });

    it('should use column render function when provided', () => {
      const renderCallback = jest.fn(value => <span>Custom {value}</span>);
      const props = createBaseProps({
        results: createMockSearchResponse(1),
        defaultColumns: [
          { id: 'field1', display: 'Field 1', render: renderCallback },
          { id: 'field2', display: 'Field 2' },
        ],
      });
      const { result } = renderHook(() => useDataGrid(props));

      result.current.renderCellValue({ rowIndex: 0, columnId: 'field1' });

      expect(renderCallback).toHaveBeenCalled();
    });

    it('should use renderColumns render function when provided', () => {
      const renderCallback = jest.fn(value => <span>Custom {value}</span>);
      const props = createBaseProps({
        results: createMockSearchResponse(1),
        renderColumns: [
          { id: 'field1', display: 'Field 1', render: renderCallback },
        ],
      });
      const { result } = renderHook(() => useDataGrid(props));

      result.current.renderCellValue({ rowIndex: 0, columnId: 'field1' });

      expect(renderCallback).toHaveBeenCalled();
    });
  });

  // Control columns tests
  describe('control columns', () => {
    it('should include DocViewInspectButton in leadingControlColumns', () => {
      const props = createBaseProps();
      const { result } = renderHook(() => useDataGrid(props));

      expect(result.current.leadingControlColumns).toHaveLength(1);
      expect(result.current.leadingControlColumns[0].id).toBe(
        'inspectCollapseColumn',
      );
    });

    it('should include custom leadingControlColumns when provided', () => {
      const customColumn = {
        id: 'custom-control',
        headerCellRender: () => <div>Header</div>,
        rowCellRender: () => <div>Custom</div>,
      };
      const props = createBaseProps({
        leadingControlColumns: [customColumn],
      });
      const { result } = renderHook(() => useDataGrid(props));

      expect(result.current.leadingControlColumns).toHaveLength(2);
      expect(result.current.leadingControlColumns[0]).toBe(customColumn);
    });

    it('should include trailingControlColumns when provided', () => {
      const customColumn = {
        id: 'custom-trailing',
        headerCellRender: () => <div>Header</div>,
        rowCellRender: () => <div>Custom</div>,
      };
      const props = createBaseProps({
        trailingControlColumns: [customColumn],
      });
      const { result } = renderHook(() => useDataGrid(props));

      expect(result.current.trailingControlColumns).toEqual([customColumn]);
    });
  });
});
