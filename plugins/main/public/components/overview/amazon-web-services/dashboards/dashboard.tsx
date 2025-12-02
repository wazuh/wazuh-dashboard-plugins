import React, { useEffect, useState } from 'react';
import './styles.scss';
import {
  EventsDataSourceRepository,
  AWSDataSource,
} from '../../../common/data-source';
import {
  AMAZON_WEB_SERVICES_DASHBOARD_ID,
  AMAZON_WEB_SERVICES_AGENT_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards';

export const DashboardAWS = createDashboard({
  DataSource: AWSDataSource,
  DataSourceRepositoryCreator: EventsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: AMAZON_WEB_SERVICES_DASHBOARD_ID,
      agentDashboardId: AMAZON_WEB_SERVICES_AGENT_DASHBOARD_ID,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
