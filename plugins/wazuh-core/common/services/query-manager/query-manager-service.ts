import {
  IndexData,
  QueryCriteria,
  QueryManager,
  QueryManagerFactory,
} from './types';

export class QueryManagerService {
  private readonly queryManager: QueryManager;
  private readonly factory: QueryManagerFactory;

  constructor(factory: QueryManagerFactory) {
    this.factory = factory;
    this.queryManager = factory.createQueryManager();
  }

  createCriteria(): QueryCriteria {
    return this.factory.createCriteria();
  }

  async fetch(pattern: string, criteria: QueryCriteria): Promise<IndexData> {
    try {
      return await this.queryManager.fetch(pattern, criteria);
    } catch (error) {
      if (error instanceof Error) {
        throw new TypeError(`Error fetching index pattern: ${error.message}`);
      } else {
        throw new TypeError('Error fetching index pattern: unknown error');
      }
    }
  }
}
