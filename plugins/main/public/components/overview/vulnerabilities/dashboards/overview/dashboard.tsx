import React from 'react';
import { getPlugins } from '../../../../../kibana-services';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard-panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBarConfiguration from '../../searchbar/use-search-bar-configuration';
import { VULNERABILITIES_INDEX_PATTERN_ID } from '../../common/constants';
import { getDashboardFilters } from './dashboard-panels-filters';
import './vulnerability-detector-filters.scss';
import { getKPIsPanel } from './dashboard-panels-kpis';
import { getOpenVsClosePanel } from './dashboard-panel-open-vs-close';
const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

/* The vulnerabilities dashboard is made up of 3 dashboards because the filters need
a wrapper for visual adjustments, while the Kpi, the Open vs Close visualization and
the rest of the visualizations have different configurations at the dashboard level. */

export const DashboardVuls: React.FC = () => {
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
        />
      </I18nProvider>
      <div className='vulnerability-dashboard-filters-wrapper'>
        <DashboardByRenderer
          input={{
            viewMode: ViewMode.VIEW,
            panels: getDashboardFilters(),
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
          panels: getKPIsPanel(),
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
          panels: getOpenVsClosePanel(),
          isFullScreenMode: false,
          filters: [],
          useMargins: true,
          id: 'open-vs-close-vulnerability-detector-dashboard-tab',
          timeRange: {
            from: searchBarProps.dateRangeFrom,
            to: searchBarProps.dateRangeTo,
          },
          title: 'Open vs Close Vulnerabilities',
          description:
            'Open vs Close Vulnerabilities of the Vulnerability detector',
          query: searchBarProps.query,
          refreshConfig: {
            pause: false,
            value: 15,
          },
          hidePanelTitles: false,
        }}
      />
      <DashboardByRenderer
        input={{
          viewMode: ViewMode.VIEW,
          panels: getDashboardPanels(),
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
