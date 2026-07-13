import {
  CasesDataSource,
  FindingsDataSourceRepository,
} from '../../../common/data-source';
import { CASE_MANAGEMENT_DASHBOARD_ID } from '../../../../../common/constants';
import { createDashboard } from '../../../common/dashboards/dashboard';

export const DashboardCaseManagement = createDashboard({
  DataSource: CasesDataSource,
  DataSourceRepositoryCreator: FindingsDataSourceRepository,
  getDashboardPanels: [
    {
      dashboardId: CASE_MANAGEMENT_DASHBOARD_ID,
    },
  ],
});
