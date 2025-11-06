import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import { ITHygieneTablesDashboardPanelsService } from '../../../../../common/dashboards/dashboard-definitions/overview/it-hygiene/tables/dashboard';

export const getDashboardTables = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return ITHygieneTablesDashboardPanelsService.getDashboardPanels(
    indexPatternId,
  );
};
