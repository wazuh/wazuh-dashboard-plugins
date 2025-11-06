import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  PCIOverviewDashboardConfig,
  PCIPinnedAgentDashboardConfig,
} from '../../../../../common/dashboards/dashboard-definitions/overview/pci/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const pciDashboardConfig = isPinnedAgent
    ? new PCIPinnedAgentDashboardConfig(indexPatternId)
    : new PCIOverviewDashboardConfig(indexPatternId);

  return pciDashboardConfig.getDashboardPanels();
};
