import React, { Fragment, useState, useEffect } from 'react';
import { WzSearchBar, filtersToObject } from "../wz-search-bar";
import { WzRequest } from '../../react-services/wz-request';
import { getAgentFilterValues } from '../../controllers/management/components/management/groups/get-agents-filters-values';
import { WzButtonModal } from '../common/util/button-modal';

import {
  EuiSpacer,
  EuiBasicTable,
  EuiHealth,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody
} from '@elastic/eui';
import _ from 'lodash';

export const WzSelectorLoader = props => {
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try{
      const { items, totalItems } = await props.fetchData(props);
      setItems(items);
      setTotalItems(totalItems);
    }catch(error){

    };
    setIsLoading(false);
  }

  useEffect(() => {
    fetchData();
  },[props.filters,props.pageIndex,props.pageSize,props.sortField,props.sortDirection]);

  const pagination =
    totalItems > 10
      ? {
          pageIndex: props.pageIndex,
          pageSize: props.pageSize,
          totalItemCount: totalItems,
          pageSizeOptions: [10]
        }
      : false;
  const sorting = {
    sort: {
      field: props.sortField,
      direction: props.sortDirection
    }
  };
  const onTableChange = ({ page = {}, sort = {} }) => {
    const { index: pageIndex, size: pageSize } = page;
    const { field: sortField, direction: sortDirection } = sort;
    props.setPageIndex && props.setPageIndex(pageIndex);
    props.setPageSize && props.setPageSize(pageSize);
    props.setSortField && props.setSortField(sortField);
    props.setSortDirection && props.setSortDirection(sortDirection);
  };

  const getRowProps = item => {
    const { id } = item;
    return {
      'data-test-subj': `row-${id}`,
      onClick: () => {
        props.onSelectItem(item)
      },
    };
  };

  return (
    <Fragment>
      <EuiBasicTable
        items={items}
        itemId="id"
        columns={props.tableColumns}
        onChange={onTableChange}
        sorting={sorting}
        loading={isLoading}
        rowProps={getRowProps}
        // cellProps={getCellProps}
        noItemsMessage={props.tableNoItemsMessage}
        {...(pagination && { pagination })}
      />
    </Fragment>
  )
};

export const WzSelectorWithSearchTable = ({button, isOpen, onClose, modal, onSelectItem, fetchData, tableColumns, searchSuggestions, searchPlaceholder, searchFilters, tableNoItemsMessage, tableSort = {}}) => {
  const [filters, setFilters] = useState(searchFilters || []);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState(tableSort.field || '');
  const [sortDirection, setSortDirection] = useState(tableSort.direction || '');

  const onFiltersChange = (filters) => {
    setFilters(filters);
    setPageIndex(0);
  }

  const selectItem = item => {
    onSelectItem(item);
    onClose();
  }
  
  return (
    <Fragment>
      <WzButtonModal
        button={button}
        isOpen={isOpen}
        onClose={onClose}
        className={modal && modal.className ? modal.className : ''}
      >
        <EuiModalHeader>
          <EuiModalHeaderTitle>{modal.title}</EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <WzSearchBar
            filters={filters}
            suggestions={searchSuggestions}
            onFiltersChange={onFiltersChange}
            placeholder={searchPlaceholder}
          />
          <EuiSpacer />
          <WzSelectorLoader
            filters={filters}
            pageIndex={pageIndex}
            pageSize={pageSize}
            sortField={sortField}
            sortDirection={sortDirection}
            setPageIndex={setPageIndex}
            setPageSize={setPageSize}
            setSortField={setSortField}
            setSortDirection={setSortDirection}
            onSelectItem={selectItem}
            fetchData={fetchData}
            tableColumns={tableColumns}
            tableNoItemsMessage={tableNoItemsMessage}
          />
        </EuiModalBody>
      </WzButtonModal>
    </Fragment>
  )
};


const color = status => {
  if (status.toLowerCase() === 'active') {
    return 'success';
  } else if (status.toLowerCase() === 'disconnected') {
    return 'danger';
  } else if (status.toLowerCase() === 'never connected') {
    return 'subdued';
  }
};

const addHealthStatusRender = (status) => <EuiHealth color={color(status)}><span className={'hide-agent-status'}>{status}</span></EuiHealth>;

const checkField = field => {
  return field !== undefined ? field : '-';
};

const addIconPlatformRender = (os) => {
  if(typeof os === "string" ){ return os};
    let icon = false;

    if (((os || {}).uname || '').includes('Linux')) {
      icon = 'linux';
    } else if ((os || {}).platform === 'windows') {
      icon = 'windows';
    } else if ((os || {}).platform === 'darwin') {
      icon = 'apple';
    }
    const os_name =
      checkField((os || {}).name) +
      ' ' +
      checkField((os || {}).version);
    return (
      <span className="euiTableCellContent__text euiTableCellContent--truncateText">
        <i
          className={`fa fa-${icon} AgentsTable__soBadge AgentsTable__soBadge--${icon}`}
          aria-hidden="true"
        ></i>{' '}
        {os_name === '--' ? '-' : os_name}
      </span>
    );
}

