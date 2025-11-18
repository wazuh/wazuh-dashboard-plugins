import React from 'react';
import { GDPRDataSource } from '../../../common/data-source/pattern/alerts/gdpr/gdpr-data-source';
import { AlertsDataSourceRepository } from '../../../common/data-source';
import {
  GDPR_DASHBOARD_ID,
  GDPR_AGENT_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards/dashboard';

export const DashboardGDPR = createDashboard({
  DataSource: GDPRDataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: GDPR_DASHBOARD_ID,
      agentDashboardId: GDPR_AGENT_DASHBOARD_ID,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
