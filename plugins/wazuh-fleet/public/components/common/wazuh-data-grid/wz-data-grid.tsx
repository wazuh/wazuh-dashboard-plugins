import React, { useState, useMemo, useEffect } from 'react';
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
import DiscoverDataGridAdditionalControls from './components/data-grid-additional-controls';
import './wazuh-data-grid.scss';
import { wzDiscoverRenderColumns } from './render-columns';
import { DocumentViewTableAndJson } from './components/document-view-table-and-json';
import DocDetailsHeader from './components/doc-details-header';

export interface TWazuhDataGridProps {
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

  const dataGridProps = useDataGrid({
    ariaLabelledBy: 'Actions data grid',
    defaultColumns,
    renderColumns: wzDiscoverRenderColumns,
    results,
    indexPattern: indexPattern as IndexPattern,
    DocViewInspectButton,
    leadingControlColumns: props.leadingControlColumns,
    trailingControlColumns: props.trailingControlColumns,
    pagination: defaultPagination || {
      pageIndex: 0,
      pageSize: 15,
      pageSizeOptions: [15, 25, 50, 100],
    },
  });
  const { pagination, sorting, columnVisibility } = dataGridProps;

  useEffect(() => {
    if (onChangePagination) {
      onChangePagination(pagination);
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

  return (
    <>
      {isLoading ? <LoadingSpinner /> : null}
      {!isLoading && results?.hits?.total === 0 ? (
        <DiscoverNoResults timeFieldName={timeField} queryLanguage={''} />
      ) : null}
      {!isLoading && results?.hits?.total > 0 ? (
        <div className='wazuhDataGridContainer'>
          <EuiDataGrid
            {...dataGridProps}
            className={sideNavDocked ? 'dataGridDockedNav' : ''}
            toolbarVisibility={{
              additionalControls: (
                <>
                  <DiscoverDataGridAdditionalControls
                    totalHits={results?.hits?.total}
                    isExporting={isExporting}
                    onClickExportResults={onClickExportResults}
                    maxEntriesPerQuery={MAX_ENTRIES_PER_QUERY}
                    dateRange={dateRange}
                  />
                </>
              ),
            }}
          />
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
