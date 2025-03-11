import { IndexPattern } from 'src/plugins/data/public';
import {
  TFilter,
  IFilterManagerService,
  IQueryService,
  ISearchContext,
  ISearchContextConfig,
  QueryResult,
  SearchParams,
} from './types';
import { FilterManagerService } from './filter-manager-service';
import { QueryService } from './query-service';

export type QuerySearchParams = Omit<
  SearchParams,
  'indexPatternID' | 'filters'
>;

export class SearchContext implements ISearchContext {
  private readonly filterManagerService: IFilterManagerService =
    new FilterManagerService();
  private readonly queryService: IQueryService;
  private readonly indexPattern: IndexPattern;
  readonly CONTEXTID: string;

  constructor({
    indexPattern,
    fixedFilters,
    contextId,
    searchService,
  }: ISearchContextConfig) {
    if (!indexPattern) {
      throw new Error('Index pattern is required');
    }

    this.indexPattern = indexPattern;
    this.queryService = new QueryService(searchService);
    this.filterManagerService.setFixedFilters(fixedFilters);
    this.CONTEXTID = contextId || indexPattern?.id;
  }

  setUserFilters(filters: any[]): void {
    this.filterManagerService.setUserFilters(filters);
  }

  clearUserFilters(): void {
    this.filterManagerService.clearUserFilters();
  }

  getUserFilters(): TFilter[] {
    return this.filterManagerService.getUserFilters();
  }

  setFixedFilters(filters: any[]): void {
    this.filterManagerService.setFixedFilters(filters);
  }

  getFixedFilters(): TFilter[] {
    return this.filterManagerService.getFixedFilters();
  }

  clearFixedFilters(): void {
    this.filterManagerService.clearFixedFilters();
  }

  getAllFilters(): TFilter[] {
    return this.filterManagerService.getAllFilters();
  }

  async executeQuery(params?: QuerySearchParams): Promise<QueryResult> {
    const searchParams: SearchParams = {
      ...params,
      indexPattern: this.indexPattern,
      filters: this.getAllFilters(),
    };

    return await this.queryService.executeQuery(searchParams);
  }

  async refreshQuery(): Promise<QueryResult> {
    return await this.queryService.refreshQuery();
  }
}
