import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarByField,
} from '../../../../../../../common/dashboards/lib';

export const getOverviewBrowserExtensionsTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'browser.name',
      'Top 5 browsers',
      'it-hygiene-browsers-name',
      { fieldCustomLabel: 'Browsers' },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'package.name',
      'Top 5 packages',
      'it-hygiene-packages-name',
      { fieldCustomLabel: 'Packages' },
    ),
  ]);
};
