export interface IndexData {
  hits: any[];
  total: number;
}

export abstract class QueryCriteria {
  protected page = 0;
  protected size = 10;
  protected sortFields: string[] = [];

  setPage(page: number): this {
    this.page = page;

    return this;
  }

  setSize(size: number): this {
    this.size = size;

    return this;
  }

  setSortFields(fields: string[]): this {
    this.sortFields = fields;

    return this;
  }

  abstract build(): object;
}

export interface QueryManager {
  fetch: (pattern: string, criteria: QueryCriteria) => Promise<IndexData>;
}
export abstract class QueryManagerFactory {
  abstract createQueryManager(): QueryManager;
  abstract createCriteria(): QueryCriteria;
}
