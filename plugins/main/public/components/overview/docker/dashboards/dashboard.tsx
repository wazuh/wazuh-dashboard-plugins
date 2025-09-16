import React from 'react';
import { getDashboardPanels } from './dashboard-panels';
import {
  AlertsDataSourceRepository,
  DockerDataSource,
} from '../../../common/data-source';
import { WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION } from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards';

export const DashboardDocker = createDashboard({
  DataSource: DockerDataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  getDashboardPanels: [
    {
      getDashboardPanels: getDashboardPanels,
      id: 'docker-dashboard-tab',
      title: 'Docker dashboard',
      description: 'Dashboard of Docker',
      hidePanelTitles: false,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION],
});
