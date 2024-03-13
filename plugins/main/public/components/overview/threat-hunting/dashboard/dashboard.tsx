import React, { useState, useEffect, useMemo } from 'react';
import { getPlugins, getWazuhCorePlugin } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { SearchResponse } from '../../../../../../../src/core/server';
import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { WAZUH_ALERTS_PATTERN } from '../../../../../common/constants';
import { getKPIsPanel } from './dashboard_panels_kpis';
import { Filter } from '../../../../../../../src/plugins/data/common';
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
import { search } from '../../../common/search-bar/search-bar-service';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import { LoadingSpinner } from '../../vulnerabilities/common/components/loading_spinner';
import { DiscoverNoResults } from '../components/no_results';
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
} from '../config';

const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

interface DashboardThreatHuntingProps {
  pinnedAgent: Filter;
}

const DashboardTH: React.FC<DashboardThreatHuntingProps> = ({
  pinnedAgent,
}) => {
  /* TODO: Analyze whether to use the new index pattern handler https://github.com/wazuh/wazuh-dashboard-plugins/issues/6434
  Replace WAZUH_ALERTS_PATTERN with appState.getCurrentPattern... */
  const TH_INDEX_PATTERN_ID = WAZUH_ALERTS_PATTERN;

  const { searchBarProps } = useSearchBar({
    defaultIndexPatternID: TH_INDEX_PATTERN_ID,
  });

  const { isLoading, query, indexPatterns } = searchBarProps;
  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(
    undefined,
  );
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [inspectedHit, setInspectedHit] = useState<any>(undefined);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

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
    indexPattern: indexPattern as IndexPattern,
    DocViewInspectButton,
  });

  const { pagination, sorting, columnVisibility } = dataGridProps;

  const docViewerProps = useDocViewer({
    doc: inspectedHit,
    indexPattern: indexPattern as IndexPattern,
  });

  useEffect(() => {
    const currentColumns = !pinnedAgent
      ? threatHuntingTableDefaultColumns
      : threatHuntingTableAgentColumns;
    columnVisibility.setVisibleColumns(currentColumns.map(({ id }) => id));
  }, [pinnedAgent]);

  useEffect(() => {
    if (!isLoading) {
      setIndexPattern(indexPatterns?.[0] as IndexPattern);
      search({
        indexPattern: indexPatterns?.[0] as IndexPattern,
        filters: searchBarProps.filters ?? [],
        query,
        pagination,
        sorting,
      })
        .then(results => {
          setResults(results);
          setIsSearching(false);
        })
        .catch(error => {
          const searchError = ErrorFactory.create(HttpError, {
            error,
            message: 'Error fetching vulnerabilities',
          });
          ErrorHandler.handleError(searchError);
          setIsSearching(false);
        });
    }
  }, [
    JSON.stringify(searchBarProps),
    JSON.stringify(pagination),
    JSON.stringify(sorting),
  ]);

  const onClickExportResults = async () => {
    const params = {
      indexPattern: indexPatterns?.[0] as IndexPattern,
      filters: searchBarProps.filters ?? [],
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
      <I18nProvider>
        {isLoading ? <LoadingSpinner /> : null}
        {!isLoading ? (
          <SearchBar
            appName='th-searchbar'
            {...searchBarProps}
            showDatePicker={true}
            showQueryInput={true}
            showQueryBar={true}
          />
        ) : null}
        {isSearching ? <LoadingSpinner /> : null}
        <SampleDataWarning />
        {!isLoading && !isSearching && results?.hits?.total === 0 ? (
          <DiscoverNoResults />
        ) : null}
        {!isLoading && !isSearching && results?.hits?.total > 0 ? (
          <div className='th-dashboard-responsive'>
            <DashboardByRenderer
              input={{
                viewMode: ViewMode.VIEW,
                panels: getKPIsPanel(TH_INDEX_PATTERN_ID),
                isFullScreenMode: false,
                filters: searchBarProps.filters ?? [],
                useMargins: true,
                id: 'kpis-th-dashboard-tab',
                timeRange: {
                  from: searchBarProps.dateRangeFrom,
                  to: searchBarProps.dateRangeTo,
                },
                title: 'KPIs Threat Hunting dashboard',
                description: 'KPIs Dashboard of the Threat Hunting',
                query: searchBarProps.query,
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
                panels: getDashboardPanels(TH_INDEX_PATTERN_ID, !!pinnedAgent),
                isFullScreenMode: false,
                filters: searchBarProps.filters ?? [],
                useMargins: true,
                id: 'th-dashboard-tab',
                timeRange: {
                  from: searchBarProps.dateRangeFrom,
                  to: searchBarProps.dateRangeTo,
                },
                title: 'Threat Hunting dashboard',
                description: 'Dashboard of the Threat Hunting',
                query: searchBarProps.query,
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
        ) : null}
      </I18nProvider>
    </>
  );
};

export const DashboardThreatHunting = withErrorBoundary(DashboardTH);
