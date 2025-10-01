import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { getVisStateMetricUniqueCountByField } from '../../../common/saved-vis/generators';
import {
  getVisStateHorizontalBarSplitSeries,
  getVisStateHorizontalBarByField,
} from '../../../../../../services/visualizations';


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
