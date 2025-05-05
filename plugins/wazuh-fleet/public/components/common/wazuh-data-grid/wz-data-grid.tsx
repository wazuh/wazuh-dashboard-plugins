import React, { useState, useEffect, useReducer } from 'react';
import {
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiTitle,
  EuiFlyoutBody,
  EuiFlexGroup,
  EuiDataGridControlColumn,
} from '@elastic/eui';
import { IndexPattern, SearchResponse } from 'src/plugins/data/public';
import { useDataGrid, exportSearchToCSV } from '../data-grid';
import { LoadingSpinner } from '../loading-spinner/loading-spinner';
import { DiscoverNoResults } from '../no-results/no-results';
import {
  DEFAULT_PAGINATION_OPTIONS,
  MAX_ENTRIES_PER_QUERY,
} from '../data-grid/constants';
import { DataGridColumn } from '../data-grid/types';
import DiscoverDataGridAdditionalControls from './components/data-grid-additional-controls';
import './wazuh-data-grid.scss';
import { wzDiscoverRenderColumns } from './render-columns';
import { DocumentViewTableAndJson } from './components/document-view-table-and-json';
import DocDetailsHeader from './components/doc-details-header';
import { WazuhDataGridContextProvider } from './wz-data-grid-context';
import { useStickyDataGrid } from './components/sticky-data-grid/hooks';
import StickyDataGrid from './components/sticky-data-grid/sticky-data-grid';

export interface TWazuhDataGridProps {
  appId: string;
  indexPattern: IndexPattern;
  results: SearchResponse;
  defaultColumns: DataGridColumn[];
  leadingControlColumns?: EuiDataGridControlColumn[];
  trailingControlColumns?: EuiDataGridControlColumn[];
  isLoading: boolean;
  defaultPagination: {
    pageIndex: number;
    pageSize: number;
    pageSizeOptions: number[];
  };
  query: any;
  exportFilters: tFilter[];
  dateRange: TimeRange;
  onChangePagination: (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;
  onChangeSorting: (sorting: { columns: any[]; onSort: any }) => void;
  actionsColumn?: Array<{
    name: string;
    description: string;
    icon: string;
    onClick: (row: any, agent: any) => void;
    [key: string]: any;
  }>;
}

const WazuhDataGrid = (props: TWazuhDataGridProps) => {
  const {
    appId,
    results,
    defaultColumns,
    indexPattern,
    isLoading,
    defaultPagination,
    onChangePagination,
    exportFilters = [],
    onChangeSorting,
    query,
    dateRange,
    actionsColumn
  } = props;
  const [inspectedHit, setInspectedHit] = useState<any>();
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const dataGridProps = useDataGrid({
    appId,
    ariaLabelledBy: 'Actions data grid',
    defaultColumns,
    renderColumns: wzDiscoverRenderColumns,
    results,
    indexPattern: indexPattern as IndexPattern,
    leadingControlColumns: props.leadingControlColumns,
    trailingControlColumns: props.trailingControlColumns,
    pagination: {
      ...DEFAULT_PAGINATION_OPTIONS,
      ...defaultPagination,
    },
  });
  const { pagination, sorting, columnVisibility } = dataGridProps;

  const stickyDataGridProps = useStickyDataGrid({
    columns: dataGridProps.columns,
  });

  useEffect(() => {
    onChangePagination(pagination);
  }, [appId, JSON.stringify(pagination)]);

  useEffect(() => {
    if (onChangeSorting) {
      onChangeSorting(sorting || []);
    }
  }, [JSON.stringify(sorting)]);

  const timeField = indexPattern?.timeFieldName || undefined;

  const onClickExportResults = async () => {
    const params = {
      indexPattern: indexPattern as IndexPattern,
      filters: exportFilters,
      query,
      fields: columnVisibility.visibleColumns,
      pagination: {
        pageIndex: 0,
        pageSize: results.hits.total,
      },
      sorting,
    };

    try {
      setIsExporting(true);
      await exportSearchToCSV(params);
    } catch (error) {
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const rowSelection = useReducer(
    (rowSelection, { action, rowData, onClickSelectRow }) => {
      switch (action) {
        case 'add': {
          const nextRowSelection = new Set(rowSelection);

          nextRowSelection.add(rowData);

          onClickSelectRow(nextRowSelection);

          return nextRowSelection;
        }

        case 'delete': {
          const selectionArray = [...rowSelection];
          const selectionDeleted = selectionArray.filter(
            item => item._id !== rowData._id,
          );
          const nextRowSelection = new Set(selectionDeleted);

          onClickSelectRow(nextRowSelection);

          return nextRowSelection;
        }

        case 'clear': {
          onClickSelectRow(new Set());

          return new Set();
        }

        case 'selectAll': {
          const nextRowSelection = new Set(
            results?.hits?.hits?.map((item, _index) => item),
          );

          onClickSelectRow(nextRowSelection);

          return nextRowSelection;
        }
        // No default
      }

      return rowSelection;
    },
    new Set(),
  );
  const [selectedRows, _dispatchRowSelection] = rowSelection;
  return (
    <>
      {isLoading ? <LoadingSpinner /> : null}
      {!isLoading && results?.hits?.total === 0 ? (
        <DiscoverNoResults timeFieldName={timeField} queryLanguage={''} />
      ) : null}
      {!isLoading && results?.hits?.total > 0 ? (
        <div className='wazuhDataGridContainer'>
          <WazuhDataGridContextProvider value={rowSelection}>
            <StickyDataGrid
              dataGridProps={dataGridProps}
              stickyDataGridProps={{
                ...stickyDataGridProps,
                onClickInspectDoc: setInspectedHit,
                actionsColumn: actionsColumn || [],
                agentsRows: results?.hits?.hits,
                rowCount: results?.hits?.total,
              }}
              toolbarVisibility={{
                showColumnSelector: { allowHide: false },
                additionalControls: (
                  <>
                    <DiscoverDataGridAdditionalControls
                      totalHits={results?.hits?.total}
                      isExporting={isExporting}
                      onClickExportResults={onClickExportResults}
                      maxEntriesPerQuery={MAX_ENTRIES_PER_QUERY}
                      dateRange={dateRange}
                      columnsAvailable={dataGridProps.columnsAvailable}
                      columnVisibility={dataGridProps.columnVisibility}
                      selectedRows={selectedRows}
                    />
                  </>
                ),
              }}
            />
          </WazuhDataGridContextProvider>
        </div>
      ) : null}
      {inspectedHit && (
        <EuiFlyout onClose={() => setInspectedHit(undefined)} size='m'>
          <EuiFlyoutHeader>
            <EuiTitle>
              <DocDetailsHeader
                doc={inspectedHit}
                indexPattern={indexPattern}
              />
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiFlexGroup direction='column'>
              <EuiFlexItem>
                <DocumentViewTableAndJson
                  document={inspectedHit}
                  indexPattern={indexPattern as IndexPattern}
                  renderFields={defaultColumns.filter(item => item.render)}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
    </>
  );
};

export default WazuhDataGrid;
