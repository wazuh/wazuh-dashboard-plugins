import React from 'react';

import {
  FindingsDataSourceRepository,
  FIMDataSource,
} from '../../../common/data-source';
import {
  FIM_DASHBOARD_ID,
  FIM_AGENT_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards/dashboard';

export const DashboardFIM = createDashboard({
  DataSource: FIMDataSource,
  DataSourceRepositoryCreator: FindingsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: FIM_DASHBOARD_ID,
      agentDashboardId: FIM_AGENT_DASHBOARD_ID,
    },
  ],
  // sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
