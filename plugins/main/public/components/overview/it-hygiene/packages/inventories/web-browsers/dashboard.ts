import { ITHygienePackagesInventoriesBrowserExtensionsDashboardByRendererConfig } from '../../../../../../../common/dashboards/vis-definitions/overview/it-hygiene/packages/inventories/browser-extensions/dashboard';

export const getOverviewBrowserExtensionsTab = (indexPatternId: string) => {
  return new ITHygienePackagesInventoriesBrowserExtensionsDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
