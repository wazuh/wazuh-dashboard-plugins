import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarByField,
} from '../../../../../../../common/dashboards/lib';

export const getOverviewPackagesHotfixesTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'package.hotfix.name',
      'Most common KBs',
      'it-hygiene-hotfixes',
      { fieldCustomLabel: 'KBs' },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'package.hotfix.name',
      'Least common KBs',
      'it-hygiene-hotfixes',
      { fieldCustomLabel: 'KBs', orderAggregation: 'asc' },
    ),
  ]);
};
