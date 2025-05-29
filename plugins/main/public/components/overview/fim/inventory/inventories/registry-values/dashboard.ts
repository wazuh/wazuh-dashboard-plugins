import {
  getVisStateHorizontalBarSplitSeries,
  getVisStateTableByField,
} from '../../../../../../services/visualizations';
import { buildDashboardKPIPanels } from '../../../../it-hygiene/common/create-dashboard-panels-kpis';

export const getDashboard = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'registry.data.type',
      'Top 5 data type',
      'registry-values-inventory',
      {
        fieldSize: 5,
        metricCustomLabel: 'Registry data type count',
        valueAxesTitleText: 'Registry data type count',
        fieldCustomLabel: 'Registry data type',
        seriesLabel: 'Registry data type',
      },
    ),
    getVisStateTableByField(
      indexPatternId,
      'registry.path',
      '',
      'registry-values-inventory',
      { size: 5, fieldCustomLabel: 'Top 5 registry paths' },
    ),
  ]);
};
