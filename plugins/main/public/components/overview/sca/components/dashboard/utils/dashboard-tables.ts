import {
  SCATablesDashboardConfig
} from '../../../../../../../common/dashboards/vis-definitions/overview/sca/tables/dashboard';

export const getDashboardTables = (indexPatternId: string) => {
  return new SCATablesDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
