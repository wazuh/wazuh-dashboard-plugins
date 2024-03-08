import React from 'react';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { WAZUH_ALERTS_PATTERN } from '../../../../../common/constants';

const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

export const DashboardAWS: React.FC = () => {
  const INDEX_PATTERN_ID = WAZUH_ALERTS_PATTERN;

  const { searchBarProps } = useSearchBar({
    defaultIndexPatternID: INDEX_PATTERN_ID,
    filters: [],
  });

  return (
    <>
      <I18nProvider>
        <SearchBar
          appName='aws-searchbar'
          {...searchBarProps}
          showDatePicker={false}
          showQueryInput={true}
          showQueryBar={true}
        />
      </I18nProvider>
      <DashboardByRenderer
        input={{
          viewMode: ViewMode.VIEW,
          panels: getDashboardPanels(INDEX_PATTERN_ID),
          isFullScreenMode: false,
          filters: searchBarProps.filters ?? [],
          useMargins: true,
          id: 'aws-dashboard-tab',
          timeRange: {
            from: searchBarProps.dateRangeFrom,
            to: searchBarProps.dateRangeTo,
          },
          title: 'AWS dashboard',
          description: 'Dashboard of the AWS',
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
