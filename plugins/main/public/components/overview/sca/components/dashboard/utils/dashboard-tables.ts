import {
  SCATablesDashboardByRendererConfig
} from '../../../../../../../common/dashboards/vis-definitions/overview/sca/tables/dashboard';

export const getDashboardTables = (indexPatternId: string) => {
  return new SCATablesDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
