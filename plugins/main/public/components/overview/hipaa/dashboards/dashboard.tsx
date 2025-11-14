import React from 'react';
import { HIPAADataSource } from '../../../common/data-source/pattern/alerts/hipaa/hipaa-data-source';
import { AlertsDataSourceRepository } from '../../../common/data-source';
import {
  HIPAA_DASHBOARD_ID,
  HIPAA_AGENT_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards';

export const DashboardHIPAA = createDashboard({
  DataSource: HIPAADataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: HIPAA_DASHBOARD_ID,
      agentDashboardId: HIPAA_AGENT_DASHBOARD_ID,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
