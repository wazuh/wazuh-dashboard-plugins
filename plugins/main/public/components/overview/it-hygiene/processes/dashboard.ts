import { ITHygieneProcessesDashboardConfig } from '../../../../../common/dashboards/dashboard-definitions/overview/it-hygiene/processes/dashboard';

export const getOverviewProcessesProcessesTab = (indexPatternId: string) => {
  return new ITHygieneProcessesDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
