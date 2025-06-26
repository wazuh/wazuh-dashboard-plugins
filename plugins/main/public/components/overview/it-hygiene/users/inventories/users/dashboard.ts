import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { STYLE } from '../../../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../../../common/saved-vis/create-saved-vis-data';
import {
  getVisStateHorizontalBarSplitSeries,
  getVisStateHorizontalBarByField,
} from '../../../../../../services/visualizations';
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
    getVisStateHorizontalBarByField(
      indexPatternId,
      'user.name',
      'Top 5 user auth failures count',
      'it-hygiene-users',
      {
        metricType: 'max',
        metricField: 'user.auth_failures.count',
        fieldCustomLabel: 'Auth failures count',
      },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'user.groups',
      'Top 5 user groups',
      'it-hygiene-users',
      { fieldCustomLabel: 'User group' },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'user.shell',
      'Top 5 user shells',
      'it-hygiene-users',
      { fieldCustomLabel: 'User shell' },
    ),
  ]);
};
