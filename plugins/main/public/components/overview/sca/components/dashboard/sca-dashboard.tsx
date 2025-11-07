import React from 'react';
import { compose } from 'redux';
import { withErrorBoundary } from '../../../../common/hocs';
import {
  SCAStatesDataSource,
  SCAStatesDataSourceRepository,
} from '../../../../common/data-source/pattern/sca';
import { createDashboard } from '../../../../common/dashboards';
import { withSCADataSource } from '../../hocs/validate-sca-states-index-pattern';
import {
  CONFIGURATION_ASSESSMENT_DASHBOARD_ID,
  WAZUH_SAMPLE_SECURITY_CONFIGURATION_ASSESSMENT,
  CONFIGURATION_ASSESSMENT_AGENT_DASHBOARD_ID,
} from '../../../../../../common/constants';

export const SCADashboard = compose(
  withErrorBoundary,
  withSCADataSource,
)(
  createDashboard({
    DataSource: SCAStatesDataSource,
    DataSourceRepositoryCreator: SCAStatesDataSourceRepository,
    getDashboardPanels: [
      {
        dashboardId: CONFIGURATION_ASSESSMENT_DASHBOARD_ID,
        agentDashboardId: CONFIGURATION_ASSESSMENT_AGENT_DASHBOARD_ID,
      },
    ],
    sampleDataWarningCategories: [
      WAZUH_SAMPLE_SECURITY_CONFIGURATION_ASSESSMENT,
    ],
  }),
);
