import React from 'react';
import { ISO27001DataSource } from '../../../../common/data-source/pattern/events/iso-27001';
import { FindingsDataSourceRepository } from '../../../../common/data-source';
import {
  ISO27001_DASHBOARD_ID,
  ISO27001_AGENT_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../../common/constants';
import { createDashboard } from '../../../../common/dashboards';

export const DashboardISO27001 = createDashboard({
  DataSource: ISO27001DataSource,
  DataSourceRepositoryCreator: FindingsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: ISO27001_DASHBOARD_ID,
      agentDashboardId: ISO27001_AGENT_DASHBOARD_ID,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
