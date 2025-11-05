import { ITHygieneProcessesDashboardByRendererConfig } from '../../../../../common/dashboards/vis-definitions/overview/it-hygiene/processes/dashboard';

export const getOverviewProcessesProcessesTab = (indexPatternId: string) => {
  return new ITHygieneProcessesDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
