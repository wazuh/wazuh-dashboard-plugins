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
                      action?.onClick(
                        row,
                        items?.hits?.hits[row.rowIndex]._source,
                      );
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
  actionsColumn?: any;
}) => {
  const {
    indexPatterns,
    columns,
    tableSortingInitialField,
    tableSortingInitialDirection,
    topTableComponent,
    tablePropsIgnored,
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

  // Remove unused function
  /* function tableOnChange({
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
  } */

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
        <WazuhDataGrid
          isLoading={loadingSearch}
          defaultColumns={columns}
          results={items}
          exportFilters={filters}
          leadingControlColumns={agentsTableSelection}
          trailingControlColumns={actionsDropdown(
            props.actionsColumn || [],
            items,
          )}
          indexPattern={indexPatterns}
          defaultPagination={tablePagination}
          onChangePagination={pagination => {
            console.log('pagination', pagination);
            setPagination(prev => ({
              ...prev,
              pageIndex: pagination.pageIndex,
              pageSize: pagination.pageSize,
            }));
          }}
          onChangeSorting={sorting => {
            console.log('sorting', sorting);

            setSorting(prev => ({
              ...prev,
              sort: sorting,
            }));
          }}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
