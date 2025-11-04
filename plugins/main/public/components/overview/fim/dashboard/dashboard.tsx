import React from 'react';
import { getDashboardPanels } from './dashboard-panels';
import {
  AlertsDataSourceRepository,
  FIMDataSource,
} from '../../../common/data-source';
import { WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY } from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards/dashboard';

export const DashboardFIM = createDashboard({
  DataSource: FIMDataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  getDashboardPanels: [
    {
      getDashboardPanels,
      id: 'fim-dashboard-tab',
      title: 'File Integrity Monitoring dashboard',
      description: 'Dashboard of the File Integrity Monitoring',
      hidePanelTitles: false,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
