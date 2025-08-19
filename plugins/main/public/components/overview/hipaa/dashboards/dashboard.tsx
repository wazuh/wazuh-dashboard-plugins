import React from 'react';
import { getDashboardPanels } from './dashboard-panels';
import { HIPAADataSource } from '../../../common/data-source/pattern/alerts/hipaa/hipaa-data-source';
import { AlertsDataSourceRepository } from '../../../common/data-source';
import { WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY } from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards';

export const DashboardHIPAA = createDashboard({
  DataSource: HIPAADataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  getDashboardPanels: [
    {
      getDashboardPanels: getDashboardPanels,
      id: 'hipaa-dashboard-tab',
      title: 'HIPAA dashboard',
      description: 'Dashboard of the HIPAA',
      hidePanelTitles: false,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
