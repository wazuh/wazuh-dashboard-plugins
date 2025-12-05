import React from 'react';
import { GDPRDataSource } from '../../../common/data-source/pattern/events/gdpr/gdpr-data-source';
import { EventsDataSourceRepository } from '../../../common/data-source';
import {
  GDPR_DASHBOARD_ID,
  GDPR_AGENT_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards/dashboard';

export const DashboardGDPR = createDashboard({
  DataSource: GDPRDataSource,
  DataSourceRepositoryCreator: EventsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: GDPR_DASHBOARD_ID,
      agentDashboardId: GDPR_AGENT_DASHBOARD_ID,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
