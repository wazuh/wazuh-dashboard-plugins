import React from 'react';
import {
  AlertsDataSourceRepository,
  AzureDataSource,
} from '../../../common/data-source';

import {
  AZURE_DASHBOARD_ID,
  AZURE_AGENT_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards';

export const DashboardAzure = createDashboard({
  DataSource: AzureDataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: AZURE_DASHBOARD_ID,
      agentDashboardId: AZURE_AGENT_DASHBOARD_ID,
      className: 'wz-dashboard-hide-tables-pagination-export-csv-controls',
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
