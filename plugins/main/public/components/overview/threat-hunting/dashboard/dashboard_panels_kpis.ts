import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import { ThreatHuntingKPIsDashboardConfig } from '../../../../../common/dashboards/vis-definitions/overview/threat-hunting/kpis/dashboard';

export const getKPIsPanel = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new ThreatHuntingKPIsDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
