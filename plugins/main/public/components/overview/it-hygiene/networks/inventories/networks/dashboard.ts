import { ITHygieneNetworksInventoriesNetworksDashboardConfig } from '../../../../../../../common/dashboards/vis-definitions/overview/it-hygiene/networks/inventories/networks/dashboard';

export const getOverviewNetworksNetworksTab = (indexPatternId: string) => {
  return new ITHygieneNetworksInventoriesNetworksDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
