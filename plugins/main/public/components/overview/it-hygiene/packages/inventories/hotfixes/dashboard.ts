import { ITHygienePackagesInventoriesHotFixesDashboardConfig } from "../../../../../../../common/dashboards/vis-definitions/overview/it-hygiene/packages/inventories/hotfixes/dashboard";

export const getOverviewPackagesHotfixesTab = (indexPatternId: string) => {
  return new ITHygienePackagesInventoriesHotFixesDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
