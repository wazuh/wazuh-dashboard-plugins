import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  PCIOverviewDashboardByRendererConfig,
  PCIPinnedAgentDashboardByRendererConfig,
} from '../../../../../common/dashboards/vis-definitions/overview/pci/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const pciDashboardConfig = isPinnedAgent
    ? new PCIPinnedAgentDashboardByRendererConfig(indexPatternId)
    : new PCIOverviewDashboardByRendererConfig(indexPatternId);

  return pciDashboardConfig.getDashboardPanels();
};
