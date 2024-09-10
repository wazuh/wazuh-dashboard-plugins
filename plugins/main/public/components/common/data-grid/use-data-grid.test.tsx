import { useDataGrid, tDataGridProps } from './use-data-grid';
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';

describe('useDataGrid hook', () => {
  it('should return override the numbers of rows per page', () => {
    const dataGridProps: tDataGridProps = {
      // @ts-expect-error Type 'string' is not assignable to type 'IndexPattern'
      indexPattern: 'mocked-index-pattern',
      // @ts-expect-error Type '{}' is missing the following properties from type 'SearchResponse<unknown>': took, timed_out, _shards, hits
      results: {},
      defaultColumns: [],
      DocViewInspectButton: () => <div></div>,
      ariaLabelledBy: '',
      pagination: {
        pageIndex: 0,
        pageSize: 15,
        pageSizeOptions: [15, 25, 50, 100],
      },
    };
    const { result } = renderHook(() => useDataGrid(dataGridProps));
    expect(result.current?.pagination?.pageSize).toEqual(15);
    expect(result.current?.pagination?.pageSizeOptions).toEqual([15, 25, 50, 100]);
  });
});
