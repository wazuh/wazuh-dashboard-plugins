import { buildDashboardKPIPanels } from '../common/create-dashboard-panels-kpis';
import {
  getVisStateHorizontalBarByField,
  getVisStateMetricUniqueCountByField,
} from '../common/saved-vis/generators';

export const getOverviewServicesTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'service.name',
      'Top 5 services',
      'it-hygiene-services',
      {
        customLabel: 'Services',
      },
    ),
    getVisStateMetricUniqueCountByField(
      indexPatternId,
      'service.name',
      '',
      'it-hygiene-services',
      'Unique services',
    ),
  ]);
};
