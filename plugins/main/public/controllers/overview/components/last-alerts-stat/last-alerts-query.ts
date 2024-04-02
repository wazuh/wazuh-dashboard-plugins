export const getLastAlertsQuery = (
  currentIndexPattern: string,
  isClusterEnabled: boolean,
  clusterValue: string,
  ruleLevelRange: {
    minRuleLevel: number;
    maxRuleLevel?: number;
  },
) => {
  const clusterField = isClusterEnabled ? 'cluster.name' : 'manager.name';
  return {
    indexPattern: currentIndexPattern,
    aggs: {
      buckets: {
        terms: {
          field: clusterField,
          size: 5,
          order: {
            _count: 'desc',
          },
        },
      },
    },
    filters: [
      {
        range: {
          timestamp: {
            gte: 'now-24h',
            lte: 'now',
            format: 'epoch_millis',
          },
        },
      },
      {
        range: {
          'rule.level': {
            gte: ruleLevelRange.minRuleLevel,
            lte: ruleLevelRange.maxRuleLevel || 15,
          },
        },
      },
      {
        query: {
          match: {
            [clusterField]: {
              query: clusterValue,
              type: 'phrase',
            },
          },
        },
        $state: {
          store: 'appState',
        },
      },
    ],
  };
};
