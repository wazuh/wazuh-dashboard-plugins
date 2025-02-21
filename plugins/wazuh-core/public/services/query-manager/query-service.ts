import { SearchResponse } from 'src/core/server';
import { IndexPattern } from '../../../../../src/plugins/data/public';
import { TFilter, IQueryService } from './types';
import { search, SearchParams } from './search-service';

export class QueryService implements IQueryService {
  constructor(private readonly searchService: IndexPatternsContract) {}

  async executeQuery(
    indexPattern: IndexPattern,
    filters: TFilter[],
  ): Promise<SearchResponse> {
    const params: SearchParams = {
      indexPattern: indexPattern as IndexPattern,
      filters: filters,
      filePrefix: 'events',
    };

    return await search(params, this.searchService);
  }

  async refreshQuery(): Promise<SearchResponse> {
    throw new Error('Method not implemented.');
  }
}
