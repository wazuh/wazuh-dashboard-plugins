import React from 'react';
import { EventsDataSourceRepository } from '../../../common/data-source';
import { GitHubDataSource } from '../../../common/data-source/pattern/events/github/github-data-source';
import {
  GITHUB_DASHBOARD_ID,
  GITHUB_AGENT_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards';

export const DashboardGitHub = createDashboard({
  DataSource: GitHubDataSource,
  DataSourceRepositoryCreator: EventsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: GITHUB_DASHBOARD_ID,
      agentDashboardId: GITHUB_AGENT_DASHBOARD_ID,
    },
  ],
  // sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
