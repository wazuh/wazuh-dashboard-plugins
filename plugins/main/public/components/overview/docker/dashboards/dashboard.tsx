import React from 'react';
import {
  EventsDataSourceRepository,
  DockerDataSource,
} from '../../../common/data-source';
import {
  DOCKER_DASHBOARD_ID,
  DOCKER_AGENT_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards';

export const DashboardDocker = createDashboard({
  DataSource: DockerDataSource,
  DataSourceRepositoryCreator: EventsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: DOCKER_DASHBOARD_ID,
      agentDashboardId: DOCKER_AGENT_DASHBOARD_ID,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION],
});