const agentSuggestions = [
  { type: 'q', label: 'status', description: 'Filter by agent connection status', operators: ['=', '!=',], values: ['Active', 'Disconnected', 'Never connected'] },
  { type: 'q', label: 'os.platform', description: 'Filter by OS platform', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('os.platform', value, { q: 'id!=000'})},
  { type: 'q', label: 'ip', description: 'Filter by agent IP', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('ip', value, { q: 'id!=000'})},
  { type: 'q', label: 'name', description: 'Filter by agent name', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('name', value, { q: 'id!=000'})},
  { type: 'q', label: 'id', description: 'Filter by agent id', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('id', value, { q: 'id!=000'})},
  { type: 'q', label: 'group', description: 'Filter by agent group', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('group', value, { q: 'id!=000'})},
  { type: 'q', label: 'node_name', description: 'Filter by node name', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('node_name', value, { q: 'id!=000'})},
  { type: 'q', label: 'manager', description: 'Filter by manager', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('manager', value, { q: 'id!=000'})},
  { type: 'q', label: 'version', description: 'Filter by agent version', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('version', value, { q: 'id!=000'})},
  { type: 'q', label: 'configSum', description: 'Filter by agent config sum', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('configSum', value, { q: 'id!=000'})},
  { type: 'q', label: 'mergedSum', description: 'Filter by agent merged sum', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('mergedSum', value, { q: 'id!=000'})},
  { type: 'q', label: 'dateAdd', description: 'Filter by add date', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('dateAdd', value, { q: 'id!=000'})},
  { type: 'q', label: 'lastKeepAlive', description: 'Filter by last keep alive', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('lastKeepAlive', value, { q: 'id!=000'})},
];

const agentTableConlumns = [
  {
    field: 'id',
    name: 'ID',
    sortable: true,
    // width: '6%'
  },
  {
    field: 'name',
    name: 'Name',
    sortable: true,
    // width: '15%',
    truncateText: true
  },
  {
    field: 'ip',
    name: 'IP',
    // width: '10%',
    truncateText: true,
    sortable: true
  },
  {
    field: 'group',
    name: 'Group(s)',
    // width: '20%',
    truncateText: true,
    sortable: true,
    // render: groups => groups !== '-' ? this.renderGroups(groups) : '-'
  },
  {
    field: 'os',
    name: 'OS',
    sortable: true,
    // width: '15%',
    truncateText: true,
    render: addIconPlatformRender
  },
  {
    field: 'version',
    name: 'Version',
    // width: '5%',
    truncateText: true,
    sortable: true
  },
  {
    field: 'status',
    name: 'Status',
    truncateText: true,
    sortable: true,
    // width: '15%',
    render: addHealthStatusRender
  }
];

export const WzAgentSelector = props => {
  const buildFilter = props => {
    const { pageIndex, pageSize, filters } = props;
  
    const filter = {
      ...filtersToObject(filters),
      offset: (pageIndex * pageSize) || 0,
      limit: pageSize,
      sort: buildSortFilter(props)
    };
    filter.q = !filter.q ? `id!=000` : `id!=000;${filter.q}`;
  
    return filter;
  }
  
  const buildSortFilter = props => {
    const { sortField, sortDirection } = props;
  
    const field = sortField === 'os_name' ? '' : sortField;
    const direction = sortDirection === 'asc' ? '+' : '-';
  
    return direction + field;
  }

  const fetchData = async (props) => {
    const filter = buildFilter(props);
    const agentsResponse = await WzRequest.apiReq('GET', '/agents', filter);
    const items = (((agentsResponse || {}).data || {}).data || {}).items || [];
    const totalItems = (((agentsResponse || {}).data || {}).data || {}).totalItems || 0;
    return { items: items.map(item => ({...item, os: item.os || ''})), totalItems }
  }

  return <WzSelectorWithSearchTable
    {...props}
    searchSuggestions={agentSuggestions}
    tableColumns={agentTableConlumns}
    tableSort={{field: 'id', direction: 'asc'}}
    fetchData={fetchData}
    searchPlaceholder="Filter or search agent"
    tableNoItemsMessage='No agents found'
  />
}


const groupSuggestions = [];

const groupTableConlumns = [
  {
    field: 'name',
    name: 'Name',
    sortable: true,
    // width: '6%'
  },
  {
    field: 'count',
    name: 'Count',
    sortable: true,
    // width: '15%',
    truncateText: true
  }
];

export const WzGroupSelector = props => {
  const buildFilter = props => {
    const { pageIndex, pageSize, filters } = props;
  
    const filter = {
      ...filtersToObject(filters),
      offset: (pageIndex * pageSize) || 0,
      limit: pageSize,
      sort: buildSortFilter(props)
    };
  
    return filter;
  }
  
  const buildSortFilter = props => {
    const { sortField, sortDirection } = props;
  
    const field = sortField;
    const direction = sortDirection === 'asc' ? '+' : '-';
  
    return direction + field;
  }

  const fetchData = async (props) => {
    const filter = buildFilter(props);
    const groupsResponse = await WzRequest.apiReq('GET', '/agents/groups', filter);
    const items = (((groupsResponse || {}).data || {}).data || {}).items || [];
    const totalItems = (((groupsResponse || {}).data || {}).data || {}).totalItems || 0;
    return { items, totalItems }
  }

  return <WzSelectorWithSearchTable
    {...props}
    searchSuggestions={groupSuggestions}
    tableColumns={groupTableConlumns}
    tableSort={{field: 'name', direction: 'asc'}}
    fetchData={fetchData}
    searchPlaceholder="Filter or search group"
    tableNoItemsMessage='No groups found'
  />
}
