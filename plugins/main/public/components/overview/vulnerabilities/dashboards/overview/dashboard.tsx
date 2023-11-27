import React from 'react';
import { getPlugins } from '../../../../../kibana-services';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBarConfiguration from '../../search_bar/use_search_bar_configuration';
import { getDashboardFilters } from './dashboard_panels_filters';
import './vulnerability_detector_filters.scss';
import { getKPIsPanel } from './dashboard_panels_kpis';
import { useAppConfig } from '../../../../common/hooks';
const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

/* The vulnerabilities dashboard is made up of 3 dashboards because the filters need
a wrapper for visual adjustments, while the Kpi, the Open vs Close visualization and
the rest of the visualizations have different configurations at the dashboard level. */

export const DashboardVuls: React.FC = () => {
  const appConfig = useAppConfig();
  const VULNERABILITIES_INDEX_PATTERN_ID =
    appConfig.data['vulnerabilities.pattern'];

  const { searchBarProps } = useSearchBarConfiguration({
    defaultIndexPatternID: VULNERABILITIES_INDEX_PATTERN_ID,
    filters: [],
  });

  return (
    <>
      <I18nProvider>
        <SearchBar
          appName='vulnerability-detector-searchbar'
          {...searchBarProps}
          showDatePicker={false}
          showQueryInput={true}
          showQueryBar={true}
        />
      </I18nProvider>
      <div className='vulnerability-dashboard-filters-wrapper'>
        <DashboardByRenderer
          input={{
            viewMode: ViewMode.VIEW,
            panels: getDashboardFilters(VULNERABILITIES_INDEX_PATTERN_ID),
            isFullScreenMode: false,
            filters: searchBarProps.filters ?? [],
            useMargins: false,
            id: 'vulnerability-detector-dashboard-tab-filters',
            timeRange: {
              from: searchBarProps.dateRangeFrom,
              to: searchBarProps.dateRangeTo,
            },
            title: 'Vulnerability detector dashboard filters',
            description: 'Dashboard of the Vulnerability detector filters',
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
  );
};
