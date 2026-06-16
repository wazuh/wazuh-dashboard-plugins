import React from 'react';
import DashboardRenderer from '../../../common/dashboards/dashboard-renderer/dashboard-renderer';
import { withErrorBoundary } from '../../../common/hocs/error-boundary/with-error-boundary';
import { tFilter } from '../../../common/data-source';
import './statistics_dashboard.scss';

interface DashboardNormalizationProps {
  indexPatternId: string;
  filters: tFilter[];
  searchBarProps: any;
  lastReloadRequestTime: number;
}

const DashboardNormalization: React.FC<DashboardNormalizationProps> = ({
  filters,
  searchBarProps,
  lastReloadRequestTime,
}) => (
  <div className='server-management-statistics-dashboard-responsive'>
    <DashboardRenderer
      dashboardId='wz-dashboard-server-statistics-normalization'
      hasPinnedAgent={false}
      config={{
        dataSource: {
          fetchFilters: filters,
          searchBarProps,
          fingerprint: lastReloadRequestTime,
        },
      }}
    />
  </div>
);

export const DashboardNormalizationStatistics = withErrorBoundary(
  DashboardNormalization,
);
