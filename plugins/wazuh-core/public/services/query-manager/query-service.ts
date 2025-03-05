import { SearchResponse } from 'src/core/server';
import { IndexPatternsContract } from '../../../../../src/plugins/data/public';
import { IQueryService, SearchParams } from './types';
import { search } from './search-service';

export class QueryService implements IQueryService {
  constructor(private readonly searchService: IndexPatternsContract) {}

  async executeQuery(params?: SearchParams): Promise<SearchResponse> {
    const searchParams: SearchParams = {
      ...params,
      filePrefix: 'events', // ToDo: check if is necessary
    } as SearchParams;

    return await search(searchParams, this.searchService);
  }

  async refreshQuery(params?: SearchParams): Promise<SearchResponse> {
    // ToDo: When will implemented whi solution on the UI. Modify this method so that when the query is refreshed, we ensure that a new query is generated with a different time range.
    this.executeQuery(params);
  }
}
