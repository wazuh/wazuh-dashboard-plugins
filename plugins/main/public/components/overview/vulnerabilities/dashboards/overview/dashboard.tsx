import React from 'react';
import { withErrorBoundary } from '../../../../common/hocs';

import {
  VulnerabilitiesDataSource,
  VulnerabilitiesDataSourceRepository,
} from '../../../../common/data-source';

import { withVulnerabilitiesStateDataSource } from '../../common/hocs/validate-vulnerabilities-states-index-pattern';
import { createDashboard } from '../../../../common/dashboards';
import {
  WAZUH_SAMPLE_VULNERABILITIES,
  VULNERABILITIES_DASHBOARD_ID,
  VULNERABILITIES_AGENT_DASHBOARD_ID,
} from '../../../../../../common/constants';

export const DashboardVuls = withErrorBoundary(
  withVulnerabilitiesStateDataSource(
    createDashboard({
      DataSource: VulnerabilitiesDataSource,
      DataSourceRepositoryCreator: VulnerabilitiesDataSourceRepository,
      getDashboardPanels: [
        {
          dashboardId: VULNERABILITIES_DASHBOARD_ID,
          agentDashboardId: VULNERABILITIES_AGENT_DASHBOARD_ID,
        },
      ],
      sampleDataWarningCategories: [WAZUH_SAMPLE_VULNERABILITIES],
    }),
  ),
);
