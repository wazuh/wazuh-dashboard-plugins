import {
  ActiveResponsesDataSource,
  ActiveResponsesDataSourceRepository,
} from '../../../common/data-source';
import {
  ACTIVE_RESPONSES_DASHBOARD_ID,
  ACTIVE_RESPONSES_AGENT_DASHBOARD_ID,
} from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards';

export const DashboardActiveResponses = createDashboard({
  DataSource: ActiveResponsesDataSource,
  DataSourceRepositoryCreator: ActiveResponsesDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: ACTIVE_RESPONSES_DASHBOARD_ID,
      agentDashboardId: ACTIVE_RESPONSES_AGENT_DASHBOARD_ID,
    },
  ],
});
