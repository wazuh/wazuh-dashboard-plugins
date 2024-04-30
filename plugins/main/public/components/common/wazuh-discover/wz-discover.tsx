import React, { useState, useMemo, useEffect } from 'react';
import {
  EuiDataGrid,
  EuiPageTemplate,
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
  EuiSpacer,
  EuiPanel,
} from '@elastic/eui';
import { IntlProvider } from 'react-intl';
import { IndexPattern } from '../../../../../../src/plugins/data/common';
import { SearchResponse } from '../../../../../../src/core/server';
import { useDocViewer } from '../doc-viewer';
import DocViewer from '../doc-viewer/doc-viewer';
import { DiscoverNoResults } from '../no-results/no-results';
import { LoadingSpinner } from '../loading-spinner/loading-spinner';
import { useDataGrid, tDataGridColumn, exportSearchToCSV } from '../data-grid';
import {
  ErrorHandler,
  ErrorFactory,
  HttpError,
} from '../../../react-services/error-management';
import { HitsCounter } from '../../../kibana-integrations/discover/application/components/hits_counter';
import { formatNumWithCommas } from '../../../kibana-integrations/discover/application/helpers';
import useSearchBar from '../search-bar/use-search-bar';
import { getPlugins } from '../../../kibana-services';
import { histogramChartInput } from './config/histogram-chart';
import { getWazuhCorePlugin } from '../../../kibana-services';
const DashboardByRenderer =
  getPlugins().dashboard.DashboardContainerByValueRenderer;
import './discover.scss';
import { withErrorBoundary } from '../hocs';
import {
  IDataSourceFactoryConstructor,
  useDataSource,
  tParsedIndexPattern,
  PatternDataSource,
  AlertsDataSourceRepository,
} from '../data-source';

export const MAX_ENTRIES_PER_QUERY = 10000;

export type WazuhDiscoverProps = {
  tableColumns: tDataGridColumn[];
  DataSource: IDataSourceFactoryConstructor<PatternDataSource>;
};

const WazuhDiscoverComponent = (props: WazuhDiscoverProps) => {
  const { DataSource, tableColumns: defaultTableColumns } = props;

  if (!DataSource) {
    throw new Error('DataSource is required');
  }

  const SearchBar = getPlugins().data.ui.SearchBar;
  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);
  const [inspectedHit, setInspectedHit] = useState<any>(undefined);
  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(
    undefined,
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const sideNavDocked = getWazuhCorePlugin().hooks.useDockedSideNav();

  const {
    dataSource,
    filters,
    fetchFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    repository: new AlertsDataSourceRepository(), // this makes only works with alerts index pattern
    DataSource,
  });

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

  const { searchBarProps } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });
  const { query, dateRangeFrom, dateRangeTo } = searchBarProps;

  const dataGridProps = useDataGrid({
    ariaLabelledBy: 'Discover events table',
    defaultColumns: defaultTableColumns,
    results,
    indexPattern: indexPattern as IndexPattern,
    DocViewInspectButton,
    pagination: {
      pageIndex: 0,
      pageSize: 15,
      pageSizeOptions: [15, 25, 50, 100],
    },
  });

  const { pagination, sorting, columnVisibility } = dataGridProps;

  const docViewerProps = useDocViewer({
    doc: inspectedHit,
    indexPattern: indexPattern as IndexPattern,
  });

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    setIndexPattern(dataSource?.indexPattern);
    fetchData({
      query,
      pagination,
      sorting,
      dateRange: { from: dateRangeFrom || '', to: dateRangeTo || '' },
    })
      .then(results => {
        setResults(results);
      })
      .catch(error => {
        const searchError = ErrorFactory.create(HttpError, {
          error,
          message: 'Error fetching vulnerabilities',
        });
        ErrorHandler.handleError(searchError);
      });
  }, [
    JSON.stringify(fetchFilters),
    JSON.stringify(query),
    JSON.stringify(pagination),
    JSON.stringify(sorting),
    dateRangeFrom,
    dateRangeTo,
  ]);

  const timeField = indexPattern?.timeFieldName
    ? indexPattern.timeFieldName
    : undefined;

  const onClickExportResults = async () => {
    const params = {
      indexPattern: indexPattern as IndexPattern,
      fetchFilters,
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
    <IntlProvider locale='en'>
      <EuiPageTemplate
        className='discoverContainer'
        restrictWidth='100%'
        fullHeight={true}
        grow
      >
        <>
          {isDataSourceLoading ? (
            <LoadingSpinner />
          ) : (
            <div className='wz-discover hide-filter-control wz-search-bar'>
              <SearchBar
                appName='wazuh-discover-search-bar'
                {...searchBarProps}
                showQueryInput={true}
                showQueryBar={true}
                showSaveQuery={true}
              />
            </div>
          )}
          {!isDataSourceLoading && results?.hits?.total === 0 ? (
            <DiscoverNoResults timeFieldName={timeField} queryLanguage={''} />
          ) : null}
          {!isDataSourceLoading && dataSource && results?.hits?.total > 0 ? (
            <>
              <EuiFlexItem grow={false} className='discoverChartContainer'>
                <EuiPanel
                  hasBorder={false}
                  hasShadow={false}
                  color='transparent'
                  paddingSize='none'
                >
                  <EuiPanel>
                    <DashboardByRenderer
                      input={histogramChartInput(
                        dataSource?.title,
                        fetchFilters,
                        query,
                        dateRangeFrom,
                        dateRangeTo,
                      )}
                    />
                  </EuiPanel>
                </EuiPanel>
              </EuiFlexItem>
              <EuiSpacer size='m' />
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
              </div>
            </>
          ) : null}
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
      </EuiPageTemplate>
    </IntlProvider>
  );
};

export const WazuhDiscover = withErrorBoundary(WazuhDiscoverComponent);
