import { QueryCriteria } from './types';

export class IndexerQueryCriteria extends QueryCriteria {
  private readonly filters: any[] = [];
  private readonly mustMatch: any[] = [];
  private readonly shouldMatch: any[] = [];

  addFilter(field: string, value: any): this {
    this.filters.push({ term: { [field]: value } });

    return this;
  }

  addMustMatch(field: string, value: any): this {
    this.mustMatch.push({ match: { [field]: value } });

    return this;
  }

  addShouldMatch(field: string, value: any): this {
    this.shouldMatch.push({ match: { [field]: value } });

    return this;
  }

  addRangeFilter(field: string, options: { gte?: any; lte?: any }): this {
    this.filters.push({
      range: {
        [field]: options,
      },
    });

    return this;
  }

  build(): object {
    const query: any = {
      bool: {},
    };

    if (this.filters.length > 0) {
      query.bool.filter = this.filters;
    }

    if (this.mustMatch.length > 0) {
      query.bool.must = this.mustMatch;
    }

    if (this.shouldMatch.length > 0) {
      query.bool.should = this.shouldMatch;
    }

    return {
      from: this.page * this.size,
      size: this.size,
      sort: this.sortFields,
      query,
    };
  }
}
