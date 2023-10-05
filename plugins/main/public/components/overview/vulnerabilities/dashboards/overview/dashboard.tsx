import React from 'react';
import { getPlugins } from '../../../../../kibana-services';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard-panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBarConfiguration from '../../searchbar/use-search-bar-configuration';
import { VULNERABILITIES_INDEX_PATTERN_ID } from '../../common/constants';

const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

export const DashboardVuls: React.FC = () => {
  const { searchBarProps } = useSearchBarConfiguration({
    defaultIndexPatternID: VULNERABILITIES_INDEX_PATTERN_ID,
  });

  return (
    <>
      <I18nProvider>
        {' '}
        {/* The searchbar is not rendered when is not wrapped by the i18n provider */}
        <SearchBar {...searchBarProps} />
      </I18nProvider>
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
