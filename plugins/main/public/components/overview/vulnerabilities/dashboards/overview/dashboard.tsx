import React, { useState, useEffect, useMemo } from 'react';
import { SearchResponse } from '../../../../../../../../src/core/server';
import { getPlugins } from '../../../../../kibana-services';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../../common/search-bar/use-search-bar';
import { getDashboardFilters } from './dashboard_panels_filters';
import './vulnerability_detector_filters.scss';
import { getKPIsPanel } from './dashboard_panels_kpis';
import { withErrorBoundary } from '../../../../common/hocs';
import { DiscoverNoResults } from '../../common/components/no_results';
import { LoadingSpinner } from '../../common/components/loading_spinner';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../../react-services/error-management';
import { compose } from 'redux';
import { withVulnerabilitiesStateDataSource } from '../../common/hocs/validate-vulnerabilities-states-index-pattern';
import { ModuleEnabledCheck } from '../../common/components/check-module-enabled';

import {
  VulnerabilitiesDataSourceRepository,
  VulnerabilitiesDataSource,
  PatternDataSource,
  tParsedIndexPattern
} from '../../../../common/data-source';
import { useDataSource } from '../../../../common/data-source/hooks';
import { IndexPattern } from '../../../../../../../../src/plugins/data/public';

const plugins = getPlugins();
const SearchBar = getPlugins().data.ui.SearchBar;
const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

/* The vulnerabilities dashboard is made up of 3 dashboards because the filters need
a wrapper for visual adjustments, while the Kpi, the Open vs Close visualization and
the rest of the visualizations have different configurations at the dashboard level. */

const DashboardVulsComponent: React.FC = () => {
  const {
    filters,
    dataSource,
    fetchFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: VulnerabilitiesDataSource,
    repository: new VulnerabilitiesDataSourceRepository(),
  });

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  const { searchBarProps } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });
  const { query } = searchBarProps;

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    fetchData({ query }).then(results => {
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
  ])

  return (
    <>
      <I18nProvider>
        <>
          <ModuleEnabledCheck />
          {
            isDataSourceLoading && !dataSource ?
              <LoadingSpinner /> : 
              <div className="wz-search-bar">
                <SearchBar
                  appName='vulnerability-detector-searchbar'
                  {...searchBarProps}
                  showDatePicker={false}
                  showQueryInput={true}
                  showQueryBar={true}
                />
              </div>
          }
          {dataSource && results?.hits?.total === 0 ? (
            <DiscoverNoResults />
          ) : null}
          {dataSource && results?.hits?.total > 0 ? (
            <div className='vulnerability-dashboard-responsive'>
              <DashboardByRenderer
                input={{
                  viewMode: ViewMode.VIEW,
                  panels: getKPIsPanel(dataSource?.id),
                  isFullScreenMode: false,
                  filters: fetchFilters ?? [],
                  useMargins: true,
                  id: 'kpis-vulnerability-detector-dashboard-tab',
                  timeRange: {
                    from: searchBarProps.dateRangeFrom,
                    to: searchBarProps.dateRangeTo,
                  },
                  title: 'KPIs Vulnerability detector dashboard',
                  description: 'KPIs Dashboard of the Vulnerability detector',
                  query: searchBarProps.query,
                  refreshConfig: {
                    pause: false,
                    value: 15,
                  },
                  hidePanelTitles: true,
                }}
              />
              <div className='vulnerability-dashboard-filters-wrapper'>
                <DashboardByRenderer
                  input={{
                    viewMode: ViewMode.VIEW,
                    panels: getDashboardFilters(dataSource?.id),
                    isFullScreenMode: false,
                    filters: fetchFilters ?? [],
                    useMargins: false,
                    id: 'vulnerability-detector-dashboard-tab-filters',
                    timeRange: {
                      from: searchBarProps.dateRangeFrom,
                      to: searchBarProps.dateRangeTo,
                    },
                    title: 'Vulnerability detector dashboard filters',
                    description:
                      'Dashboard of the Vulnerability detector filters',
                    query: searchBarProps.query,
                    refreshConfig: {
                      pause: false,
                      value: 15,
                    },
                    hidePanelTitles: true,
                  }}
                />
              </div>
              <DashboardByRenderer
                input={{
                  viewMode: ViewMode.VIEW,
                  panels: getDashboardPanels(dataSource?.id),
                  isFullScreenMode: false,
                  filters: fetchFilters ?? [],
                  useMargins: true,
                  id: 'vulnerability-detector-dashboard-tab',
                  timeRange: {
                    from: searchBarProps.dateRangeFrom,
                    to: searchBarProps.dateRangeTo,
                  },
                  title: 'Vulnerability detector dashboard',
                  description: 'Dashboard of the Vulnerability detector',
                  query: searchBarProps.query,
                  refreshConfig: {
                    pause: false,
                    value: 15,
                  },
                  hidePanelTitles: false,
                }}
              />
            </div>
          ) : null}
        </>
      </I18nProvider>
    </>
  );
};

export const DashboardVuls = compose(
  withErrorBoundary,
  withVulnerabilitiesStateDataSource,
)(DashboardVulsComponent);
