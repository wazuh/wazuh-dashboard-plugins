import {
  getVisStateHorizontalBarSplitSeries,
  getVisStateTable,
} from '../../../../../../services/visualizations';
import { buildDashboardKPIPanels } from '../../../../it-hygiene/common/create-dashboard-panels-kpis';

export const getDashboard = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateTable(indexPatternId, 'file.path', '', 'fim-files-inventory', {
      size: 5,
      fieldCustomLabel: 'Top 5 file paths',
    }),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'file.owner',
      'File owners',
      'fim-files-inventory',
      {
        fieldSize: 4,
        otherBucket: 'Others',
        metricCustomLabel: 'File owner count',
        valueAxesTitleText: ' ',
        seriesLabel: 'File owner count',
        fieldCustomLabel: 'File owner',
      },
    ),
  ]);
};
