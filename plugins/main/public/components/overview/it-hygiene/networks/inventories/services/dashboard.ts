import { ITHygieneNetworksInventoriesServicesDashboardConfig } from '../../../../../../../common/dashboards/dashboard-definitions/overview/it-hygiene/networks/inventories/services/dashboard';

export const getOverviewProcessesPortTab = (indexPatternId: string) => {
  return new ITHygieneNetworksInventoriesServicesDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
