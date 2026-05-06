export const getLastAlertsQuery = (
  currentIndexPattern: string,
  clusterValue: string,
  ruleLevel: string,
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
        term: {
          'rule.level': ruleLevel,
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
