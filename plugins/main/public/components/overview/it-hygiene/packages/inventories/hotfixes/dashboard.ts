import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import {
  getVisStateHorizontalBarByField,
  getVisStatePieByField,
} from '../../../common/saved-vis/generators';

export const getOverviewPackagesHotfixesTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStatePieByField(
      indexPatternId,
      'package.hotfix.name',
      'Most common hotfixes',
      'it-hygiene-hotfixes',
    ),
    getVisStatePieByField(
      indexPatternId,
      'package.hotfix.name',
      'Less common hotfixes',
      'it-hygiene-hotfixes',
      'asc',
    ),
  ]);
};
