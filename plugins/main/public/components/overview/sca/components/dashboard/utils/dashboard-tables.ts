import {
  SCATablesDashboardConfig
} from '../../../../../../../common/dashboards/dashboard-definitions/overview/sca/tables/dashboard';

export const getDashboardTables = (indexPatternId: string) => {
  return new SCATablesDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
