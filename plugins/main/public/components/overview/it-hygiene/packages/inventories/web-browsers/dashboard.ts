import { ITHygienePackagesInventoriesBrowserExtensionsDashboardConfig } from '../../../../../../../common/dashboards/dashboard-definitions/overview/it-hygiene/packages/inventories/browser-extensions/dashboard';

export const getOverviewBrowserExtensionsTab = (indexPatternId: string) => {
  return new ITHygienePackagesInventoriesBrowserExtensionsDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
