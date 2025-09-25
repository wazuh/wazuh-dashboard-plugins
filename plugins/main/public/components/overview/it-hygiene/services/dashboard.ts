import { buildDashboardKPIPanels } from '../common/create-dashboard-panels-kpis';
import { getVisStateHorizontalBarByField } from '../common/saved-vis/generators';

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
    getVisStateHorizontalBarByField(
      indexPatternId,
      'process.user.name',
      'Top 5 process user names',
      'it-hygiene-services',
      {
        customLabel: 'User Names',
      },
    ),
  ]);
};
