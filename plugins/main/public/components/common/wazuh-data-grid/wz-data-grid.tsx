import React, { useState, useMemo, useEffect } from 'react';
import {
  EuiFlexItem,
  EuiToolTip,
  EuiButtonIcon,
  EuiDataGridCellValueElementProps,
  EuiDataGrid,
  EuiButtonEmpty,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiTitle,
  EuiFlyoutBody,
  EuiFlexGroup,
} from '@elastic/eui';
import { useDataGrid, tDataGridProps, exportSearchToCSV, tDataGridColumn } from '../data-grid';
import { getWazuhCorePlugin } from '../../../kibana-services';
import { IndexPattern, SearchResponse } from '../../../../../../src/plugins/data/public';
import { HitsCounter } from '../../../kibana-integrations/discover/application/components/hits_counter';
import { useDocViewer } from '../doc-viewer';
import DocViewer from '../doc-viewer/doc-viewer';
import {
  ErrorHandler,
  ErrorFactory,
  HttpError,
} from '../../../react-services/error-management';
import { LoadingSpinner } from '../loading-spinner/loading-spinner';
import { DiscoverNoResults } from '../no-results/no-results';

export const MAX_ENTRIES_PER_QUERY = 10000;

export type tWazuhDataGridProps = {
  indexPattern: IndexPattern;
  results: SearchResponse;
  defaultColumns: tDataGridColumn[];
  isLoading: boolean;
  defaultPagination: {
    pageIndex: number;
    pageSize: number;
    pageSizeOptions: number[];
  };
  exportFilters: tFilter[];
  onChangePagination: (pagination: { pageIndex: number; pageSize: number }) => void;
  onChangeSorting: (sorting: { columns: any[], onSort: any }) => void;
};

const WazuhDataGrid = (props: tWazuhDataGridProps) => {
  const { results, defaultColumns, indexPattern, isLoading, defaultPagination, onChangePagination, exportFilters = [], onChangeSorting } = props;
  const [inspectedHit, setInspectedHit] = useState<any>(undefined);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const sideNavDocked = getWazuhCorePlugin().hooks.useDockedSideNav();

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
    results,
    indexPattern: indexPattern as IndexPattern,
    DocViewInspectButton,
    pagination: defaultPagination || {
      pageIndex: 0,
      pageSize: 15,
      pageSizeOptions: [15, 25, 50, 100],
    },
  });

  const { pagination, sorting, columnVisibility } = dataGridProps;

  useEffect(() => {
    onChangePagination && onChangePagination(pagination);
  }, [JSON.stringify(pagination)])

  /*
  useEffect(() => {
    onChangeSorting && onChangeSorting(sorting);
  }, [sorting]);
  */
  const docViewerProps = useDocViewer({
    doc: inspectedHit,
    indexPattern: indexPattern as IndexPattern,
  });

  const timeField = indexPattern?.timeFieldName
    ? indexPattern.timeFieldName
    : undefined;

  const onClickExportResults = async () => {
    const params = {
      indexPattern: indexPattern as IndexPattern,
      exportFilters,
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
      const searchError = ErrorFactory.create(HttpError, {
        error,
        message: 'Error downloading csv report',
      });
      ErrorHandler.handleError(searchError);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      { isLoading ? <LoadingSpinner /> : null}
      { !isLoading && !results?.hits?.total === 0 ? <DiscoverNoResults timeFieldName={timeField} queryLanguage={''} /> : null}
      { !isLoading && results?.hits?.total > 0 ?
        <div className='discoverDataGrid'>
          <EuiDataGrid
            {...dataGridProps}
            className={sideNavDocked ? 'dataGridDockedNav' : ''}
            toolbarVisibility={{
              additionalControls: (
                <>
                  <HitsCounter
                    hits={results?.hits?.total}
                    showResetButton={false}
                    tooltip={
                      results?.hits?.total &&
                        results?.hits?.total > MAX_ENTRIES_PER_QUERY
                        ? {
                          ariaLabel: 'Warning',
                          content: `The query results has exceeded the limit of 10,000 hits. To provide a better experience the table only shows the first ${formatNumWithCommas(
                            MAX_ENTRIES_PER_QUERY,
                          )} hits.`,
                          iconType: 'alert',
                          position: 'top',
                        }
                        : undefined
                    }
                  />
                  <EuiButtonEmpty
                    disabled={
                      results?.hits?.total === 0 ||
                      columnVisibility.visibleColumns.length === 0
                    }
                    size='xs'
                    iconType='exportAction'
                    color='primary'
                    isLoading={isExporting}
                    className='euiDataGrid__controlBtn'
                    onClick={onClickExportResults}
                  >
                    Export Formated
                        </EuiButtonEmpty>
                </>
              ),
            }}
          />
        </div> : null}
      {inspectedHit && (
        <EuiFlyout onClose={() => setInspectedHit(undefined)} size='m'>
          <EuiFlyoutHeader>
            <EuiTitle>
              <h2>Document Details</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiFlexGroup direction='column'>
              <EuiFlexItem>
                <DocViewer {...docViewerProps} />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
    </>
  );
};

export default WazuhDataGrid;