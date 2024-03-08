import React from 'react';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { WAZUH_ALERTS_PATTERN } from '../../../../../common/constants';
import { getKPIsPanel } from './dashboard_panels_kpis';
import { Filter } from '../../../../../../../src/plugins/data/common';

const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

interface DashboardThreatHuntingProps {
  pinnedAgent: Filter;
}

export const DashboardThreatHunting: React.FC<DashboardThreatHuntingProps> = ({
  pinnedAgent,
}) => {
  /* TODO: Analyze whether to use the new index pattern handler https://github.com/wazuh/wazuh-dashboard-plugins/issues/6434 */
  const TH_INDEX_PATTERN_ID = WAZUH_ALERTS_PATTERN;

  const { searchBarProps } = useSearchBar({
    defaultIndexPatternID: TH_INDEX_PATTERN_ID,
  });

  return (
    <>
      <I18nProvider>
        <SearchBar
          appName='th-searchbar'
          {...searchBarProps}
          showDatePicker={true}
          showQueryInput={true}
          showQueryBar={true}
        />
      </I18nProvider>
      <DashboardByRenderer
        input={{
          viewMode: ViewMode.VIEW,
          panels: getKPIsPanel(TH_INDEX_PATTERN_ID),
          isFullScreenMode: false,
          filters: searchBarProps.filters ?? [],
          useMargins: true,
          id: 'kpis-th-dashboard-tab',
          timeRange: {
            from: searchBarProps.dateRangeFrom,
            to: searchBarProps.dateRangeTo,
          },
          title: 'KPIs Threat Hunting dashboard',
          description: 'KPIs Dashboard of the Threat Hunting',
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
          panels: getDashboardPanels(TH_INDEX_PATTERN_ID, !!pinnedAgent),
          isFullScreenMode: false,
          filters: searchBarProps.filters ?? [],
          useMargins: true,
          id: 'th-dashboard-tab',
          timeRange: {
            from: searchBarProps.dateRangeFrom,
            to: searchBarProps.dateRangeTo,
          },
          title: 'Threat Hunting dashboard',
          description: 'Dashboard of the Threat Hunting',
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
