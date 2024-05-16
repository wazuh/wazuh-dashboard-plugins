import React, { useState, useEffect, useMemo } from 'react';
import { getPlugins, getWazuhCorePlugin } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { SearchResponse } from '../../../../../../../src/core/server';
import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { getKPIsPanel } from './dashboard_panels_kpis';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiDataGrid,
  EuiToolTip,
  EuiDataGridCellValueElementProps,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiTitle,
  EuiButtonEmpty,
} from '@elastic/eui';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import {
  MAX_ENTRIES_PER_QUERY,
  exportSearchToCSV,
} from '../../../common/data-grid/data-grid-service';
import { useDocViewer } from '../../../common/doc-viewer/use-doc-viewer';
import { useDataGrid } from '../../../common/data-grid/use-data-grid';
import { HitsCounter } from '../../../../kibana-integrations/discover/application/components/hits_counter/hits_counter';
import { formatNumWithCommas } from '../../../../kibana-integrations/discover/application/helpers/format_number_with_commas';
import DocViewer from '../../../common/doc-viewer/doc-viewer';
import { withErrorBoundary } from '../../../common/hocs/error-boundary/with-error-boundary';
import './threat_hunting_dashboard.scss';
import { SampleDataWarning } from '../../../visualize/components/sample-data-warning';
import {
  threatHuntingTableAgentColumns,
  threatHuntingTableDefaultColumns,
} from '../events/threat-hunting-columns';
import {
  AlertsDataSource,
  AlertsDataSourceRepository,
  PatternDataSource,
  PatternDataSourceFilterManager,
  tParsedIndexPattern,
  useDataSource,
} from '../../../common/data-source';
import { DiscoverNoResults } from '../../../common/no-results/no-results';
import { LoadingSpinner } from '../../../common/loading-spinner/loading-spinner';
import { useReportingCommunicateSearchContext } from '../../../common/hooks/use-reporting-communicate-search-context';

const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

const DashboardTH: React.FC = () => {
  const {
    filters,
    dataSource,
    fetchFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: AlertsDataSource,
    repository: new AlertsDataSourceRepository(),
  });

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  const { searchBarProps } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });
  const { query, dateRangeFrom, dateRangeTo } = searchBarProps;

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
    ariaLabelledBy: 'Threat Hunting Table',
    defaultColumns: threatHuntingTableDefaultColumns,
    results,
    indexPattern: dataSource?.indexPattern,
    DocViewInspectButton,
  });

  const { pagination, sorting, columnVisibility } = dataGridProps;

  const docViewerProps = useDocViewer({
    doc: inspectedHit,
    indexPattern: dataSource?.indexPattern,
  });

  const pinnedAgent =
    PatternDataSourceFilterManager.getPinnedAgentFilter(dataSource?.id!)
      .length > 0;

  useEffect(() => {
    const currentColumns = !pinnedAgent
      ? threatHuntingTableDefaultColumns
      : threatHuntingTableAgentColumns;
    columnVisibility.setVisibleColumns(currentColumns.map(({ id }) => id));
  }, [pinnedAgent]);

  useReportingCommunicateSearchContext({
    isSearching: isDataSourceLoading,
    totalResults: results?.hits?.total ?? 0,
    indexPattern: dataSource?.indexPattern,
    filters: fetchFilters,
    query: query,
    time: {
      from: dateRangeFrom,
      to: dateRangeTo,
    },
  });

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    fetchData({
      query,
      pagination,
      sorting,
      dateRange: {
        from: dateRangeFrom,
        to: dateRangeTo,
      },
    })
      .then(results => {
        setResults(results);
      })
      .catch(error => {
        const searchError = ErrorFactory.create(HttpError, {
          error,
          message: 'Error fetching threat hunting',
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

  const onClickExportResults = async () => {
    const params = {
      indexPattern: dataSource?.indexPattern,
      filters: fetchFilters ?? [],
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
    <I18nProvider>
      <>
        {isDataSourceLoading && !dataSource ? (
          <LoadingSpinner />
        ) : (
          <div className='wz-search-bar hide-filter-control'>
            <SearchBar
              appName='th-searchbar'
              {...searchBarProps}
              showDatePicker={true}
              showQueryInput={true}
              showQueryBar={true}
              showSaveQuery={true}
            />
          </div>
        )}
        {!isDataSourceLoading && dataSource && results?.hits?.total === 0 ? (
          <DiscoverNoResults />
        ) : null}
        {!isDataSourceLoading && dataSource && results?.hits?.total > 0 ? (
          <>
            <SampleDataWarning />
            <div className='th-dashboard-responsive'>
              <DashboardByRenderer
                input={{
                  viewMode: ViewMode.VIEW,
                  panels: getKPIsPanel(dataSource?.id),
                  isFullScreenMode: false,
                  filters: fetchFilters ?? [],
                  useMargins: true,
                  id: 'kpis-th-dashboard-tab',
                  timeRange: {
                    from: dateRangeFrom,
                    to: dateRangeTo,
                  },
                  title: 'KPIs Threat Hunting dashboard',
                  description: 'KPIs Dashboard of the Threat Hunting',
                  query: query,
                  refreshConfig: {
                    pause: false,
                    value: 15,
                  },
                  hidePanelTitles: true,
                }}
              />
              <DashboardByRenderer
                input={{
                  viewMode: ViewMode.VIEW,
                  panels: getDashboardPanels(dataSource?.id, pinnedAgent),
                  isFullScreenMode: false,
                  filters: fetchFilters ?? [],
                  useMargins: true,
                  id: 'th-dashboard-tab',
                  timeRange: {
                    from: dateRangeFrom,
                    to: dateRangeTo,
                  },
                  title: 'Threat Hunting dashboard',
                  description: 'Dashboard of the Threat Hunting',
                  query: query,
                  refreshConfig: {
                    pause: false,
                    value: 15,
                  },
                  hidePanelTitles: false,
                }}
              />
              <EuiDataGrid
                {...dataGridProps}
                className={sideNavDocked ? 'dataGridDockedNav' : ''}
                toolbarVisibility={{
                  additionalControls: (
                    <>
                      <HitsCounter
                        hits={results?.hits?.total}
                        showResetButton={false}
                        onResetQuery={() => {}}
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
                          !columnVisibility?.visibleColumns?.length
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
              {inspectedHit && (
                <EuiFlyout onClose={() => setInspectedHit(undefined)} size='m'>
                  <EuiFlyoutHeader>
                    <EuiTitle>
                      <h2>Document details</h2>
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
            </div>
          </>
        ) : null}
      </>
    </I18nProvider>
  );
};

export const DashboardThreatHunting = withErrorBoundary(DashboardTH);
