import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import {
  getVisStateHorizontalBarByField,
  getVisStatePieByField,
} from '../../../common/saved-vis/generators';

export const getOverviewPackagesHotfixesTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'package.hotfix.name',
      'Most common hotfixes',
      'it-hygiene-hotfixes',
      { customLabel: 'Hotfixes' },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'package.hotfix.name',
      'Least common hotfixes',
      'it-hygiene-hotfixes',
      { customLabel: 'Hotfixes', orderAggregation: 'asc' },
    ),
  ]);
};
