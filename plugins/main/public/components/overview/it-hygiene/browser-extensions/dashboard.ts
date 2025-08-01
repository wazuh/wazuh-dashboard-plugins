import { buildDashboardKPIPanels } from '../common/create-dashboard-panels-kpis';
import {
  getVisStateHorizontalBarByField,
  getVisStateHistogramBy,
} from '../common/saved-vis/generators';

export const getOverviewBrowserExtensionsTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'extension.name',
      'Top 5 extensions',
      'it-hygiene-extensions-name',
      { customLabel: 'Extensions' },
    ),
    getVisStateHistogramBy(
      indexPatternId,
      'extension.installed',
      'Extensions installed',
      'it-hygiene-extensions-installed',
      'h',
      { addLegend: false, customLabel: ' ', valueAxesTitleText: '' },
    ),
  ]);
};
