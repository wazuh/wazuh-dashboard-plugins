import {
  getVisStateHorizontalBarSplitSeries,
  getVisStateTableByField,
} from '../../../../../../services/visualizations';
import { buildDashboardKPIPanels } from '../../../../it-hygiene/common/create-dashboard-panels-kpis';

export const getDashboard = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'registry.owner',
      'Top 5 registry owners',
      'registry-keys-inventory',
      {
        fieldSize: 5,
        metricCustomLabel: 'Registry owner count',
        valueAxesTitleText: 'Registry owner count',
        fieldCustomLabel: 'Registry owner',
        seriesLabel: 'Registry owner',
      },
    ),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'registry.group',
      'Top 5 groups',
      'registry-keys-inventory',
      {
        fieldSize: 5,
        metricCustomLabel: 'Registry groups count',
        valueAxesTitleText: 'Registry groups count',
        fieldCustomLabel: 'Registry group',
        seriesLabel: 'Registry group',
      },
    ),
    getVisStateTableByField(
      indexPatternId,
      'registry.path',
      '',
      'registry-keys-inventory',
      { size: 5, fieldCustomLabel: 'Top 5 registry paths' },
    ),
  ]);
};
