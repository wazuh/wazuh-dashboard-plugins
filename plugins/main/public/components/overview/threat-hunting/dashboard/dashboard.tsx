import React, { useState, useEffect } from 'react';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { SearchResponse } from '../../../../../../../src/core/server';
import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { getKPIsPanel } from './dashboard_panels_kpis';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import { withErrorBoundary } from '../../../common/hocs/error-boundary/with-error-boundary';
import './threat_hunting_dashboard.scss';
import { SampleDataWarning } from '../../../visualize/components/sample-data-warning';
import {
  AlertsDataSourceRepository,
  ThreatHuntingDataSource,
  PatternDataSource,
  PatternDataSourceFilterManager,
  tParsedIndexPattern,
  useDataSource,
} from '../../../common/data-source';
import { DiscoverNoResults } from '../../../common/no-results/no-results';
import { LoadingSearchbarProgress } from '../../../common/loading-searchbar-progress/loading-searchbar-progress';
import { useReportingCommunicateSearchContext } from '../../../common/hooks/use-reporting-communicate-search-context';
import { WzSearchBar } from '../../../common/search-bar';
import {
  WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
  WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
} from '../../../../../common/constants';

const plugins = getPlugins();

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

const DashboardTH: React.FC = () => {
  const AlertsRepository = new AlertsDataSourceRepository();
  const {
    filters,
    dataSource,
    fetchFilters,
    fixedFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: ThreatHuntingDataSource,
    repository: AlertsRepository,
  });
  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  const { searchBarProps, fingerprint, autoRefreshFingerprint } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });
  const { query, dateRangeFrom, dateRangeTo } = searchBarProps;
  const pinnedAgent =
    PatternDataSourceFilterManager.getPinnedAgentFilter(dataSource?.id!)
      .length > 0;

  useReportingCommunicateSearchContext({
    isSearching: isDataSourceLoading,
    totalResults: results?.hits?.total ?? 0,
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters: fetchFilters,
    query: query,
    time: { from: dateRangeFrom, to: dateRangeTo },
  });

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    fetchData({
      query,
      dateRange: { from: dateRangeFrom, to: dateRangeTo },
    })
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
    dateRangeFrom,
    dateRangeTo,
    autoRefreshFingerprint,
    fingerprint,
  ]);

  return (
    <I18nProvider>
      {isDataSourceLoading && !dataSource ? (
        <LoadingSearchbarProgress />
      ) : (
        <>
          <WzSearchBar
            appName='th-searchbar'
            {...searchBarProps}
            fixedFilters={fixedFilters}
            showDatePicker={true}
            showQueryInput={true}
            showQueryBar={true}
            showSaveQuery={true}
          />
          {!isDataSourceLoading && dataSource && results?.hits?.total === 0 ? (
            <DiscoverNoResults />
          ) : null}
          <div
            className={`th-container ${
              !isDataSourceLoading && dataSource && results?.hits?.total > 0
                ? ''
                : 'wz-no-display'
            }`}
          >
            <SampleDataWarning
              categoriesSampleData={[
                WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
                WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING,
                WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
              ]}
            />
            <div className='th-dashboard-responsive'>
              <DashboardByRenderer
                input={{
                  viewMode: ViewMode.VIEW,
                  panels: getKPIsPanel(
                    AlertsRepository.getStoreIndexPatternId(),
                  ),
                  isFullScreenMode: false,
                  filters: fetchFilters ?? [],
                  useMargins: true,
                  id: 'kpis-th-dashboard-tab',
                  timeRange: { from: dateRangeFrom, to: dateRangeTo },
                  title: 'KPIs Threat Hunting dashboard',
                  description: 'KPIs Dashboard of the Threat Hunting',
                  query: query,
                  refreshConfig: {
                    pause: false,
                    value: 15,
                  },
                  hidePanelTitles: true,
                  lastReloadRequestTime: fingerprint,
                }}
              />
              <DashboardByRenderer
                input={{
                  viewMode: ViewMode.VIEW,
                  panels: getDashboardPanels(
                    AlertsRepository.getStoreIndexPatternId(),
                    pinnedAgent,
                  ),
                  isFullScreenMode: false,
                  filters: fetchFilters ?? [],
                  useMargins: true,
                  id: 'th-dashboard-tab',
                  timeRange: { from: dateRangeFrom, to: dateRangeTo },
                  title: 'Threat Hunting dashboard',
                  description: 'Dashboard of the Threat Hunting',
                  query: query,
                  refreshConfig: {
                    pause: false,
                    value: 15,
                  },
                  hidePanelTitles: false,
                  lastReloadRequestTime: fingerprint,
                }}
              />
            </div>
          </div>
        </>
      )}
    </I18nProvider>
  );
};

export const DashboardThreatHunting = withErrorBoundary(DashboardTH);
