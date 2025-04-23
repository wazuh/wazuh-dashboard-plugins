import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { STYLE } from '../../../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../../../common/saved-vis/create-saved-vis-data';
import { SavedVis } from '../../../common/types';

const getVisStateAverageMetric = (
  indexPatternId: string,
  field: string,
  customLabel: string,
): SavedVis => {
  return {
    id: `it-hygiene-network-${field}`,
    title: `Average ${field}`,
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
          type: 'avg',
          params: {
            field,
            customLabel,
          },
          schema: 'metric',
        },
      ],
    },
  };
};

export const getOverviewSystemHardwareTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateAverageMetric(
      indexPatternId,
      'host.cpu.cores',
      'Average CPU cores',
    ),
    getVisStateAverageMetric(
      indexPatternId,
      'host.cpu.speed',
      'Average CPU speed',
    ),
    getVisStateAverageMetric(
      indexPatternId,
      'host.memory.used',
      'Average Memory used',
    ),
  ]);
};
