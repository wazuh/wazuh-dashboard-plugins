import type { DashboardByValueSavedVis } from "../../../../../common/dashboards";
import {
  AWSAgentPinnedDashboardLayoutConfig,
  AWSOverviewDashboardLayoutConfig,
} from '../../../../../common/dashboards/overview/aws/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByValueSavedVis[] => {
  const dashboardLayoutConfig = isPinnedAgent
    ? new AWSAgentPinnedDashboardLayoutConfig(indexPatternId)
    : new AWSOverviewDashboardLayoutConfig(indexPatternId);

  return dashboardLayoutConfig.getSavedVisualizations();
};
