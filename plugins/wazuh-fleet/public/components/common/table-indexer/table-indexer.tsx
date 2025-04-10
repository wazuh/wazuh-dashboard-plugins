import React, { useEffect, useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiBasicTableProps,
  EuiPopover,
  EuiPopoverTitle,
  EuiButtonIcon,
} from '@elastic/eui';
import { SearchResponse } from '../../../../../../src/core/server';
import {
  IndexPattern,
  Filter,
} from '../../../../../../src/plugins/data/common';
import { IAgentResponse } from '../../../../common/types';
import { getAgentManagement } from '../../../plugin-services';
import { SearchBarProps } from '../../../../../wazuh-core/public/components';
import WazuhDataGrid from '../wazuh-data-grid/wz-data-grid';
import { agentsTableSelection } from '../../agents/list/actions/actions';
import { DEFAULT_PAGE_SIZE_OPTIONS } from '../data-grid/constants';
import useSearchBar, {
  TUseSearchBarProps,
} from './components/search-bar/use-search-bar';
import { WzSearchBar } from './components/search-bar/search-bar';
import { useFilterManager } from './components/search-bar/hooks/use-filter-manager';

export interface TableAction {
  name: string;
  description: string;
  icon: string;
  type: 'icon';
  isPrimary?: boolean;
  color?: string;
  'data-test-subj'?: string;
  onClick: (row, rowData) => void;
  enabled?: (row, rowData) => boolean;
}
export interface TableIndexerProps {
  indexPatterns: IndexPattern;
  columns: any;
  filters: Filter[];
  tableSortingInitialField?: string;
  tableSortingInitialDirection?: string;
  topTableComponent?: (searchBarProps: TUseSearchBarProps) => React.ReactNode;
  tablePropsIgnored?: EuiBasicTableProps;
  setAllAgentsSelected: (allAgentsSelected: boolean) => void;
  agentSelected: IAgentResponse[];
  setParams: (params: { filters: Filter[]; query: SearchBarProps }) => void;
  needReload: boolean;
  setNeedReload: (needReload: boolean) => void;
  actionsColumn?: TableAction[];
}

export const actionsDropdown = (
  actions: TableAction[],
  items: IAgentResponse[],
) => [
  {
    id: 'actions',
    width: 40,
    headerCellRender: () => null,
    rowCellRender: function RowCellRender(row) {
      const [isPopoverOpen, setIsPopoverOpen] = useState(false);

      return (
        <div>
          <EuiPopover
            isOpen={isPopoverOpen}
            anchorPosition='upCenter'
            panelPaddingSize='s'
            button={
              <EuiButtonIcon
                aria-label='show actions'
                iconType='boxesHorizontal'
                color='text'
                onClick={() => setIsPopoverOpen(!isPopoverOpen)}
              />
            }
            closePopover={() => setIsPopoverOpen(false)}
          >
            <EuiPopoverTitle>Actions</EuiPopoverTitle>
            <div>
              {actions.map((action, index) => (
                <div style={{ width: 200 }} key={index}>
                  <button
                    onClick={() => {
                      // ToDo: Fix the items typo
                      action?.onClick(row, items?.hits?.hits[row.rowIndex]);
                      setIsPopoverOpen(false);
                    }}
                  >
                    <EuiFlexGroup
                      alignItems='center'
                      component='span'
                      gutterSize='s'
                    >
                      <EuiFlexItem grow={false}>
                        <EuiButtonIcon
                          iconType={action.icon}
                          aria-label={action.description}
                          color='text'
                        />
                      </EuiFlexItem>
                      <EuiFlexItem>{action.description}</EuiFlexItem>
                    </EuiFlexGroup>
                  </button>
                </div>
              ))}
            </div>
          </EuiPopover>
        </div>
      );
    },
  },
];

export const TableIndexer = (props: {
  appId: string;
  indexPatterns: IndexPattern;
  columns: any;
  filters: Filter[];
  tableSortingInitialField?: string;
  tableSortingInitialDirection?: string;
  topTableComponent?: (searchBarProps: TUseSearchBarProps) => React.ReactNode;
  setAllAgentsSelected: (allAgentsSelected: boolean) => void;
  agentSelected: IAgentResponse[];
  setParams: (params: { filters: Filter[]; query: SearchBarProps }) => void;
  needReload: boolean;
  setNeedReload: (needReload: boolean) => void;
  actionsColumn?: any;
}) => {
  const {
    appId,
    indexPatterns,
    columns,
    tableSortingInitialField,
    tableSortingInitialDirection,
    topTableComponent,
    filters: filtersDefault,
    agentSelected,
    setParams,
    needReload,
    setNeedReload,
  } = props;
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    // Initialize `pageSize` to 0 to avoid unnecessary multiple fetches. The
    // `WazuhDataGrid` component internally uses a hook (`useDataGrid`) that
    // also manages pagination state. When the component mounts, the local state
    // and the hook's internal state can conflict, causing multiple pagination
    // updates and triggering 2–3 redundant fetches to the indexer. By starting
    // with `pageSize = 0` and adding a conditional check to prevent fetching
    // until a valid `pageSize` is set, we ensure the data is fetched only once
    // correctly.
    pageSize: 0,
  });
  const [sorting, setSorting] = useState<{
    columns: {
      id: string;
      direction: string;
    }[];
  }>({
    columns: [
      {
        id: tableSortingInitialField || '_id',
        direction: tableSortingInitialDirection || 'desc',
      },
    ],
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
      setParams({
        filters,
        query,
      });
    }
  }, [agentSelected]);

  const search = () => {
    // By starting with `pageSize = 0` and adding a conditional check to prevent
    // fetching until a valid `pageSize` is set, we ensure the data is fetched
    // only once correctly.
    if (pagination.pageSize === 0) {
      return;
    }

    setLoadingSearch(true);
    getAgentManagement()
      .getAll({
        filters,
        query,
        pagination,
        sort: sorting,
      })
      .then((results: SearchResponse) => {
        setItems(results);
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

  const tablePagination = {
    ...pagination,
    totalItemCount: total,
    pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
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
        <WazuhDataGrid
          appId={appId}
          isLoading={loadingSearch}
          defaultColumns={columns}
          results={items}
          exportFilters={filters}
          leadingControlColumns={agentsTableSelection({
            items,
            onClickSelectAll: props.onSelectAll,
            onClickSelectRow: props.onSelectRow,
          })}
          trailingControlColumns={actionsDropdown(
            props.actionsColumn || [],
            items,
          )}
          indexPattern={indexPatterns}
          defaultPagination={tablePagination}
          onChangePagination={pagination => {
            setPagination(prev => ({
              ...prev,
              ...pagination,
            }));
          }}
          onChangeSorting={({ columns }) => {
            setSorting({ columns });
          }}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
