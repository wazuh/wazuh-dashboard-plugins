import { ITHygieneProcessesDashboardConfig } from '../../../../../common/dashboards/vis-definitions/overview/it-hygiene/processes/dashboard';

export const getOverviewProcessesProcessesTab = (indexPatternId: string) => {
  return new ITHygieneProcessesDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
