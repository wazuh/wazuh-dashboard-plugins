import React, { useState, useEffect, useCallback } from 'react';
import { SearchResponse } from '../../../../../../../../src/core/server';
import { getPlugins } from '../../../../../kibana-services';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../../common/search-bar/use-search-bar';
import { getDashboardFilters } from './dashboard_panels_filters';
import './vulnerability_detector_filters.scss';
import { getKPIsPanel } from './dashboard_panels_kpis';
import {
  HideOnErrorInitializatingDataSource,
  PromptErrorInitializatingDataSource,
  withErrorBoundary,
} from '../../../../common/hocs';
import { DiscoverNoResults } from '../../common/components/no_results';
import { LoadingSearchbarProgress } from '../../../../../../public/components/common/loading-searchbar-progress/loading-searchbar-progress';
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
  tParsedIndexPattern,
  PatternDataSourceFilterManager,
  FILTER_OPERATOR,
} from '../../../../common/data-source';
import { useDataSource } from '../../../../common/data-source/hooks';
import { IndexPattern } from '../../../../../../../../src/plugins/data/public';
import { WzSearchBar } from '../../../../common/search-bar';
import VulsEvaluationFilter, {
  createUnderEvaluationFilter,
  excludeUnderEvaluationFilter,
  getUnderEvaluationFilterValue,
} from '../../common/components/vuls-evaluation-filter';

const plugins = getPlugins();
const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

/* The vulnerabilities dashboard is made up of 3 dashboards because the filters need
a wrapper for visual adjustments, while the Kpi, the Open vs Close visualization and
the rest of the visualizations have different configurations at the dashboard level. */

interface DashboardVulsProps {
  indexPattern: IndexPattern;
}

const DashboardVulsComponent: React.FC<DashboardVulsProps> = ({
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
    DataSource: VulnerabilitiesDataSource,
    repository: new VulnerabilitiesDataSourceRepository(),
  });

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  const { searchBarProps, fingerprint } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });
  const { query } = searchBarProps;

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    setUnderEvaluation(getUnderEvaluation(filters || []));
    fetchData({ query })
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
  }, [JSON.stringify(fetchFilters), JSON.stringify(query)]);

  /**
   * When the user changes the filter value, this function is called to update the filters
   * If the value is null, the filter is removed
   * If the filter already exists, it is remove and the new filter is added
   * @param underEvaluation
   * @returns
   */
  const handleFilterChange = (underEvaluation: boolean | null) => {
    const newFilters = excludeUnderEvaluationFilter(filters || []);
    if (underEvaluation === null) {
      setFilters(newFilters);
      return;
    }
    newFilters.push(
      createUnderEvaluationFilter(
        underEvaluation,
        dataSource?.id || indexPattern?.id,
      ),
    );
    setFilters(newFilters);
  };

  const getUnderEvaluation = useCallback(getUnderEvaluationFilterValue, [
    JSON.stringify(filters),
    isDataSourceLoading,
  ]);

  const [underEvaluation, setUnderEvaluation] = useState<boolean | null>(
    getUnderEvaluation(filters || []),
  );

  return (
    <>
      <I18nProvider>
        <>
          <ModuleEnabledCheck />
          {isDataSourceLoading && !dataSource ? (
            <LoadingSearchbarProgress />
          ) : (
            <>
              <HideOnErrorInitializatingDataSource error={error}>
                <WzSearchBar
                  appName='vulnerability-detector-searchbar'
                  {...searchBarProps}
                  filters={excludeUnderEvaluationFilter(filters)}
                  fixedFilters={fixedFilters}
                  postFixedFilters={[
                    () => (
                      <VulsEvaluationFilter
                        value={underEvaluation}
                        setValue={handleFilterChange}
                      />
                    ),
                  ]}
                  showDatePicker={false}
                  showQueryInput={true}
                  showQueryBar={true}
                  showSaveQuery={true}
                />
              </HideOnErrorInitializatingDataSource>

              {dataSource && results?.hits?.total === 0 ? (
                <DiscoverNoResults />
              ) : null}
              <div
                className={`vulnerability-dashboard-responsive vulnerability-dashboard-metrics ${
                  dataSource && results?.hits?.total > 0 ? '' : 'wz-no-display'
                }`}
              >
                <DashboardByRenderer
                  input={{
                    viewMode: ViewMode.VIEW,
                    // Try to use the index pattern that the dataSource has
                    // but if it is undefined use the index pattern of the hoc
                    // because the first executions of the dataSource are undefined
                    // and embeddables need index pattern.
                    panels: getKPIsPanel(dataSource?.id || indexPattern?.id),
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
                    lastReloadRequestTime: fingerprint,
                  }}
                />
                <div className='vulnerability-dashboard-filters-wrapper'>
                  <DashboardByRenderer
                    input={{
                      viewMode: ViewMode.VIEW,
                      // Try to use the index pattern that the dataSource has
                      // but if it is undefined use the index pattern of the hoc
                      // because the first executions of the dataSource are undefined
                      // and embeddables need index pattern.
                      panels: getDashboardFilters(
                        dataSource?.id || indexPattern?.id,
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
                      lastReloadRequestTime: fingerprint,
                    }}
                  />
                </div>
                <DashboardByRenderer
                  input={{
                    viewMode: ViewMode.VIEW,
                    // Try to use the index pattern that the dataSource has
                    // but if it is undefined use the index pattern of the hoc
                    // because the first executions of the dataSource are undefined
                    // and embeddables need index pattern.
                    panels: getDashboardPanels(
                      dataSource?.id || indexPattern?.id,
                    ),
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
                    lastReloadRequestTime: fingerprint,
                  }}
                />
              </div>
              {error && <PromptErrorInitializatingDataSource error={error} />}
            </>
          )}
        </>
      </I18nProvider>
    </>
  );
};

export const DashboardVuls = compose(
  withErrorBoundary,
  withVulnerabilitiesStateDataSource,
)(DashboardVulsComponent);
