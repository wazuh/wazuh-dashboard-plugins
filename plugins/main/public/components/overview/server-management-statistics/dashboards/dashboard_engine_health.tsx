import React from 'react';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanelsEngineHealth } from './dashboard_panels_engine_health';
import { withErrorBoundary } from '../../../common/hocs/error-boundary/with-error-boundary';
import { tFilter } from '../../../common/data-source';
import './statistics_dashboard.scss';

const plugins = getPlugins();

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

interface DashboardEngineHealthProps {
  indexPatternId: string;
  filters: tFilter[];
  searchBarProps: any;
  lastReloadRequestTime: number;
}

const DashboardEngineHealth: React.FC<DashboardEngineHealthProps> = ({
  indexPatternId,
  filters,
  searchBarProps,
  lastReloadRequestTime,
}) => {
  return (
    <div className='server-management-statistics-dashboard-responsive'>
      <DashboardByRenderer
        input={{
          viewMode: ViewMode.VIEW,
          panels: getDashboardPanelsEngineHealth(indexPatternId),
          isFullScreenMode: false,
          filters: filters,
          useMargins: true,
          id: 'engine-health-statistics-dashboard',
          timeRange: {
            from: searchBarProps.dateRangeFrom,
            to: searchBarProps.dateRangeTo,
          },
          title: 'Engine Health',
          description:
            'Consolidated engine health metrics from the normalization data stream',
          query: searchBarProps.query,
          refreshConfig: {
            pause: false,
            value: 15,
          },
          hidePanelTitles: false,
          lastReloadRequestTime,
        }}
      />
    </div>
  );
};

export const DashboardEngineHealthStatistics = withErrorBoundary(
  DashboardEngineHealth,
);
