import { QueryManager, IndexData, QueryCriteria } from './types';

export class IndexerQueryManager implements QueryManager {
  private readonly client: any;

  constructor(client: any) {
    this.client = client;
  }

  async fetch(pattern: string, criteria: QueryCriteria): Promise<IndexData> {
    const response = await this.client.search({
      index: pattern,
      body: criteria.build(),
    });

    return {
      hits: response.hits.hits,
      total: response.hits.total.value,
    };
  }
}
