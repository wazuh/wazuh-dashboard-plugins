import { ClusterConfigurationDashboardConfig } from '../../../../../common/dashboards/vis-definitions';

/* WARNING: The panel id must be unique including general and agents visualizations. Otherwise, the visualizations will not refresh when we pin an agent, because they are cached by id */

/* Overview visualizations */

/* Definition of panels */

export const getDashboardConfigurationPanels = (indexPatternId: string) => {
  return new ClusterConfigurationDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
