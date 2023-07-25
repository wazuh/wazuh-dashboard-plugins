import React, { useState } from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiButtonEmpty,
  EuiFlexItem,
  EuiText,
  EuiLoadingSpinner,
  EuiFieldSearch,
  EuiHorizontalRule,
  EuiIcon,
  EuiBasicTable,
} from '@elastic/eui';
import { useApiRequest } from '../../../common/hooks/useApiRequest';
import { KeyEquivalence } from '../../../../../common/csv-key-equivalence';
import { AppState } from '../../../../react-services/app-state';

export function SyscollectorTable({ tableParams }) {
  const [params, setParams] = useState<{
    limit: number;
    offset: number;
    select: string;
    q?: string;
  }>({
    limit: 10,
    offset: 0,
    select: tableParams.columns.map(({ id }) => id).join(','),
  });
  const [pageIndex, setPageIndex] = useState(0);
  const [searchBarValue, setSearchBarValue] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('');
  const [timerDelaySearch, setTimerDelaySearch] = useState<NodeJS.Timeout>();
  const [sortDirection, setSortDirection] = useState('');
  const [loading, data, error] = useApiRequest('GET', tableParams.path, params);

  const onTableChange = ({ page = {}, sort = {} }) => {
    const { index: pageIndex, size: pageSize } = page;
    const { field: sortField, direction: sortDirection } = sort;
    setPageIndex(pageIndex);
    setPageSize(pageSize);
    setSortField(sortField);
    setSortDirection(sortDirection);
    const field = sortField === 'os_name' ? '' : sortField;
    const direction = sortDirection === 'asc' ? '+' : '-';
    const newParams = {
      ...params,
      limit: pageSize,
      offset: Math.floor((pageIndex * pageSize) / params.limit) * params.limit,
      ...(!!field ? { sort: `${direction}${field}` } : {}),
    };

    setParams(newParams);
  };

  const buildColumns = () => {
    return (tableParams.columns || []).map(item => {
      return {
        field: item.id,
        name: KeyEquivalence[item.id] || item.id,
        sortable: typeof item.sortable !== 'undefined' ? item.sortable : true,
        width: item.width || undefined,
      };
    });
  };

  const columns = buildColumns();

  const pagination = {
    pageIndex: pageIndex,
    pageSize: pageSize,
    totalItemCount: data.total_affected_items || 0,
    pageSizeOptions: [10, 25, 50],
  };

  const sorting = {
    sort: {
      field: sortField,
      direction: sortDirection,
    },
  };

  const onChange = e => {
    const value = e.target.value;
    setSearchBarValue(value);
    timerDelaySearch && clearTimeout(timerDelaySearch);
    const timeoutId = setTimeout(() => {
      const { q, ...rest } = params;
      const newParams = {
        ...rest,
        ...(value
          ? {
              q: tableParams.columns
                .map(({ id }) => `${id}~${value}`)
                .join(','),
            }
          : {}),
      };
      setParams(newParams);
      setPageIndex(0);
    }, 400);
    setTimerDelaySearch(timeoutId);
  };

  const getTotal = () => {
    if (loading)
      return (
        <>
          {'( '}
          <EuiLoadingSpinner></EuiLoadingSpinner>
          {' )'}
        </>
      );
    else return `(${data.total_affected_items})`;
  };

  const downloadCsv = async () => {
    await AppState.downloadCsv(
      tableParams.path,
      tableParams.exportFormatted,
      !!params.q ? [{ name: 'q', value: params.q }] : [],
    );
  };

  return (
    <EuiPanel paddingSize='m' style={{ margin: '12px 16px 12px 16px' }}>
      <EuiFlexGroup>
        <EuiFlexItem grow={false}>
          <span style={{ display: 'flex' }}>
            {' '}
            <EuiIcon
              type={tableParams.icon}
              style={{ marginTop: 3 }}
            ></EuiIcon>{' '}
            &nbsp;{' '}
            <EuiText>
              {tableParams.title} {tableParams.hasTotal ? getTotal() : ''}
            </EuiText>{' '}
          </span>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiHorizontalRule margin='xs' />
      {tableParams.searchBar && (
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFieldSearch
              placeholder='Search'
              value={searchBarValue}
              fullWidth={true}
              onChange={onChange}
              aria-label='Search'
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      )}
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiBasicTable
            tableLayout='auto'
            items={data.affected_items || []}
            columns={columns}
            pagination={pagination}
            loading={loading}
            error={error}
            sorting={sorting}
            onChange={onTableChange}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      {tableParams.exportFormatted && tableParams.columns && (
        <EuiFlexGroup>
          <EuiFlexItem grow={true} />
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty onClick={downloadCsv} iconType='importAction'>
              Download CSV
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      )}
    </EuiPanel>
  );
}
