import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { getVisStateHorizontalBarByField } from '../../../common/saved-vis/generators';

export const getOverviewBrowserExtensionsTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'browser.name',
      'Top 5 browsers',
      'it-hygiene-browsers-name',
      { customLabel: 'Browsers' },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'package.name',
      'Top 5 packages',
      'it-hygiene-packages-name',
      { customLabel: 'Packages' },
    ),
  ]);
};
