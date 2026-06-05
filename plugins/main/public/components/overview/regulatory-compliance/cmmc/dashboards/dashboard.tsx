import { CMMCDataSource } from '../../../../common/data-source/pattern/events/cmmc/cmmc-data-source';
import { FindingsDataSourceRepository } from '../../../../common/data-source';
import {
  CMMC_DASHBOARD_ID,
  CMMC_AGENT_DASHBOARD_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
} from '../../../../../../common/constants';
import { createDashboard } from '../../../../common/dashboards';

export const DashboardCMMC = createDashboard({
  DataSource: CMMCDataSource,
  DataSourceRepositoryCreator: FindingsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: CMMC_DASHBOARD_ID,
      agentDashboardId: CMMC_AGENT_DASHBOARD_ID,
    },
  ],
  sampleDataWarningCategories: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
});
