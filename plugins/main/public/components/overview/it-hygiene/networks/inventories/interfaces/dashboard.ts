import { ITHygieneNetworksInventoriesInterfacesDashboardByRendererConfig } from "../../../../../../../common/dashboards/vis-definitions/overview/it-hygiene/networks/inventories/interfaces/dashboard";

export const getOverviewNetworksInterfacesTab = (indexPatternId: string) => {
  return new ITHygieneNetworksInventoriesInterfacesDashboardByRendererConfig(indexPatternId).getDashboardPanels();
};
