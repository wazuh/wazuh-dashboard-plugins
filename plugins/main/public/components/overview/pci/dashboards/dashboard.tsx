import React from 'react';
import { PCIDSSDataSource } from '../../../common/data-source/pattern/events/pci-dss/pci-dss-data-source';
import { EventsDataSourceRepository } from '../../../common/data-source';
import {
  PCI_DSS_DASHBOARD_ID,
  PCI_DSS_AGENT_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards/dashboard';

export const DashboardPCIDSS = createDashboard({
  DataSource: PCIDSSDataSource,
  DataSourceRepositoryCreator: EventsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: PCI_DSS_DASHBOARD_ID,
      agentDashboardId: PCI_DSS_AGENT_DASHBOARD_ID,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
