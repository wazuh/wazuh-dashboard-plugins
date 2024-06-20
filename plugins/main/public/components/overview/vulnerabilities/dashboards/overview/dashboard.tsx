import React, { useState, useEffect } from 'react';
import { SearchResponse } from '../../../../../../../../src/core/server';
import { getPlugins } from '../../../../../kibana-services';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBarConfiguration from '../../search_bar/use_search_bar_configuration';
import { getDashboardFilters } from './dashboard_panels_filters';
import './vulnerability_detector_filters.scss';
import { getKPIsPanel } from './dashboard_panels_kpis';
import { useAppConfig } from '../../../../common/hooks';
import { withErrorBoundary } from '../../../../common/hocs';
import { DiscoverNoResults } from '../../common/components/no_results';
import { LoadingSpinner } from '../../common/components/loading_spinner';
import {
  vulnerabilityIndexFiltersAdapter,
  restorePrevIndexFiltersAdapter,
  onUpdateAdapter,
  updateFiltersStorage,
} from '../../common/vulnerability_detector_adapters';
import { search } from '../inventory/inventory_service';
import { IndexPattern } from '../../../../../../../../src/plugins/data/common';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../../react-services/error-management';
import { compose } from 'redux';
import { withVulnerabilitiesStateDataSource } from '../../common/hocs/validate-vulnerabilities-states-index-pattern';
import { ModuleEnabledCheck } from '../../common/components/check-module-enabled';
import { DataSourceFilterManagerVulnerabilitiesStates } from '../../../../../react-services/data-sources';
import { DashboardContainerInput } from '../../../../../../../../src/plugins/dashboard/public';

const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

/* The vulnerabilities dashboard is made up of 3 dashboards because the filters need
a wrapper for visual adjustments, while the Kpi, the Open vs Close visualization and
the rest of the visualizations have different configurations at the dashboard level. */

const DashboardVulsComponent: React.FC = () => {
  const appConfig = useAppConfig();
  const VULNERABILITIES_INDEX_PATTERN_ID =
    appConfig.data['vulnerabilities.pattern'];
  const { searchBarProps } = useSearchBarConfiguration({
    defaultIndexPatternID: VULNERABILITIES_INDEX_PATTERN_ID,
    onMount: vulnerabilityIndexFiltersAdapter,
    onUpdate: onUpdateAdapter,
    onUnMount: restorePrevIndexFiltersAdapter,
  });

  /* This function is responsible for updating the storage filters so that the
  filters between dashboard and inventory added using visualizations call to actions.
  Without this feature, filters added using visualizations call to actions are
  not maintained between dashboard and inventory tabs */
  const handleFilterByVisualization = (newInput: DashboardContainerInput) => {
    updateFiltersStorage(newInput.filters);
  };

  const fetchFilters = DataSourceFilterManagerVulnerabilitiesStates.getFilters(
    searchBarProps.filters,
    VULNERABILITIES_INDEX_PATTERN_ID,
  );

  const { isLoading, query, indexPatterns } = searchBarProps;

  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  useEffect(() => {
    if (!isLoading) {
      search({
        indexPattern: indexPatterns?.[0] as IndexPattern,
        filters: fetchFilters,
        query,
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
  }, [JSON.stringify(searchBarProps), JSON.stringify(fetchFilters)]);

  return (
    <>
      <I18nProvider>
        <>
          <ModuleEnabledCheck />
          {isLoading ? <LoadingSpinner /> : null}
          {!isLoading ? (
            <div className='wz-search-bar hide-filter-control'>
              <SearchBar
                appName='vulnerability-detector-searchbar'
                {...searchBarProps}
                showDatePicker={false}
                showQueryInput={true}
                showQueryBar={true}
              />
            </div>
          ) : null}
          {isSearching ? <LoadingSpinner /> : null}
          {!isLoading && !isSearching && results?.hits?.total === 0 ? (
            <DiscoverNoResults />
          ) : null}
          {!isLoading && !isSearching && results?.hits?.total > 0 ? (
            <div className='vulnerability-dashboard-responsive vulnerability-dashboard-metrics'>
              <DashboardByRenderer
                input={{
                  viewMode: ViewMode.VIEW,
                  panels: getKPIsPanel(VULNERABILITIES_INDEX_PATTERN_ID),
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
                onInputUpdated={handleFilterByVisualization}
              />
              <div className='vulnerability-dashboard-filters-wrapper'>
                <DashboardByRenderer
                  input={{
                    viewMode: ViewMode.VIEW,
                    panels: getDashboardFilters(
                      VULNERABILITIES_INDEX_PATTERN_ID,
                    ),
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
                  onInputUpdated={handleFilterByVisualization}
                />
              </div>
              <DashboardByRenderer
                input={{
                  viewMode: ViewMode.VIEW,
                  panels: getDashboardPanels(VULNERABILITIES_INDEX_PATTERN_ID),
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
                onInputUpdated={handleFilterByVisualization}
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
