import React from 'react';
import { getDashboardPanels } from './dashboard-panels';
import { GDPRDataSource } from '../../../common/data-source/pattern/alerts/gdpr/gdpr-data-source';
import { AlertsDataSourceRepository } from '../../../common/data-source';
import { WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY } from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards/dashboard';

export const DashboardGDPR = createDashboard({
  DataSource: GDPRDataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  getDashboardPanels: [
    {
      getDashboardPanels,
      id: 'gdpr-dashboard-tab',
      title: 'GDPR dashboard',
      description: 'Dashboard of the GDPR',
      hidePanelTitles: false,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
