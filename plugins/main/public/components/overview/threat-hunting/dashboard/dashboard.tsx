import React from 'react';
import {
  EventsDataSourceRepository,
  ThreatHuntingDataSource,
} from '../../../common/data-source';

import {
  THREAT_HUNTING_AGENT_DASHBOARD_ID,
  THREAT_HUNTING_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
  WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards/dashboard';

export const DashboardThreatHunting = createDashboard({
  DataSource: ThreatHuntingDataSource,
  DataSourceRepositoryCreator: EventsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: THREAT_HUNTING_DASHBOARD_ID,
      agentDashboardId: THREAT_HUNTING_AGENT_DASHBOARD_ID,
    },
  ],
});
