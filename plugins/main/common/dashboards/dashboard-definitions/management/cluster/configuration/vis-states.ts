import {
  buildIndexPatternReferenceList,
  buildSearchSource,
} from '../../../../lib';
import type { SavedVis } from '../../../../types';

export const getVisStateTop5Nodes = (indexPatternId: string): SavedVis => {
  return {
    id: 'wz-vis-cluster-monitoring-overview-node',
    title: 'Top 5 nodes',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      isDonut: true,
      labels: { show: false, values: true, last_level: true, truncate: 100 },
    },
    uiState: { spy: { mode: { name: 'table' } } },
    data: {
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
      aggs: [
        { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'cluster.node',
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            size: 5,
            order: 'desc',
            orderBy: '1',
          },
        },
      ],
    },
  };
};
