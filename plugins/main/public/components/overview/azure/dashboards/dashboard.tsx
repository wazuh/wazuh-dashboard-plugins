import React from 'react';
import { getDashboardPanels } from './dashboard_panels';
import {
  AlertsDataSourceRepository,
  AzureDataSource,
} from '../../../common/data-source';

import { WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY } from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards';

export const DashboardAzure = createDashboard({
  DataSource: AzureDataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  getDashboardPanels: [
    {
      getDashboardPanels: getDashboardPanels,
      id: 'azure-dashboard-tab',
      title: 'Azure dashboard',
      description: 'Dashboard of the Azure',
      hidePanelTitles: false,
      className: 'wz-dashboard-hide-tables-pagination-export-csv-controls',
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
