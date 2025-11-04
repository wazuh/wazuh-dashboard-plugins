import React from 'react';
import { getDashboardPanels } from './dashboard_panels';
import { getKPIsPanel } from './dashboard_panels_kpis';
import {
  AlertsDataSourceRepository,
  ThreatHuntingDataSource,
} from '../../../common/data-source';

import {
  WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
  WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards/dashboard';

export const DashboardThreatHunting = createDashboard({
  DataSource: ThreatHuntingDataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: 'c19512e7-7598-4b94-a454-f2dc91e4daa0',
      agentDashboardId: 'e0b59a43-1a41-416f-a0f4-bd126c5c8a07',
    },
  ],
  sampleDataWarningCategories: [
    WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
    WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING,
    WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
  ],
});
