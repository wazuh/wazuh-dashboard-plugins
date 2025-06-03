import {
  getVisStateHorizontalBarSplitSeries,
  getVisStateTable,
} from '../../../../../../services/visualizations';
import { buildDashboardKPIPanels } from '../../../../it-hygiene/common/create-dashboard-panels-kpis';

export const getDashboard = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateTable(
      indexPatternId,
      'registry.path',
      '',
      'registry-keys-inventory',
      {
        size: 5,
        fieldCustomLabel: 'Top 5 registry paths',
      },
    ),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'registry.owner',
      'Registry owners',
      'registry-keys-inventory',
      {
        fieldSize: 4,
        otherBucket: 'Others',
        metricCustomLabel: 'Registry owner count',
        valueAxesTitleText: 'Registry owner count',
        fieldCustomLabel: 'Registry owner',
        seriesLabel: 'Registry owner',
      },
    ),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'registry.group',
      'Registry groups',
      'registry-keys-inventory',
      {
        fieldSize: 4,
        otherBucket: 'Others',
        metricCustomLabel: 'Registry groups count',
        valueAxesTitleText: 'Registry groups count',
        fieldCustomLabel: 'Registry group',
        seriesLabel: 'Registry group',
      },
    ),
  ]);
};
