import React from 'react';
import { NIST80053DataSource } from '../../../common/data-source/pattern/alerts/nist-800-53/nist-800-53-data-source';
import { AlertsDataSourceRepository } from '../../../common/data-source';
import {
  NIST_800_53_DASHBOARD_ID,
  NIST_800_53_AGENT_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards';

export const DashboardNIST80053 = createDashboard({
  DataSource: NIST80053DataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: NIST_800_53_DASHBOARD_ID,
      agentDashboardId: NIST_800_53_AGENT_DASHBOARD_ID,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
