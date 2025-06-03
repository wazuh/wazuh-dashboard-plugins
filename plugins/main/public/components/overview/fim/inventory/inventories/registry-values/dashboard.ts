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
      'registry-values-inventory',
      {
        size: 5,
        fieldCustomLabel: 'Top 5 registry paths',
      },
    ),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'registry.data.type',
      'Data types',
      'registry-values-inventory',
      {
        fieldSize: 4,
        otherBucket: 'Others',
        metricCustomLabel: 'Registry data type count',
        valueAxesTitleText: 'Registry data type count',
        fieldCustomLabel: 'Registry data type',
        seriesLabel: 'Registry data type',
      },
    ),
  ]);
};
