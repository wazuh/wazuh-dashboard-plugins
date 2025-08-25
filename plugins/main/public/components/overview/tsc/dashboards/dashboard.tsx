import React from 'react';
import { getDashboardPanels } from './dashboard-panels';
import { TSCDataSource } from '../../../common/data-source/pattern/alerts/tsc/tsc-data-souce';
import { AlertsDataSourceRepository } from '../../../common/data-source';
import { WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY } from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards';

export const DashboardTSC = createDashboard({
  DataSource: TSCDataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  getDashboardPanels: [
    {
      getDashboardPanels: getDashboardPanels,
      id: 'tsc-dashboard-tab',
      title: 'TSC dashboard',
      description: 'Dashboard of the TSC',
      hidePanelTitles: false,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
