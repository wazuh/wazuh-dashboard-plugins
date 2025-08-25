import React from 'react';
import { getDashboardPanels } from './dashboard-panels';
import { AlertsDataSourceRepository } from '../../../common/data-source';
import { GitHubDataSource } from '../../../common/data-source/pattern/alerts/github/github-data-source';
import { WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY } from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards';

export const DashboardGitHub = createDashboard({
  DataSource: GitHubDataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  getDashboardPanels: [
    {
      getDashboardPanels: getDashboardPanels,
      id: 'github-dashboard-tab',
      title: 'GitHub dashboard',
      description: 'Dashboard of the GitHub',
      hidePanelTitles: false,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
