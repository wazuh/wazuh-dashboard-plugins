import { ITHygienePackagesInventoriesHotFixesDashboardByRendererConfig } from "../../../../../../../common/dashboards/vis-definitions/overview/it-hygiene/packages/inventories/hotfixes/dashboard";

export const getOverviewPackagesHotfixesTab = (indexPatternId: string) => {
  return new ITHygienePackagesInventoriesHotFixesDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
