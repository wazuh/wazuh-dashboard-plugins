import React from 'react';
import {
  EventsDataSourceRepository,
  MitreAttackDataSource,
} from '../../../common/data-source';
import {
  MITRE_ATTACK_DASHBOARD_ID,
  MITRE_ATTACK_AGENT_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
  WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards/dashboard';

export const DashboardMITRE: React.FC = createDashboard({
  DataSource: MitreAttackDataSource,
  DataSourceRepositoryCreator: EventsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: MITRE_ATTACK_DASHBOARD_ID,
      agentDashboardId: MITRE_ATTACK_AGENT_DASHBOARD_ID,
    },
  ],
  sampleDataWarningCategories: [
    WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
    WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
  ],
});
