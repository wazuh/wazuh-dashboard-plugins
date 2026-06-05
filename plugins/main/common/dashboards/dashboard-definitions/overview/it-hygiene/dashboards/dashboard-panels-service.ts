import type { DashboardByRendererPanels } from '../../../../types';
import { ITHygieneOverviewDashboardConfig } from './overview/dashboard';
import { ITHygienePinnedAgentDashboardConfig } from './pinned-agent/dashboard';

export class ITHygieneDashboardPanelsService {
  private static getOverviewDashboardPanels = (
    indexPatternId: string,
  ): DashboardByRendererPanels => {
    return new ITHygieneOverviewDashboardConfig(
      indexPatternId,
    ).getDashboardPanels();
  };
  private static getAgentDashboardPanels = (
    indexPatternId: string,
  ): DashboardByRendererPanels => {
    return new ITHygienePinnedAgentDashboardConfig(
      indexPatternId,
    ).getDashboardPanels();
  };

  public static getDashboardPanels(
    indexPatternId: string,
    isPinnedAgent: boolean,
  ): DashboardByRendererPanels {
    return isPinnedAgent
      ? this.getAgentDashboardPanels(indexPatternId)
      : this.getOverviewDashboardPanels(indexPatternId);
  }
}
