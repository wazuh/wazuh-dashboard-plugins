import type { SavedVis } from '../../../types';

export const getVisStateTop5Nodes = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'Wazuh-App-Cluster-monitoring-Overview-Node-Pie',
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
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
        index: indexPatternId,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPatternId,
        },
      ],
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
