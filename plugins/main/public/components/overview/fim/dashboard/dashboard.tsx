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
const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

export const DashboardFim: React.FC = () => {
  const appConfig = useAppConfig();
  const FIM_INDEX_PATTERN_ID = appConfig.data['fim.pattern'];

  const { searchBarProps } = useSearchBar({
    defaultIndexPatternID: FIM_INDEX_PATTERN_ID,
    filters: [],
  });

  return (
    <>
      <I18nProvider>
        <SearchBar
          appName='fim-searchbar'
          {...searchBarProps}
          showDatePicker={false}
          showQueryInput={true}
          showQueryBar={true}
        />
      </I18nProvider>
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
    </>
  );
};
