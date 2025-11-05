import { ITHygieneNetworksInventoriesProtocolsDashboardConfig } from '../../../../../../../common/dashboards/vis-definitions/overview/it-hygiene/networks/inventories/protocols/dashboard';

export const getOverviewNetworksProtocolsTab = (indexPatternId: string) => {
  return new ITHygieneNetworksInventoriesProtocolsDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
