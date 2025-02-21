import React, { useEffect, useState } from 'react';
import { EuiFlexGroup, EuiBasicTable, EuiFlexItem } from '@elastic/eui';
import { SearchResponse } from '../../../../../../src/core/server';
import { IAgentResponse } from '../../../../common/types';
import { getAgentManagement } from '../../../plugin-services';
import useSearchBar from './components/search-bar/use-search-bar';
import { WzSearchBar } from './components/search-bar/search-bar';

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
  setAllAgentsSelected: (allAgentsSelected: boolean) => void;
  agentSelected: IAgentResponse[];
  setParams: (params: object) => void;
}) => {
  const {
    indexPatterns,
    columns,
    tableSortingInitialField,
    tableSortingInitialDirection,
    topTableComponent,
    tableProps,
    filters: filtersDefault,
    agentSelected,
    setAllAgentsSelected,
    setParams,
    // documentDetailsExtraTabs,
  } = props;
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });
  const [sorting, setSorting] = useState<{
    sort: {
      field: string;
      direction: string;
    };
  }>({
    sort: {
      field: tableSortingInitialField || '_id',
      direction: tableSortingInitialDirection || 'desc',
    },
  });
  const [filters, setFilters] = useState<any[]>([]);
  const { searchBarProps } = useSearchBar({
    indexPattern: indexPatterns,
    filters: [...filtersDefault, ...filters],
    setFilters,
  });
  const { query } = searchBarProps;
  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  useEffect(() => {
    if (agentSelected.length === results?.hits?.length) {
      setAllAgentsSelected(true);
      setParams({
        filter: filters,
        query,
      });
    } else {
      setAllAgentsSelected(false);
    }
  }, [agentSelected]);

  useEffect(() => {
    setLoadingSearch(true);
    getAgentManagement()
      .getAll({
        filter: filters,
        query,
        pagination,
        sort: { field: sorting.sort.field, direction: sorting.sort.direction },
      })
      .then(results => {
        setResults(results);
      })
      .catch(error => {
        console.log(error);
      });
    setLoadingSearch(false);
  }, [
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
    totalItemCount: results?.total || 0,
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
          items={results?.hits ?? []}
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
