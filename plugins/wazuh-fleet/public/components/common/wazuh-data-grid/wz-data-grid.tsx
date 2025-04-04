import React, { useState, useMemo, useEffect, useReducer } from 'react';
import {
  EuiFlexItem,
  EuiToolTip,
  EuiButtonIcon,
  EuiDataGridCellValueElementProps,
  EuiDataGrid,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiTitle,
  EuiFlyoutBody,
  EuiFlexGroup,
  EuiDataGridControlColumn,
} from '@elastic/eui';
import { IndexPattern, SearchResponse } from 'src/plugins/data/public';
import { useDataGrid, exportSearchToCSV, TDataGridColumn } from '../data-grid';
import { LoadingSpinner } from '../loading-spinner/loading-spinner';
import { DiscoverNoResults } from '../no-results/no-results';
import useDataGridStatePersistenceManager from '../data-grid/data-grid-state-persistence-manager/use-data-grid-state-persistence-manager';
import { DataGridState } from '../data-grid/data-grid-state-persistence-manager/types';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGINATION_OPTIONS,
  MAX_ENTRIES_PER_QUERY,
} from '../data-grid/constants';
import { localStoragePageSizeStatePersistenceManager } from '../data-grid/data-grid-state-persistence-manager/local-storage-page-size-state-persistence-manager';
import DiscoverDataGridAdditionalControls from './components/data-grid-additional-controls';
import './wazuh-data-grid.scss';
import { wzDiscoverRenderColumns } from './render-columns';
import { DocumentViewTableAndJson } from './components/document-view-table-and-json';
import DocDetailsHeader from './components/doc-details-header';
import { WazuhDataGridContextProvider } from './wz-data-grid-context';

export interface TWazuhDataGridProps {
  appId: string;
  indexPattern: IndexPattern;
  results: SearchResponse;
  defaultColumns: TDataGridColumn[];
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
  } = props;
  const [inspectedHit, setInspectedHit] = useState<any>();
  const [isExporting, setIsExporting] = useState<boolean>(false);
  // const sideNavDocked = getWazuhCorePlugin().hooks.useDockedSideNav();
  const sideNavDocked = false; // Placeholder for sideNavDocked
  const onClickInspectDoc = useMemo(
    () => (index: number) => {
      const rowClicked = results.hits.hits[index];

      setInspectedHit(rowClicked);
    },
    [results],
  );

  const DocViewInspectButton = ({
    rowIndex,
  }: EuiDataGridCellValueElementProps) => {
    const inspectHintMsg = 'Inspect document details';

    return (
      <EuiToolTip content={inspectHintMsg}>
        <EuiButtonIcon
          onClick={() => onClickInspectDoc(rowIndex)}
          iconType='inspect'
          aria-label={inspectHintMsg}
        />
      </EuiToolTip>
    );
  };

  const { retrieveState: retrievePageSize, persistState: persistPageSize } =
    useDataGridStatePersistenceManager<DataGridState['pageSize']>({
      stateManagement: localStoragePageSizeStatePersistenceManager,
      defaultState: DEFAULT_PAGE_SIZE,
      validateState(state) {
        return typeof state === 'number' && Number.isInteger(state);
      },
    });
  const dataGridProps = useDataGrid({
    appId,
    ariaLabelledBy: 'Actions data grid',
    defaultColumns,
    renderColumns: wzDiscoverRenderColumns,
    results,
    indexPattern: indexPattern as IndexPattern,
    DocViewInspectButton,
    leadingControlColumns: props.leadingControlColumns,
    trailingControlColumns: props.trailingControlColumns,
    pagination: {
      ...DEFAULT_PAGINATION_OPTIONS,
      ...defaultPagination,
      pageSize: retrievePageSize(appId),
    },
  });
  const { pagination, sorting, columnVisibility } = dataGridProps;

  useEffect(() => {
    onChangePagination({
      ...pagination,
      pageSize: retrievePageSize(appId),
    });
  }, [appId]);

  useEffect(() => {
    if (onChangePagination) {
      onChangePagination(pagination);
      persistPageSize(appId, pagination.pageSize);
    }
  }, [JSON.stringify(pagination)]);

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
            <EuiDataGrid
              /* TODO: this component is not used in the current plugins so this could be removed.
              If this is used in future versions, we should add the functionality to manage the
              visibility of columns thorugh the Available fields button.
              */
              {...dataGridProps}
              className={sideNavDocked ? 'dataGridDockedNav' : ''}
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
                  renderFields={defaultColumns}
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
