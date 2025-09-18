import React from 'react';
import { getDashboardPanels } from './dashboard-panels';
import {
  AlertsDataSourceRepository,
  MitreAttackDataSource,
} from '../../../common/data-source';
import {
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
  WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards/dashboard';

export const DashboardMITRE: React.FC = createDashboard({
  DataSource: MitreAttackDataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  getDashboardPanels: [
    {
      getDashboardPanels: getDashboardPanels,
      id: 'mitre-dashboard-tab',
      title: 'MITRE dashboard',
      description: 'Dashboard of the MITRE',
      hidePanelTitles: false,
    },
  ],
  sampleDataWarningCategories: [
    WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
    WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
  ],
});
