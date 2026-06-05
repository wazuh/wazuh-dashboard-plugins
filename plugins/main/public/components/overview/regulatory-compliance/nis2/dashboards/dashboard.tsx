import React from 'react';
import { Nis2DataSource } from '../../../../common/data-source/pattern/events/nis2/nis2-data-source';
import { FindingsDataSourceRepository } from '../../../../common/data-source';
import {
  NIS2_DASHBOARD_ID,
  NIS2_AGENT_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../../common/constants';
import { createDashboard } from '../../../../common/dashboards/dashboard';

export const DashboardNIS2 = createDashboard({
  DataSource: Nis2DataSource,
  DataSourceRepositoryCreator: FindingsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: NIS2_DASHBOARD_ID,
      agentDashboardId: NIS2_AGENT_DASHBOARD_ID,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
