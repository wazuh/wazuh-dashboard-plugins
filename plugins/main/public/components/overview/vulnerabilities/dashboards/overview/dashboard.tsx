import React from 'react';
import { getPlugins } from '../../../../../kibana-services';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../../common/search-bar/use-search-bar';
import { getDashboardFilters } from './dashboard_panels_filters';
import './vulnerability_detector_filters.scss';
import { getKPIsPanel } from './dashboard_panels_kpis';
import { useAppConfig } from '../../../../common/hooks';
import { withErrorBoundary } from '../../../../common/hocs';
import { DiscoverNoResults } from '../../common/components/no_results';
import { WAZUH_INDEX_TYPE_VULNERABILITIES } from '../../../../../../common/constants';
import { LoadingSpinner } from '../../common/components/loading_spinner';
import useCheckIndexFields from '../../common/hooks/useCheckIndexFields';
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

  const { searchBarProps } = useSearchBar({
    defaultIndexPatternID: VULNERABILITIES_INDEX_PATTERN_ID,
  });
  const {
    isLoading: isLoadingSearchbar,
    filters,
    query,
    indexPatterns,
  } = searchBarProps;

  const { isError, error, isSuccess, resultIndexData, isLoading } =
    useCheckIndexFields(
      VULNERABILITIES_INDEX_PATTERN_ID,
      indexPatterns?.[0],
      WAZUH_INDEX_TYPE_VULNERABILITIES,
      filters,
      query,
    );

  return (
    <>
      <I18nProvider>
        <>
          {isLoading || isLoadingSearchbar ? <LoadingSpinner /> : null}
          {!isLoading && !isLoadingSearchbar ? (
            <SearchBar
              appName='vulnerability-detector-searchbar'
              {...searchBarProps}
              showDatePicker={false}
              showQueryInput={true}
              showQueryBar={true}
            />
          ) : null}
          {!isLoadingSearchbar &&
          !isLoading &&
          (isError || resultIndexData?.hits?.total === 0) ? (
            <DiscoverNoResults message={error?.message} />
          ) : null}
          {!isLoadingSearchbar && !isLoading && isSuccess ? (
            <>
              <div className='vulnerability-dashboard-filters-wrapper'>
                <DashboardByRenderer
                  input={{
                    viewMode: ViewMode.VIEW,
                    panels: getDashboardFilters(
                      VULNERABILITIES_INDEX_PATTERN_ID,
                    ),
                    isFullScreenMode: false,
                    filters: searchBarProps.filters ?? [],
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
                  panels: getKPIsPanel(VULNERABILITIES_INDEX_PATTERN_ID),
                  isFullScreenMode: false,
                  filters: searchBarProps.filters ?? [],
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
              <DashboardByRenderer
                input={{
                  viewMode: ViewMode.VIEW,
                  panels: getDashboardPanels(VULNERABILITIES_INDEX_PATTERN_ID),
                  isFullScreenMode: false,
                  filters: searchBarProps.filters ?? [],
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
            </>
          ) : null}
        </>
      </I18nProvider>
    </>
  );
};

export const DashboardVuls = withErrorBoundary(DashboardVulsComponent);
