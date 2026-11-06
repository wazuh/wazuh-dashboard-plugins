import React from 'react';

import {
  FIMDataSourceRepository,
  FIMDataSource,
} from '../../../common/data-source';
import {
  FIM_DASHBOARD_ID,
  FIM_AGENT_DASHBOARD_ID,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards/dashboard';
import { FimEmptyState } from '../components/empty-state/fim-empty-state';

export const DashboardFIM = createDashboard({
  DataSource: FIMDataSource,
  DataSourceRepositoryCreator: FIMDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: FIM_DASHBOARD_ID,
      agentDashboardId: FIM_AGENT_DASHBOARD_ID,
    },
  ],
  // sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
  emptyState: <FimEmptyState kind='dashboard' />,
});
