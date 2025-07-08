import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { getVisStateHorizontalBarByField } from '../../../common/saved-vis/generators';
import { getVisStateHorizontalBarSplitSeries } from '../../../../../../services/visualizations';

export const getOverviewProcessesPortTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'source.port',
      'Top 5 source ports',
      'it-hygiene-ports',
      {
        fieldSize: 5,
        metricCustomLabel: 'Top ports count',
        valueAxesTitleText: ' ',
        seriesLabel: 'Top ports',
        seriesMode: 'normal',
        fieldCustomLabel: 'Top ports',
      },
    ),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'network.transport',
      'Transport protocols',
      'it-hygiene-ports',
      {
        fieldSize: 4,
        otherBucket: 'Others',
        metricCustomLabel: 'Transport protocols count',
        valueAxesTitleText: ' ',
        seriesLabel: 'Transport protocols',
        seriesMode: 'stacked',
        fieldCustomLabel: 'Transport protocols',
      },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'process.name',
      'Top 5 processes',
      'it-hygiene-ports',
      { customLabel: 'Processes' },
    ),
  ]);
};
