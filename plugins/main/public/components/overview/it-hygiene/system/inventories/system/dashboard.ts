import { ITHygieneSystemInventoriesSystemDashboardPanelsService } from '../../../../../../../common/dashboards/dashboard-definitions/overview/it-hygiene/system/inventories/system/dashboard';

export const getOverviewSystemSystemTab = (indexPatternId: string) => {
  return ITHygieneSystemInventoriesSystemDashboardPanelsService.getDashboardPanels(
    indexPatternId,
  );
};
