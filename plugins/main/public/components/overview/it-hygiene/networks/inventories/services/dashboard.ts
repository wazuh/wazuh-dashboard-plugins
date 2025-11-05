import { ITHygieneNetworksInventoriesServicesDashboardByRendererConfig } from '../../../../../../../common/dashboards/vis-definitions/overview/it-hygiene/networks/inventories/services/dashboard';

export const getOverviewProcessesPortTab = (indexPatternId: string) => {
  return new ITHygieneNetworksInventoriesServicesDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
