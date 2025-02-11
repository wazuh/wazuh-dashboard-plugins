import React, { useEffect, useState } from 'react';
import { EuiFlexGroup, EuiBasicTable, EuiFlexItem } from '@elastic/eui';
import { SearchResponse } from '../../../../../../src/core/server';
import useSearchBar from './components/search-bar/use-search-bar';
import { WzSearchBar } from './components/search-bar/search-bar';
import { search } from './components/search-bar/search-bar-service';

interface TDocumentDetailsTab {
  id: string;
  name: string;
  content: any;
}

export const TableIndexer = (props: {
  indexPatterns: any;
  columns: any;
  filters: any[];
  documentDetailsExtraTabs?:
    | TDocumentDetailsTab[]
    | (({ document: any, indexPattern: any }) => TDocumentDetailsTab[]);
  tableSortingInitialField?: string;
  tableSortingInitialDirection?: string;
  topTableComponent?: (searchBarProps: any) => React.ReactNode;
  tableProps?: any;
}) => {
  const {
    indexPatterns,
    columns,
    tableSortingInitialField,
    tableSortingInitialDirection,
    topTableComponent,
    tableProps,
    filters: filtersDefault,
    // documentDetailsExtraTabs,
  } = props;
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });
  const [sorting, setSorting] = useState({
    sort: {
      field: tableSortingInitialField || '_id',
      direction: tableSortingInitialDirection || 'desc',
    },
  });
  const [filters, setFilters] = useState([]);
  const { searchBarProps } = useSearchBar({
    indexPattern: indexPatterns,
    filters: [...filtersDefault, ...filters],
    setFilters,
  });
  const { query } = searchBarProps;
  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  useEffect(() => {
    if (!indexPatterns) {
      return;
    }

    setLoadingSearch(true);
    search({
      indexPattern: indexPatterns,
      filters: searchBarProps.filters,
      query,
      pagination,
      sorting: {
        columns: [
          {
            id: sorting.sort.field,
            direction: sorting.sort.direction,
          },
        ],
      },
      filePrefix: '',
    })
      .then(results => {
        setResults(results);
      })
      .catch(error => {
        console.log(error);
      });
    setLoadingSearch(false);
  }, [
    indexPatterns,
    filters,
    JSON.stringify(query),
    JSON.stringify(pagination),
    JSON.stringify(sorting),
  ]);

  function tableOnChange({
    page,
    sort,
  }: {
    page: { index: number; size: number };
    sort: { field: string; direction: string };
  }) {
    const { index: pageIndex, size: pageSize } = page;
    const { field, direction } = sort;

    setPagination({
      pageIndex,
      pageSize,
    });
    setSorting({
      sort: {
        field,
        direction,
      },
    });
  }

  const tablePagination = {
    ...pagination,
    totalItemCount: results?.hits?.total || 0,
    pageSizeOptions: [15, 25, 50, 100],
    hidePerPageOptions: false,
  };

  return (
    <EuiFlexGroup direction='column' gutterSize='m'>
      <EuiFlexItem>
        <WzSearchBar
          appName='search'
          {...searchBarProps}
          showDatePicker={false}
          showQueryInput={true}
          showQueryBar={true}
          showSaveQuery={true}
        />
      </EuiFlexItem>
      {topTableComponent && topTableComponent(searchBarProps)}
      <EuiFlexItem>
        <EuiBasicTable
          columns={columns}
          items={results?.hits?.hits?.map((item: any) => item._source) ?? []}
          loading={loadingSearch}
          pagination={tablePagination}
          sorting={sorting}
          onChange={tableOnChange}
          {...tableProps}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
