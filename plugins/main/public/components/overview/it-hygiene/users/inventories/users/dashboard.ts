import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { STYLE } from '../../../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../../../common/saved-vis/create-saved-vis-data';
import { getVisStateHorizontalBarSplitSeries } from '../../../../../../services/visualizations';
import { getVisStateHorizontalBarByField } from '../../../common/saved-vis/generators';
import { SavedVis } from '../../../common/types';

const getVisStateUniqueUsersMetric = (indexPatternId: string): SavedVis => {
  return {
    id: 'it-hygiene-users-unique-count',
    title: 'Unique users',
    type: 'metric',
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
        useRanges: false,
        colorSchema: 'Green to Red',
        metricColorMode: 'None',
        colorsRange: [
          {
            from: 0,
            to: 10000,
          },
        ],
        labels: {
          show: true,
        },
        invertColors: false,
        style: STYLE,
      },
    },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'cardinality',
          params: {
            field: 'user.name',
            customLabel: 'Unique users',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

export const getOverviewUsersUsersTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'user.type',
      'User types',
      'it-hygiene-users',
      {
        fieldSize: 4,
        otherBucket: 'Others',
        metricCustomLabel: 'User types count',
        valueAxesTitleText: ' ',
        seriesLabel: 'Group',
        seriesMode: 'stacked',
        fieldCustomLabel: 'Group',
      },
    ),
    getVisStateUniqueUsersMetric(indexPatternId),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'user.shell',
      'Top 5 user shells',
      'it-hygiene-users',
      { customLabel: 'User shell' },
    ),
  ]);
};
