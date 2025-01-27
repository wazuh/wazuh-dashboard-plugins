import { QueryManagerFactory, QueryManager, QueryCriteria } from './types';
import { IndexerQueryCriteria } from './indexer-query-criteria';
import { IndexerQueryManager } from './indexer-query-manager';

export class IndexerQueryManagerFactory extends QueryManagerFactory {
  client = {
    search: async (_params: any) => ({
      hits: {
        hits: [],
        total: {
          value: 0,
        },
      },
    }),
  };

  createQueryManager(): QueryManager {
    return new IndexerQueryManager(this.client);
  }

  createCriteria(): QueryCriteria {
    return new IndexerQueryCriteria();
  }
}
