import { FimRegistryKeysDashboardByRendererConfig } from '../../../../../../../common/dashboards/vis-definitions/overview/fim/registry-keys/dashboard';

export const getDashboard = (indexPatternId: string) => {
  return new FimRegistryKeysDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
