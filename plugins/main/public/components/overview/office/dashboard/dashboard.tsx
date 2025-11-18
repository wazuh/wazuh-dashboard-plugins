import React from 'react';
import { AlertsDataSourceRepository } from '../../../common/data-source';
import { Office365DataSource } from '../../../common/data-source/pattern/alerts/office-365/office-365-data-source';
import {
  OFFICE_365_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards/dashboard';

export const DashboardOffice365 = createDashboard({
  DataSource: Office365DataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: OFFICE_365_DASHBOARD_ID,
      agentDashboardId: OFFICE_365_DASHBOARD_ID,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
