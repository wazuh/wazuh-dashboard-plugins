import { ITHygieneUsersInventoriesUsersDashboardPanelsService } from '../../../../../../../common/dashboards/dashboard-definitions/overview/it-hygiene/users/inventories/users/dashboard';

export const getOverviewUsersUsersTab = (indexPatternId: string) => {
  return ITHygieneUsersInventoriesUsersDashboardPanelsService.getDashboardPanels(
    indexPatternId,
  );
};
