/* WARNING: The panel id must be unique including general and agents visualizations. Otherwise, the visualizations will not refresh when we pin an agent, because they are cached by id */

import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  ThreatHuntingOverviewDashboardConfig,
  ThreatHuntingPinnedAgentDashboardConfig,
} from '../../../../../common/dashboards/dashboard-definitions/overview/threat-hunting/dashboard';

/* Definitiion of panels */

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const panels = isPinnedAgent
    ? new ThreatHuntingPinnedAgentDashboardConfig(
        indexPatternId,
      ).getDashboardPanels()
    : new ThreatHuntingOverviewDashboardConfig(
        indexPatternId,
      ).getDashboardPanels();

  return panels;
};
