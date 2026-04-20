import React from 'react';
import { NIST800171DataSource } from '../../../../common/data-source/pattern/events/nist-800-171/nist-800-171-data-source';
import { FindingsDataSourceRepository } from '../../../../common/data-source';
import {
  NIST_800_171_DASHBOARD_ID,
  NIST_800_171_AGENT_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../../common/constants';
import { createDashboard } from '../../../../common/dashboards';

export const DashboardNIST800171 = createDashboard({
  DataSource: NIST800171DataSource,
  DataSourceRepositoryCreator: FindingsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: NIST_800_171_DASHBOARD_ID,
      agentDashboardId: NIST_800_171_AGENT_DASHBOARD_ID,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
