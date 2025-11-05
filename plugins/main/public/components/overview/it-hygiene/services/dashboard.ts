import { ITHygieneServicesDashboardConfig } from '../../../../../common/dashboards/vis-definitions/overview/it-hygiene/services/dashboard';

export const getOverviewServicesTab = (indexPatternId: string) => {
  return new ITHygieneServicesDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
