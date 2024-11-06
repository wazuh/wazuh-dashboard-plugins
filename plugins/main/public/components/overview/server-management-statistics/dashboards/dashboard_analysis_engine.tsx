import React from 'react';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { withErrorBoundary } from '../../../common/hocs/error-boundary/with-error-boundary';
import { getDashboardPanelsAnalysisEngine } from './dashboard_panels_analysis_engine';
import { tFilter } from '../../../common/data-source';
import './statistics_dashboard.scss';

const plugins = getPlugins();

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

interface DashboardStatisticsProps {
  isClusterMode: boolean;
  indexPatternId: string;
  filters: tFilter[];
  searchBarProps: any;
  lastReloadRequestTime: number;
}

const DashboardStatistics: React.FC<DashboardStatisticsProps> = ({
  isClusterMode,
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
          panels: getDashboardPanelsAnalysisEngine(
            indexPatternId,
            isClusterMode,
          ),
          isFullScreenMode: false,
          filters: filters,
          useMargins: true,
          id: 'analysis-engine-statistics-dashboard',
          timeRange: {
            from: searchBarProps.dateRangeFrom,
            to: searchBarProps.dateRangeTo,
          },
          title: 'Analysis Engine Statistics dashboard',
          description: 'Dashboard of the Analysis Engine Statistics',
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

export const DashboardAnalysisEngineStatistics =
  withErrorBoundary(DashboardStatistics);
