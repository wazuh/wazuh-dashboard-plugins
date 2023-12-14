import React from 'react';
import { getPlugins } from '../../../../../kibana-services';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBarConfiguration from '../../../vulnerabilities/search_bar/use_search_bar_configuration';
import { getDashboardFilters } from './dashboard_panels_filters';
import './fim_filters.scss';
import { getKPIsPanel } from './dashboard_panels_kpis';
import { useAppConfig } from '../../../../common/hooks';
import { withErrorBoundary } from '../../../../common/hocs';
import { DiscoverNoResults } from '../../../vulnerabilities/common/components/no_results';
import { WAZUH_INDEX_TYPE_FIM } from '../../../../../../common/constants';
import { LoadingSpinner } from '../../../vulnerabilities/common/components/loading_spinner';
import useCheckIndexFields from '../../../vulnerabilities/common/hooks/useCheckIndexFields';

const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

const DashboardFimComponent: React.FC = () => {
  console.log('El componente está montándose...');

  const appConfig = useAppConfig();

  const FIM_INDEX_PATTERN_ID = appConfig.data['fim.pattern'];
  console.log(FIM_INDEX_PATTERN_ID, 'FIM_INDEX_PATTERN_ID');
  console.log(
    FIM_INDEX_PATTERN_ID,
    'FIM_INDEX_PATTERN_ID antes de useSearchBarConfiguration',
  );

  const { searchBarProps } = useSearchBarConfiguration({
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
  console.log(searchBarProps, 'searchBarProps');
  console.log(indexPatterns, 'indexPatterns');

  return (
    <>
      <I18nProvider>
        <>
          {isLoading || isLoadingSearchbar ? <LoadingSpinner /> : null}
          {!isLoading && !isLoadingSearchbar ? (
            <SearchBar
              appName='fim-detector-searchbar'
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
              <div className='fim-dashboard-filters-wrapper'>
                <DashboardByRenderer
                  input={{
                    viewMode: ViewMode.VIEW,
                    panels: getDashboardFilters(FIM_INDEX_PATTERN_ID),
                    isFullScreenMode: false,
                    filters: searchBarProps.filters ?? [],
                    useMargins: false,
                    id: 'fim-detector-dashboard-tab-filters',
                    timeRange: {
                      from: searchBarProps.dateRangeFrom,
                      to: searchBarProps.dateRangeTo,
                    },
                    title: 'Fim detector dashboard filters',
                    description: 'Dashboard of the Fim detector filters',
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
                  id: 'kpis-fim-detector-dashboard-tab',
                  timeRange: {
                    from: searchBarProps.dateRangeFrom,
                    to: searchBarProps.dateRangeTo,
                  },
                  title: 'KPIs Fim detector dashboard',
                  description: 'KPIs Dashboard of the Fim detector',
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
                  id: 'fim-detector-dashboard-tab',
                  timeRange: {
                    from: searchBarProps.dateRangeFrom,
                    to: searchBarProps.dateRangeTo,
                  },
                  title: 'Fim detector dashboard',
                  description: 'Dashboard of the Fim detector',
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

export const DashboardFim = withErrorBoundary(DashboardFimComponent);
