import React from 'react';
import { getDashboardPanels } from './dashboard_panels';
import { getKPIsPanel } from './dashboard_panels_kpis';
import { AlertsDataSourceRepository } from '../../../common/data-source';
import { Office365DataSource } from '../../../common/data-source/pattern/alerts/office-365/office-365-data-source';
import { WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY } from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards/dashboard';

export const DashboardOffice365 = createDashboard({
  DataSource: Office365DataSource,
  DataSourceRepositoryCreator: AlertsDataSourceRepository,
  getDashboardPanels: [
    {
      getDashboardPanels: getKPIsPanel,
      id: 'kpis-th-dashboard-tab',
      title: 'KPIs Office 365 dashboard',
      description: 'KPIs Dashboard of the Office 365',
      hidePanelTitles: true,
    },
    {
      getDashboardPanels: getDashboardPanels,
      id: 'office-365-detector-dashboard-tab',
      title: 'Office 365 detector dashboard',
      description: 'Dashboard of the Office 365',
      hidePanelTitles: false,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
