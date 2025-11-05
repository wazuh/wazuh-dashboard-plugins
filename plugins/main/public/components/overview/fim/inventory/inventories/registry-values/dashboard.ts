import { FimRegistryValuesDashboardByRendererConfig } from '../../../../../../../common/dashboards/vis-definitions/overview/fim/registry-values/dashboard';

export const getDashboard = (indexPatternId: string) => {
  return new FimRegistryValuesDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
