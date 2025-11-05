import { ITHygieneNetworksInventoriesDashboardByRendererConfig } from "../../../../../../../common/dashboards/vis-definitions/overview/it-hygiene/networks/inventories/dashboard";

export const getOverviewNetworksInterfacesTab = (indexPatternId: string) => {
  return new ITHygieneNetworksInventoriesDashboardByRendererConfig(indexPatternId).getDashboardPanels();
};
