import React from 'react';
import { EventsDataSourceRepository } from '../../../common/data-source';
import { GoogleCloudDataSource } from '../../../common/data-source/pattern/events/google-cloud/google-cloud-data-source';
import {
  GOOGLE_CLOUD_DASHBOARD_ID,
  GOOGLE_CLOUD_AGENT_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards';

export const DashboardGoogleCloud = createDashboard({
  DataSource: GoogleCloudDataSource,
  DataSourceRepositoryCreator: EventsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: GOOGLE_CLOUD_DASHBOARD_ID,
      agentDashboardId: GOOGLE_CLOUD_AGENT_DASHBOARD_ID,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
