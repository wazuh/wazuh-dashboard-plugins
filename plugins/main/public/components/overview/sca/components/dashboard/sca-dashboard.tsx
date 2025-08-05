import React, { useState, useEffect } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { SearchResponse } from '../../../../../../../../src/core/server';
import { getPlugins } from '../../../../../kibana-services';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';

import useSearchBar from '../../../../common/search-bar/use-search-bar';
import { getKPIsPanel } from './utils/dashboard-kpis';
import { getDashboardTables } from './utils/dashboard-tables';
import { getDashboardPanels } from './utils/dashboard-panels';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../../react-services/error-management';
import { compose } from 'redux';
import { useDataSource } from '../../../../common/data-source/hooks';
import { IndexPattern } from '../../../../../../../../src/plugins/data/public';
import { WzSearchBar } from '../../../../common/search-bar';
import { SampleDataWarning } from '../../../../visualize/components';
import { WAZUH_SAMPLE_SECURITY_CONFIGURATION_ASSESSMENT } from '../../../../../../common/constants';
import {
  PromptErrorInitializatingDataSource,
  withErrorBoundary,
} from '../../../../common/hocs';
import {
  SCAStatesDataSource,
  SCAStatesDataSourceRepository,
} from '../../../../common/data-source/pattern/sca';
import {
  PatternDataSource,
  tParsedIndexPattern,
} from '../../../../common/data-source';
import { DiscoverNoResults } from '../../../../common/no-results/no-results';
import { LoadingSearchbarProgress } from '../../../../common/loading-searchbar-progress/loading-searchbar-progress';

const plugins = getPlugins();
const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

interface DashboardSCAProps {
  indexPattern: IndexPattern;
}

const DashboardSCAComponent: React.FC<DashboardSCAProps> = ({
  indexPattern,
}) => {
  const {
    filters,
    dataSource,
    fetchFilters,
    fixedFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
    error,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: SCAStatesDataSource,
    repository: new SCAStatesDataSourceRepository(),
  });

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  const { searchBarProps, fingerprint } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    fetchData({ query: searchBarProps.query })
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
    JSON.stringify(searchBarProps.query),
    isDataSourceLoading,
  ]);

  if (error) {
    return <PromptErrorInitializatingDataSource error={error} />;
  }

  return (
    <>
      <I18nProvider>
        <>
          {isDataSourceLoading && !dataSource ? (
            <LoadingSearchbarProgress />
          ) : (
            <>
              <WzSearchBar
                appName='sca-dashboard-searchbar'
                {...searchBarProps}
                filters={filters}
                fixedFilters={fixedFilters}
                showDatePicker={false}
                showQueryInput={true}
                showQueryBar={true}
                showSaveQuery={true}
              />
              <SampleDataWarning
                categoriesSampleData={[
                  WAZUH_SAMPLE_SECURITY_CONFIGURATION_ASSESSMENT,
                ]}
              />
              {dataSource && results?.hits?.total === 0 ? (
                <DiscoverNoResults />
              ) : null}
              <div
                className={`wz-dashboard-responsive wz-dashboard-metrics ${
                  dataSource && results?.hits?.total > 0 ? '' : 'wz-no-display'
                }`}
              >
                <DashboardByRenderer
                  input={{
                    viewMode: ViewMode.VIEW,
                    panels: getKPIsPanel(indexPattern?.id),
                    isFullScreenMode: false,
                    filters: fetchFilters ?? [],
                    useMargins: true,
                    id: 'security-configuration-assessment-kpis',
                    timeRange: {
                      from: searchBarProps.dateRangeFrom,
                      to: searchBarProps.dateRangeTo,
                    },
                    title: 'Security Configuration Assessment dashboard KPIs',
                    description: 'Dashboard of the SCA KPIs',
                    query: searchBarProps.query,
                    refreshConfig: {
                      pause: false,
                      value: 15,
                    },
                    hidePanelTitles: true,
                    lastReloadRequestTime: fingerprint,
                  }}
                />
              </div>
              <div className='wz-dashboard-responsive wz-dashboard-hide-tables-pagination-export-csv-controls'>
                <DashboardByRenderer
                  input={{
                    viewMode: ViewMode.VIEW,
                    // Try to use the index pattern that the dataSource has
                    // but if it is undefined use the index pattern of the hoc
                    // because the first executions of the dataSource are undefined
                    // and embeddables need index pattern.
                    panels: getDashboardTables(
                      dataSource?.id || indexPattern?.id,
                    ),
                    isFullScreenMode: false,
                    filters: fetchFilters ?? [],
                    useMargins: false,
                    id: 'security-configuration-assessment-filters',
                    timeRange: {
                      from: searchBarProps.dateRangeFrom,
                      to: searchBarProps.dateRangeTo,
                    },
                    title: 'IT Hygiene dashboard filters',
                    description: 'Dashboard of the IT Hygiene filters',
                    query: searchBarProps.query,
                    refreshConfig: {
                      pause: false,
                      value: 15,
                    },
                    hidePanelTitles: true,
                    lastReloadRequestTime: fingerprint,
                  }}
                />
              </div>
              <div className='wz-dashboard-responsive wz-dashboard-hide-tables-pagination-export-csv-controls'>
                <DashboardByRenderer
                  input={{
                    viewMode: ViewMode.VIEW,
                    panels: getDashboardPanels(indexPattern?.id),
                    isFullScreenMode: false,
                    filters: fetchFilters ?? [],
                    useMargins: true,
                    id: 'security-configuration-assessment-panels',
                    timeRange: {
                      from: searchBarProps.dateRangeFrom,
                      to: searchBarProps.dateRangeTo,
                    },
                    title: 'Security Configuration Assessment dashboard panels',
                    description: 'Dashboard of the SCA panels',
                    query: searchBarProps.query,
                    refreshConfig: {
                      pause: false,
                      value: 15,
                    },
                    hidePanelTitles: false,
                    lastReloadRequestTime: fingerprint,
                  }}
                />
              </div>
            </>
          )}
        </>
      </I18nProvider>
    </>
  );
};

export const DashboardSCA = compose(withErrorBoundary)(DashboardSCAComponent);
