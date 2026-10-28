import React from 'react';
import {
  FindingsDataSourceRepository,
  ThreatHuntingDataSource,
} from '../../../common/data-source';

import {
  THREAT_HUNTING_AGENT_DASHBOARD_ID,
  THREAT_HUNTING_DASHBOARD_ID,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards/dashboard';
import { ThreatHuntingEmptyState } from '../components/empty-state/threat-hunting-empty-state';

export const DashboardThreatHunting = createDashboard({
  DataSource: ThreatHuntingDataSource,
  DataSourceRepositoryCreator: FindingsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: THREAT_HUNTING_DASHBOARD_ID,
      agentDashboardId: THREAT_HUNTING_AGENT_DASHBOARD_ID,
    },
  ],
  emptyState: <ThreatHuntingEmptyState />,
});
