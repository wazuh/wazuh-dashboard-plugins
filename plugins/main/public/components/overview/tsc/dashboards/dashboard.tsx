import React from 'react';
import { TSCDataSource } from '../../../common/data-source/pattern/events/tsc/tsc-data-souce';
import { EventsDataSourceRepository } from '../../../common/data-source';
import {
  TSC_DASHBOARD_ID,
  TSC_AGENT_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards';

export const DashboardTSC = createDashboard({
  DataSource: TSCDataSource,
  DataSourceRepositoryCreator: EventsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: TSC_DASHBOARD_ID,
      agentDashboardId: TSC_AGENT_DASHBOARD_ID,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
