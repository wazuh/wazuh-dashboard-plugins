import React, { useState, useEffect } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { SearchResponse } from '../../../../../../../../src/core/server';
import { getPlugins } from '../../../../../kibana-services';

import useSearchBar from '../../../../common/search-bar/use-search-bar';
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
import {
  getKPIsConfig,
  getPanelsConfig,
  getTablesConfig,
} from './utils/dashboard-by-renderer-config';

const plugins = getPlugins();
const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

interface SCADashboardProps {
  indexPattern: IndexPattern;
}

const SCADashboardComponent: React.FC<SCADashboardProps> = ({
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
                  input={getKPIsConfig({
                    indexPatternId: indexPattern?.id,
                    fetchFilters,
                    dateRangeFrom: searchBarProps.dateRangeFrom,
                    dateRangeTo: searchBarProps.dateRangeTo,
                    query: searchBarProps.query,
                    fingerprint,
                  })}
                />
              </div>
              <div className='wz-dashboard-responsive wz-dashboard-hide-tables-pagination-export-csv-controls'>
                <DashboardByRenderer
                  input={getTablesConfig({
                    indexPatternId: indexPattern?.id,
                    fetchFilters,
                    dateRangeFrom: searchBarProps.dateRangeFrom,
                    dateRangeTo: searchBarProps.dateRangeTo,
                    query: searchBarProps.query,
                    fingerprint,
                  })}
                />
              </div>
              <div className='wz-dashboard-responsive wz-dashboard-hide-tables-pagination-export-csv-controls'>
                <DashboardByRenderer
                  input={getPanelsConfig({
                    indexPatternId: indexPattern?.id,
                    fetchFilters,
                    dateRangeFrom: searchBarProps.dateRangeFrom,
                    dateRangeTo: searchBarProps.dateRangeTo,
                    query: searchBarProps.query,
                    fingerprint,
                  })}
                />
              </div>
            </>
          )}
        </>
      </I18nProvider>
    </>
  );
};

export const SCADashboard = compose(withErrorBoundary)(SCADashboardComponent);
