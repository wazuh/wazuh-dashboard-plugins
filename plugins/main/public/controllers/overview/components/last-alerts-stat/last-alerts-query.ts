export const getLastAlertsQuery = (
  currentIndexPattern: string,
  clusterValue: string,
  ruleLevelRange: {
    minRuleLevel: number;
    maxRuleLevel?: number;
  },
) => {
  const clusterField = 'cluster.name';
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
            lte: ruleLevelRange.maxRuleLevel,
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
