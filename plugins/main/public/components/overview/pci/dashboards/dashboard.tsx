import React from 'react';
import { getDashboardPanels } from './dashboard-panels';
import { PCIDSSDataSource } from '../../../common/data-source/pattern/alerts/pci-dss/pci-dss-data-source';
import { AlertsDataSourceRepository } from '../../../common/data-source';
import { WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY } from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards/dashboard';

export const DashboardPCIDSS = createDashboard({
  DataSource: PCIDSSDataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  getDashboardPanels: [
    {
      getDashboardPanels: getDashboardPanels,
      id: 'pci-dss-dashboard-tab',
      title: 'PCI DSS dashboard',
      description: 'Dashboard of the PCI DSS',
      hidePanelTitles: false,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
