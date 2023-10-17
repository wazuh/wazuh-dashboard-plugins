import React from 'react';
import { getPlugins } from '../../../../../../kibana-services';
import { ViewMode } from '../../../../../../../../../src/plugins/embeddable/public';
import './vulnerability-detector-filters.scss';
import { getDashboardFilters } from './dashboard-panels-filters';

const plugins = getPlugins();
const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

export const DashboardFilters = (searchBarProps: any) => {
  return (
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
  );
};
