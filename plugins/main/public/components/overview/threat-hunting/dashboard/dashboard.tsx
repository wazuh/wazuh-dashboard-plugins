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
      getDashboardPanels: getKPIsPanel,
      id: 'kpis-th-dashboard-tab',
      title: 'KPIs Threat Hunting dashboard',
      description: 'KPIs Dashboard of the Threat Hunting',
      hidePanelTitles: true,
    },
    {
      getDashboardPanels: getDashboardPanels,
      id: 'th-dashboard-tab',
      title: 'Threat Hunting dashboard',
      description: 'Dashboard of the Threat Hunting',
      hidePanelTitles: false,
    },
  ],
  sampleDataWarningCategories: [
    WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
    WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING,
    WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
  ],
});
