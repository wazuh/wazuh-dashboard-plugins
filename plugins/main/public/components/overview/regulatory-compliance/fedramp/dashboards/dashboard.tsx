import React from 'react';
import { FEDRAMPDataSource } from '../../../../common/data-source/pattern';
import { FindingsDataSourceRepository } from '../../../../common/data-source';
import {
  FEDRAMP_DASHBOARD_ID,
  FEDRAMP_AGENT_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../../common/constants';
import { createDashboard } from '../../../../common/dashboards/dashboard';

export const DashboardFEDRAMP = createDashboard({
  DataSource: FEDRAMPDataSource,
  DataSourceRepositoryCreator: FindingsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: FEDRAMP_DASHBOARD_ID,
      agentDashboardId: FEDRAMP_AGENT_DASHBOARD_ID,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
