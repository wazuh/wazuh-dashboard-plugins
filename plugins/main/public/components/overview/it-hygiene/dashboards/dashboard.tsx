import React from 'react';
import { getDashboardPanels } from './dashboard-panels';
import { withErrorBoundary } from '../../../common/hocs';
import { compose } from 'redux';

import {
  SystemInventoryStatesDataSource,
  SystemInventoryStatesDataSourceRepository,
} from '../../../common/data-source';

import { withSystemInventoryDataSource } from '../common/hocs/validate-system-inventory-index-pattern';
import { getDashboardKPIs } from './dashboard-kpi';
import { getDashboardTables } from './dashboard-tables';
import { createDashboard } from '../../../common/dashboards';
import { WAZUH_SAMPLE_INVENTORY_AGENT } from '../../../../../common/constants';

export const DashboardITHygiene = compose(
  withErrorBoundary,
  withSystemInventoryDataSource,
)(
  createDashboard({
    DataSource: SystemInventoryStatesDataSource,
    DataSourceRepositoryCreator: SystemInventoryStatesDataSourceRepository,
    getDashboardPanels: [
      {
        getDashboardPanels: getDashboardKPIs,
        id: 'it-hygiene-dashboard-kpis',
        useMargins: true,
        title: 'IT Hygiene dashboard KPIs',
        description: 'Dashboard of the IT Hygiene KPIs',
        hidePanelTitles: false,
        className: 'wz-dashboard-hide-tables-pagination-export-csv-controls',
      },
      {
        getDashboardPanels: getDashboardTables,
        id: 'it-hygiene-dashboard-tab-filters',
        useMargins: false,
        title: 'IT Hygiene dashboard filters',
        description: 'Dashboard of the IT Hygiene filters',
        hidePanelTitles: true,
        className: 'wz-dashboard-hide-tables-pagination-export-csv-controls',
      },
      {
        getDashboardPanels: getDashboardPanels,
        id: 'it-hygiene-dashboard-tab',
        useMargins: true,
        title: 'IT Hygiene dashboard',
        description: 'Dashboard of the IT Hygiene',
        hidePanelTitles: false,
      },
    ],
    sampleDataWarningCategories: [WAZUH_SAMPLE_INVENTORY_AGENT],
  }),
);
