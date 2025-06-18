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
      'Most common KBs',
      'it-hygiene-hotfixes',
      { customLabel: 'KBs' },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'package.hotfix.name',
      'Least common KBs',
      'it-hygiene-hotfixes',
      { customLabel: 'KBs', orderAggregation: 'asc' },
    ),
  ]);
};
