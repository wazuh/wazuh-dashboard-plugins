import React from 'react';
import { compose } from 'redux';
import { withErrorBoundary } from '../../../../common/hocs';
import {
  SCAStatesDataSource,
  SCAStatesDataSourceRepository,
} from '../../../../common/data-source/pattern/sca';
import { createDashboard } from '../../../../common/dashboards';
import { getKPIsPanel } from './utils/dashboard-kpis';
import { getDashboardTables } from './utils/dashboard-tables';
import { getDashboardPanels } from './utils/dashboard-panels';
import { withSCADataSource } from '../../hocs/validate-sca-states-index-pattern';
import { WAZUH_SAMPLE_SECURITY_CONFIGURATION_ASSESSMENT } from '../../../../../../common/constants';

export const SCADashboard = compose(
  withErrorBoundary,
  withSCADataSource,
)(
  createDashboard({
    DataSource: SCAStatesDataSource,
    DataSourceRepositoryCreator: SCAStatesDataSourceRepository,
    getDashboardPanels: [
      {
        getDashboardPanels: getKPIsPanel,
        id: 'security-configuration-assessment-kpis',
        title: 'Security Configuration Assessment dashboard KPIs',
        description: 'Dashboard of the SCA KPIs',
        useMargins: true,
        hidePanelTitles: true,
      },
      {
        getDashboardPanels: getDashboardTables,
        id: 'security-configuration-assessment-tables',
        title: 'Security Configuration Assessment dashboard tables',
        description: 'Dashboard of the SCA tables',
        useMargins: false,
        hidePanelTitles: true,
        className: 'wz-dashboard-hide-tables-pagination-export-csv-controls',
      },
      {
        getDashboardPanels: getDashboardPanels,
        id: 'security-configuration-assessment-tables',
        title: 'Security Configuration Assessment dashboard tables',
        description: 'Dashboard of the SCA tables',
        useMargins: true,
        hidePanelTitles: false,
        className: 'wz-dashboard-hide-tables-pagination-export-csv-controls',
      },
    ],
    sampleDataWarningCategories: [
      WAZUH_SAMPLE_SECURITY_CONFIGURATION_ASSESSMENT,
    ],
  }),
);
