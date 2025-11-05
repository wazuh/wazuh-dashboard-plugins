import { ITHygieneUsersInventoriesUsersDashboardPanelsService } from '../../../../../../../common/dashboards/vis-definitions/overview/it-hygiene/users/inventories/users/dashboard';

export const getOverviewUsersUsersTab = (indexPatternId: string) => {
  return ITHygieneUsersInventoriesUsersDashboardPanelsService.getDashboardPanels(
    indexPatternId,
  );
};
