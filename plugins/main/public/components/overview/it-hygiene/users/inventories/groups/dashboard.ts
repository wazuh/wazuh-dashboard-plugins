import { ITHygieneUsersInventoriesGroupsDashboardPanelsService } from '../../../../../../../common/dashboards/vis-definitions/overview/it-hygiene/users/inventories/groups/dashboard';

export const getOverviewUsersGroupsTab = (indexPatternId: string) => {
  return ITHygieneUsersInventoriesGroupsDashboardPanelsService.getDashboardPanels(
    indexPatternId,
  );
};
