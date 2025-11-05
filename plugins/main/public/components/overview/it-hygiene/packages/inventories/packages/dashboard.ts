import { ITHygienePackagesInventoriesPackagesDashboardConfig } from '../../../../../../../common/dashboards/vis-definitions/overview/it-hygiene/packages/inventories/packages/dashboard';

export const getOverviewPackagesPackagesTab = (indexPatternId: string) => {
  return new ITHygienePackagesInventoriesPackagesDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
