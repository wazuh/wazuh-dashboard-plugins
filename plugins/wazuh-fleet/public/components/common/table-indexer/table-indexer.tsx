import React, { useEffect, useState } from 'react';
import {
  EuiFlexGroup,
  EuiBasicTable,
  EuiFlexItem,
  EuiBasicTableProps,
} from '@elastic/eui';
import { SearchResponse } from '../../../../../../src/core/server';
import {
  IndexPattern,
  Filter,
} from '../../../../../../src/plugins/data/common';
import { IAgentResponse } from '../../../../common/types';
import { getAgentManagement } from '../../../plugin-services';
import { SearchBarProps } from '../../../../../wazuh-core/public/components';
import useSearchBar, {
  TUseSearchBarProps,
} from './components/search-bar/use-search-bar';
import { WzSearchBar } from './components/search-bar/search-bar';
import { useFilterManager } from './components/search-bar/hooks/use-filter-manager';

export const TableIndexer = (props: {
  indexPatterns: IndexPattern;
  columns: any;
  filters: Filter[];
  tableSortingInitialField?: string;
  tableSortingInitialDirection?: string;
  topTableComponent?: (searchBarProps: TUseSearchBarProps) => React.ReactNode;
  tableProps?: EuiBasicTableProps;
  setAllAgentsSelected: (allAgentsSelected: boolean) => void;
  agentSelected: IAgentResponse[];
  setParams: (params: { filters: Filter[]; query: SearchBarProps }) => void;
  needReload: boolean;
  setNeedReload: (needReload: boolean) => void;
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
    needReload,
    setNeedReload,
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
  const { filters } = useFilterManager();
  const { searchBarProps } = useSearchBar({
    indexPattern: indexPatterns,
    filters: [...filtersDefault, ...filters],
  });
  const { query } = searchBarProps;
  const [items, setItems] = useState<SearchResponse['hits'][]>([]); // Use the corresponding type.
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (agentSelected.length === items.length) {
      setAllAgentsSelected(true);
      setParams({
        filters,
        query,
      });
    } else {
      setAllAgentsSelected(false);
    }
  }, [agentSelected]);

  const search = () => {
    setLoadingSearch(true);
    getAgentManagement()
      .getAll({
        filters,
        query,
        pagination,
        sort: {
          columns: [
            {
              id: sorting.sort.field,
              direction: sorting.sort.direction,
            },
          ],
        },
      })
      .then((results: SearchResponse) => {
        setItems(results.hits);
        setTotal(results.total);
      })
      .catch((error: unknown) => {
        console.log(error);
      });
    setLoadingSearch(false);
  };

  useEffect(() => {
    search();
  }, [
    filters,
    JSON.stringify(query),
    JSON.stringify(pagination),
    JSON.stringify(sorting),
  ]);

  useEffect(() => {
    if (needReload) {
      search();
      setNeedReload(false);
    }
  }, [needReload]);

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
    totalItemCount: total,
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
          items={items}
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
