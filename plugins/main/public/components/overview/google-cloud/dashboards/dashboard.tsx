import React from 'react';
import { getDashboardPanels } from './dashboard_panels';
import { AlertsDataSourceRepository } from '../../../common/data-source';
import { GoogleCloudDataSource } from '../../../common/data-source/pattern/alerts/google-cloud/google-cloud-data-source';
import { WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY } from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards';

export const DashboardGoogleCloud = createDashboard({
  DataSource: GoogleCloudDataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  getDashboardPanels: [
    {
      getDashboardPanels: getDashboardPanels,
      id: 'google-cloud-detector-dashboard-tab',
      title: 'Google Cloud detector dashboard',
      description: 'Dashboard of the Google Cloud',
      hidePanelTitles: false,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
