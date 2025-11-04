import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarByField,
  getVisStateMetricUniqueCountByField,
} from '../../../../../../../common/dashboards/lib';

export const getOverviewUsersGroupsTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'group.name',
      'Top 5 groups',
      'it-hygiene-groups',
      { fieldCustomLabel: 'Groups' },
    ),
    getVisStateMetricUniqueCountByField(
      indexPatternId,
      'group.name',
      'Unique groups',
      'it-hygiene-groups-unique-count',
      'Unique groups',
    ),
  ]);
};
