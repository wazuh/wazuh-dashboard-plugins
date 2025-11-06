import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  PCIOverviewDashboardConfig,
} from '../../../../../common/dashboards/dashboard-definitions/overview/pci/overview/dashboard';
import { PCIPinnedAgentDashboardConfig } from "../../../../../common/dashboards/dashboard-definitions/overview/pci/pinned-agent/dashboard";

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const pciDashboardConfig = isPinnedAgent
    ? new PCIPinnedAgentDashboardConfig(indexPatternId)
    : new PCIOverviewDashboardConfig(indexPatternId);

  return pciDashboardConfig.getDashboardPanels();
};
