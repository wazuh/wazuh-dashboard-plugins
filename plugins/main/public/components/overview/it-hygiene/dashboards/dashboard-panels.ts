import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import { ITHygieneDashboardPanelsService } from '../../../../../common/dashboards/dashboard-definitions/overview/it-hygiene/dashboards/dashboard-panels-service';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  return ITHygieneDashboardPanelsService.getDashboardPanels(
    indexPatternId,
    !!isPinnedAgent,
  );
};
