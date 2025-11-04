import {
  buildDashboardKPIPanels,
  getVisStateHistogramBy,
  getVisStateHorizontalBarByField,
} from '../../../../../common/dashboards/lib';

export const getOverviewProcessesProcessesTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'process.name',
      'Top 5 processes',
      'it-hygiene-processes',
      { fieldCustomLabel: 'Processes' },
    ),
    getVisStateHistogramBy(
      indexPatternId,
      'process.start',
      'Processes start time',
      'it-hygiene-processes',
      'h',
      { addLegend: false, customLabel: ' ', valueAxesTitleText: '' },
    ),
  ]);
};
