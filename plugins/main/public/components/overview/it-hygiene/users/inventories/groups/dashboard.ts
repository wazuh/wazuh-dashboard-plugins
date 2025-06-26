import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { STYLE } from '../../../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../../../common/saved-vis/create-saved-vis-data';
import { getVisStateHorizontalBarSplitSeries } from '../../../../../../services/visualizations';
import { getVisStateHorizontalBarByField } from '../../../common/saved-vis/generators';
import { SavedVis } from '../../../common/types';

const getVisStateUniqueGroupsMetric = (indexPatternId: string): SavedVis => {
  return {
    id: 'it-hygiene-groups-unique-count',
    title: 'Unique groups',
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
            field: 'group.name',
            customLabel: 'Unique groups',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

export const getOverviewUsersGroupsTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'group.is_hidden',
      'Groups is hidden',
      'it-hygiene-groups',
      {
        fieldSize: 4,
        otherBucket: 'Others',
        metricCustomLabel: 'Groups is hidden count',
        valueAxesTitleText: ' ',
        seriesLabel: 'Type',
        seriesMode: 'stacked',
        fieldCustomLabel: 'Type',
      },
    ),
    getVisStateUniqueGroupsMetric(indexPatternId),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'group.name',
      'Top 5 groups',
      'it-hygiene-groups',
      { customLabel: 'Group name' },
    ),
  ]);
};
