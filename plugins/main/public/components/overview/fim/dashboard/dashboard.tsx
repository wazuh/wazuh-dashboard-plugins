import React from 'react';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { getDashboardFilters } from './dashboard_panels_filters';
import './fim_filters.scss';
import { getKPIsPanel } from './dashboard_panels_kpis';
import { useAppConfig } from '../../../common/hooks';
import { DiscoverNoResults } from '../../vulnerabilities/common/components/no_results';
import { withErrorBoundary } from '../../../common/hocs';
import { LoadingSpinner } from '../../vulnerabilities/common/components/loading_spinner';
import { WAZUH_INDEX_TYPE_FIM } from '../../../../../common/constants';
import useCheckIndexFields from '../../vulnerabilities/common/hooks/useCheckIndexFields';

const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

const DashboardFimComponent: React.FC = () => {
  const appConfig = useAppConfig();
  const FIM_INDEX_PATTERN_ID = appConfig.data['fim.pattern'];
  const { searchBarProps } = useSearchBar({
    defaultIndexPatternID: FIM_INDEX_PATTERN_ID,
  });
  const {
    isLoading: isLoadingSearchbar,
    filters,
    query,
    indexPatterns,
  } = searchBarProps;

  const { isError, error, isSuccess, resultIndexData, isLoading } =
    useCheckIndexFields(
      FIM_INDEX_PATTERN_ID,
      indexPatterns?.[0],
      WAZUH_INDEX_TYPE_FIM,
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
          (isError ||
            !resultIndexData ||
            resultIndexData?.hits?.total === 0) ? (
            <DiscoverNoResults message={error?.message} />
          ) : null}
          {!isLoadingSearchbar &&
          !isLoading &&
          isSuccess &&
          resultIndexData &&
          resultIndexData?.hits?.total !== 0 ? (
            <div className='fim-dashboard-responsive'>
              <div className='fim-dashboard-filters-wrapper'>
                <DashboardByRenderer
                  input={{
                    viewMode: ViewMode.VIEW,
                    panels: getDashboardFilters(FIM_INDEX_PATTERN_ID),
                    isFullScreenMode: false,
                    filters: searchBarProps.filters ?? [],
                    useMargins: false,
                    id: 'fim-dashboard-tab-filters',
                    timeRange: {
                      from: searchBarProps.dateRangeFrom,
                      to: searchBarProps.dateRangeTo,
                    },
                    title: 'Fim dashboard filters',
                    description: 'Dashboard of the Fim filters',
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
                  panels: getKPIsPanel(FIM_INDEX_PATTERN_ID),
                  isFullScreenMode: false,
                  filters: searchBarProps.filters ?? [],
                  useMargins: true,
                  id: 'kpis-fim-dashboard-tab',
                  timeRange: {
                    from: searchBarProps.dateRangeFrom,
                    to: searchBarProps.dateRangeTo,
                  },
                  title: 'KPIs Fim dashboard',
                  description: 'KPIs Dashboard of the Fim',
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
                  panels: getDashboardPanels(FIM_INDEX_PATTERN_ID),
                  isFullScreenMode: false,
                  filters: searchBarProps.filters ?? [],
                  useMargins: true,
                  id: 'fim-dashboard-tab',
                  timeRange: {
                    from: searchBarProps.dateRangeFrom,
                    to: searchBarProps.dateRangeTo,
                  },
                  title: 'Fim dashboard',
                  description: 'Dashboard of the Fim',
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

export const DashboardFim = withErrorBoundary(DashboardFimComponent);
