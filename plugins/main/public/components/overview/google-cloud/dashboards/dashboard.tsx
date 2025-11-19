import React from 'react';
import { AlertsDataSourceRepository } from '../../../common/data-source';
import { GoogleCloudDataSource } from '../../../common/data-source/pattern/alerts/google-cloud/google-cloud-data-source';
import {
  GOOGLE_CLOUD_DASHBOARD_ID,
  GOOGLE_CLOUD_AGENT_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards';

export const DashboardGoogleCloud = createDashboard({
  DataSource: GoogleCloudDataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: GOOGLE_CLOUD_DASHBOARD_ID,
      agentDashboardId: GOOGLE_CLOUD_AGENT_DASHBOARD_ID,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
