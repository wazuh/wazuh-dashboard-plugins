import React from 'react';
import { getDashboardPanels } from './dashboard-panels';
import { NIST80053DataSource } from '../../../common/data-source/pattern/alerts/nist-800-53/nist-800-53-data-source';
import { AlertsDataSourceRepository } from '../../../common/data-source';
import { WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY } from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards';

export const DashboardNIST80053 = createDashboard({
  DataSource: NIST80053DataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  getDashboardPanels: [
    {
      getDashboardPanels: getDashboardPanels,
      id: 'nist-dashboard-tab',
      title: 'NIST 800-53 dashboard',
      description: 'Dashboard of the NIST 800-53',
      hidePanelTitles: false,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
