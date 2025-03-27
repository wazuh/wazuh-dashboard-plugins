import React, { useEffect, useMemo, useState } from 'react';
import { IntlProvider } from 'react-intl';
import {
  EuiDataGrid,
  EuiToolTip,
  EuiButtonIcon,
  EuiDataGridCellValueElementProps,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiTitle,
  EuiButtonEmpty,
  EuiPanel,
  EuiSpacer,
} from '@elastic/eui';
import { SearchResponse } from '../../../../../../../src/core/server';
import { HitsCounter } from '../../../../kibana-integrations/discover/application/components/hits_counter';
import { formatNumWithCommas } from '../../../../kibana-integrations/discover/application/helpers';
import { getWazuhCorePlugin } from '../../../../kibana-services';
import {
  ErrorHandler,
  ErrorFactory,
  HttpError,
} from '../../../../react-services/error-management';

import {
  exportSearchToCSV,
  getAllCustomRenders,
  MAX_ENTRIES_PER_QUERY,
  useDataGrid,
} from '../../../common/data-grid';

// common components/hooks
import { IndexPattern } from '../../../../../../../../src/plugins/data/public';
import { wzDiscoverRenderColumns } from '../../../common/wazuh-discover/render-columns';
import {
  DocumentViewTableAndJson,
  DocumentViewTableAndJsonPropsAdditionalTabs,
} from '../../../common/wazuh-discover/components/document-view-table-and-json';
import { DataGridVisibleColumnsSelector } from '../../../common/wazuh-discover/components/visible-columns-selector';
import { withErrorBoundary, withPanel } from '../../../common/hocs';
import { compose } from 'redux';

export interface WzTableDiscoverProps {
  dataSource: any;
  fetchFilters: any;
  searchBarProps: any;
  filters: any;
  setFilters: any;
  fetchData: any;
  fingerprint: any;
  isDataSourceLoading: any;
  tableDefaultColumns: tDataGridColumn[];
  createNewSearchContext?: CreateNewSearchContext;
  useAbsoluteDateRange?: boolean;
  displayOnlyNoResultsCalloutOnNoResults?: boolean;
  title?: React.ReactNode;
  inspectDetailsTitle?: string;
  additionalDocumentDetailsTabs?: DocumentViewTableAndJsonPropsAdditionalTabs;
}
/**
 * React component that renders a grid table using a parent data
 * source
 * @param param0
 * @returns
 */
export const WzTableUseParentDataSource = compose(
  withPanel({ paddingSize: 's', hasShadow: false, hasBorder: true }),
  withErrorBoundary,
)(
  ({
    dataSource,
    fetchFilters,
    filters,
    setFilters,
    searchBarProps,
    fetchData,
    fingerprint,
    isDataSourceLoading,
    tableDefaultColumns,
    title,
    inspectDetailsTitle = 'Details',
    additionalDocumentDetailsTabs = [],
  }: WzTableDiscoverProps) => {
    const { query } = searchBarProps;

    const [results, setResults] = useState<SearchResponse>(
      {} as SearchResponse,
    );
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
      const inspectHintMsg = 'Inspect details';
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
      ariaLabelledBy: 'Table',
      defaultColumns: tableDefaultColumns,
      renderColumns: wzDiscoverRenderColumns,
      results,
      indexPattern: dataSource?.indexPattern as IndexPattern,
      DocViewInspectButton,
      filters,
      setFilters,
    });

    const { pagination, sorting, columnVisibility } = dataGridProps;

    const onClickExportResults = async () => {
      const params = {
        indexPattern: dataSource?.indexPattern as IndexPattern,
        filters: fetchFilters,
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

    useEffect(() => {
      if (isDataSourceLoading) {
        return;
      }
      fetchData({ pagination, sorting, filters: [...fetchFilters] })
        .then(results => {
          setResults(results);
        })
        .catch(error => {
          const searchError = ErrorFactory.create(HttpError, {
            error,
            message: 'Error fetching data',
          });
          ErrorHandler.handleError(searchError);
        });
    }, [
      JSON.stringify(fetchFilters),
      JSON.stringify(query),
      JSON.stringify(pagination),
      JSON.stringify(sorting),
      fingerprint,
      isDataSourceLoading,
    ]);

    const closeFlyoutHandler = () => setInspectedHit(undefined);

    return (
      <IntlProvider locale='en'>
        <>
          <EuiPanel
            paddingSize='s'
            hasShadow={false}
            hasBorder={false}
            color='transparent'
          >
            {title && (
              <>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiTitle data-test-subj='wz-discovertitle' size='s'>
                      <h1>{title}</h1>
                    </EuiTitle>
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiSpacer size='s' />
              </>
            )}
            <div>
              <EuiDataGrid
                {...dataGridProps}
                className={sideNavDocked ? 'dataGridDockedNav' : ''}
                toolbarVisibility={{
                  showColumnSelector: { allowHide: false },
                  additionalControls: (
                    <>
                      <HitsCounter
                        hits={results?.hits?.total || 0}
                        showResetButton={false}
                        tooltip={
                          results?.hits?.total &&
                          results?.hits?.total > MAX_ENTRIES_PER_QUERY
                            ? {
                                ariaLabel: 'Info',
                                content: `The query results has exceeded the limit of ${formatNumWithCommas(
                                  MAX_ENTRIES_PER_QUERY,
                                )} hits. To provide a better experience the table only shows the first ${formatNumWithCommas(
                                  MAX_ENTRIES_PER_QUERY,
                                )} hits.`,
                                iconType: 'iInCircle',
                                position: 'top',
                              }
                            : undefined
                        }
                      />
                      <EuiButtonEmpty
                        disabled={
                          results?.hits?.total === 0 ||
                          !columnVisibility?.visibleColumns?.length
                        }
                        size='xs'
                        iconType='exportAction'
                        color='text'
                        isLoading={isExporting}
                        className='euiDataGrid__controlBtn'
                        onClick={onClickExportResults}
                      >
                        Export Formatted
                      </EuiButtonEmpty>

                      <DataGridVisibleColumnsSelector
                        availableColumns={dataGridProps.columnsAvailable}
                        columnVisibility={dataGridProps.columnVisibility}
                      />
                    </>
                  ),
                }}
              />
            </div>
          </EuiPanel>
          {inspectedHit && (
            <EuiFlyout onClose={closeFlyoutHandler} size='m'>
              <EuiFlyoutHeader>
                <EuiTitle>
                  <h2>{inspectDetailsTitle}</h2>
                </EuiTitle>
              </EuiFlyoutHeader>
              <EuiFlyoutBody>
                <EuiFlexGroup direction='column'>
                  <DocumentViewTableAndJson
                    document={inspectedHit}
                    indexPattern={dataSource?.indexPattern}
                    renderFields={getAllCustomRenders(
                      tableDefaultColumns,
                      wzDiscoverRenderColumns,
                    )}
                    filters={filters}
                    setFilters={setFilters}
                    onFilter={closeFlyoutHandler}
                    additionalTabs={additionalDocumentDetailsTabs}
                  />
                </EuiFlexGroup>
              </EuiFlyoutBody>
            </EuiFlyout>
          )}
        </>
      </IntlProvider>
    );
  },
);
