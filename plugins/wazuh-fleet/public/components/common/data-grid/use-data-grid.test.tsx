import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { useDataGrid, tDataGridProps } from './use-data-grid';

describe('useDataGrid hook', () => {
  it('should return override the numbers of rows per page', () => {
    const dataGridProps: tDataGridProps = {
      indexPattern: 'mocked-index-pattern',
      results: {},
      defaultColumns: [],
      DocViewInspectButton: () => <div></div>,
      ariaLabelledBy: '',
      pagination: {
        pageSize: 10,
        pageSizeOptions: [10, 20, 30],
      },
    };
    const { result } = renderHook(() => useDataGrid(dataGridProps));

    expect(result.current.pagination.pageSize).toEqual(10);
    expect(result.current.pagination.pageSizeOptions).toEqual([10, 20, 30]);
  });
});
