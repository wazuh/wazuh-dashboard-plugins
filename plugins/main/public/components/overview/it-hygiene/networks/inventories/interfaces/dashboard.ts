import { ITHygieneNetworksInventoriesInterfacesDashboardConfig } from "../../../../../../../common/dashboards/dashboard-definitions/overview/it-hygiene/networks/inventories/interfaces/dashboard";

export const getOverviewNetworksInterfacesTab = (indexPatternId: string) => {
  return new ITHygieneNetworksInventoriesInterfacesDashboardConfig(indexPatternId).getDashboardPanels();
};
