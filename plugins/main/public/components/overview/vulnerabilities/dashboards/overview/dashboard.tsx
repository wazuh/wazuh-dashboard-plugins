import React from 'react';
import { getPlugins } from '../../../../../kibana-services';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard-panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBarConfiguration from '../../searchbar/use-search-bar-configuration';
import { VULNERABILITIES_INDEX_PATTERN_ID } from '../../common/constants';
import { DashboardFilters } from './dashboard-filters/dashboard-filters';

const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

export const DashboardVuls: React.FC = () => {
  const { searchBarProps } = useSearchBarConfiguration({
    defaultIndexPatternID: VULNERABILITIES_INDEX_PATTERN_ID,
    filters: [],
  });

  return (
    <>
      <I18nProvider>
        <SearchBar appName="vulnerability-detector-searchbar" {...searchBarProps} />
      </I18nProvider>
      <DashboardFilters searchBarProps={searchBarProps} />
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
