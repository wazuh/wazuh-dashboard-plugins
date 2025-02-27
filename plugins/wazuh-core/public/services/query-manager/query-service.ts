import { SearchResponse } from 'src/core/server';
import { IndexPatternsContract } from '../../../../../src/plugins/data/public';
import { IQueryService } from './types';
import { search, SearchParams } from './search-service';

export class QueryService implements IQueryService {
  constructor(private readonly searchService: IndexPatternsContract) { }

  async executeQuery(params?: SearchParams): Promise<SearchResponse> {
    const searchParams: SearchParams = {
      ...params,
      filePrefix: 'events', // ToDo: check if is necessary
    } as SearchParams;

    return await search(searchParams, this.searchService);
  }

  async refreshQuery(params?: SearchParams): Promise<SearchResponse> {
    this.executeQuery(params);
  }
}
