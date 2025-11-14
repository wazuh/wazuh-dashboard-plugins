import React from 'react';
// Use saved dashboards by ID instead of panel builders
import { withErrorBoundary } from '../../../common/hocs';

import {
  SystemInventoryStatesDataSource,
  SystemInventoryStatesDataSourceRepository,
} from '../../../common/data-source';

import { withSystemInventoryDataSource } from '../common/hocs/validate-system-inventory-index-pattern';
import { createDashboard } from '../../../common/dashboards';
import {
  IT_HYGIENE_DASHBOARD_ID,
  IT_HYGIENE_AGENT_DASHBOARD_ID,
  WAZUH_SAMPLE_INVENTORY_AGENT,
} from '../../../../../common/constants';

export const DashboardITHygiene = withErrorBoundary(
  withSystemInventoryDataSource(
    createDashboard({
      DataSource: SystemInventoryStatesDataSource,
      DataSourceRepositoryCreator: SystemInventoryStatesDataSourceRepository,
      getDashboardPanels: [
        {
          dashboardId: IT_HYGIENE_DASHBOARD_ID,
          agentDashboardId: IT_HYGIENE_AGENT_DASHBOARD_ID,
          className: 'wz-dashboard-hide-tables-pagination-export-csv-controls',
        },
      ],
      sampleDataWarningCategories: [WAZUH_SAMPLE_INVENTORY_AGENT],
    }),
  ),
);
