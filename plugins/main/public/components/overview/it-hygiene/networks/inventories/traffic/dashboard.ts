import { ITHygieneNetworksInventoriesTrafficDashboardConfig } from '../../../../../../../common/dashboards/dashboard-definitions/overview/it-hygiene/networks/inventories/traffic/dashboard';

export const getOverviewProcessesPortTab = (indexPatternId: string) => {
  return new ITHygieneNetworksInventoriesTrafficDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
