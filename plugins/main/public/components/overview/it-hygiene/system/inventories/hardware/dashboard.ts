import { ITHygieneSystemInventoriesHardwareDashboardPanelsService } from '../../../../../../../common/dashboards/dashboard-definitions/overview/it-hygiene/system/inventories/hardware/dashboard';

export const getOverviewSystemHardwareTab = (indexPatternId: string) => {
  return ITHygieneSystemInventoriesHardwareDashboardPanelsService.getDashboardPanels(
    indexPatternId,
  );
};
