import type { DashboardByValuePanels } from '../../../../../common/dashboards';
import {
  PCIOverviewDashboardByRendererConfig,
  PCIPinnedAgentDashboardByRendererConfig,
} from '../../../../../common/dashboards/overview/pci/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByValuePanels => {
  const pciDashboardConfig = isPinnedAgent
    ? new PCIPinnedAgentDashboardByRendererConfig(indexPatternId)
    : new PCIOverviewDashboardByRendererConfig(indexPatternId);

  return pciDashboardConfig.getDashboardPanels();
};
