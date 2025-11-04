import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarByField,
  getVisStateHorizontalBarSplitSeries,
} from '../../../../../../../common/dashboards/lib';

export const getOverviewSystemSystemTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarByField(
      indexPatternId,
      'host.os.platform',
      'Top 5 platforms',
      'it-hygiene-system',
      { fieldCustomLabel: 'Platforms' },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'host.os.name',
      'Top 5 operating systems',
      'it-hygiene-system',
      { fieldCustomLabel: 'OS' },
    ),
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'host.architecture',
      'Architecture',
      'it-hygiene-system',
      {
        fieldSize: 4,
        otherBucket: 'Others',
        metricCustomLabel: 'Host architecture count',
        valueAxesTitleText: ' ',
        fieldCustomLabel: 'Host architecture',
        seriesLabel: 'Host architecture',
      },
    ),
  ]);
};
