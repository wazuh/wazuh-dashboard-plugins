export const getLastAlertsQuery = (
  currentIndexPattern: string,
  isClusterEnabled: boolean,
  clusterValue: string,
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
        match_all: {},
      },
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
      {
        query: {
          match: {
            'rule.groups': {
              query: 'office365',
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
