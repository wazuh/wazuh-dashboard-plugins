import React from 'react';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanelsListenerEngine } from './dashboard_panels_listener_engine';
import { withErrorBoundary } from '../../../common/hocs/error-boundary/with-error-boundary';
import { tFilter } from '../../../common/data-source';
import './statistics_dashboard.scss';

const plugins = getPlugins();

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

interface DashboardStatisticsProps {
  indexPatternId: string;
  filters: tFilter[];
  searchBarProps: any;
}

const DashboardStatistics: React.FC<DashboardStatisticsProps> = ({
  indexPatternId,
  filters,
  searchBarProps,
}) => {
  return (
    <div className='server-management-statistics-dashboard-responsive'>
      <DashboardByRenderer
        input={{
          viewMode: ViewMode.VIEW,
          panels: getDashboardPanelsListenerEngine(indexPatternId),
          isFullScreenMode: false,
          filters: filters,
          useMargins: true,
          id: 'listener-engine-statistics-dashboard',
          timeRange: {
            from: searchBarProps.dateRangeFrom,
            to: searchBarProps.dateRangeTo,
          },
          title: 'Listener Engine Statistics dashboard',
          description: 'Dashboard of the Listener Engine Statistics',
          query: searchBarProps.query,
          refreshConfig: {
            pause: false,
            value: 15,
          },
          hidePanelTitles: false,
        }}
      />
    </div>
  );
};

export const DashboardListenerEngineStatistics =
  withErrorBoundary(DashboardStatistics);
