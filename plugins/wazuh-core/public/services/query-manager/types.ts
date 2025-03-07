import { SearchResponse } from 'src/core/server';
import { Filter } from 'src/plugins/data/common';
import { IndexPattern, DataPublicPluginStart } from 'src/plugins/data/public';

export type TFilter = Filter;

export interface ISearchParams {
  filters?: TFilter[];
  query?: any;
  pagination?: {
    pageIndex?: number;
    pageSize?: number;
  };
  fields?: string[];
  sorting?: {
    columns: {
      id: string;
      direction: 'asc' | 'desc';
    }[];
  };
  dateRange?: {
    from: string;
    to: string;
  };
  aggs?: any;
}

export type SearchParams = {
  indexPattern: IndexPattern;
  filePrefix: string;
} & ISearchParams;

export type QueryResult = SearchResponse;

export type DataService = DataPublicPluginStart;

export interface IIndexPatternRepository {
  get: (id: string) => Promise<IndexPattern>;
  getAll: () => Promise<IndexPattern[]>;
}
export interface IFilterManagerService {
  setUserFilters: (filters: TFilter[]) => void;
  clearUserFilters: () => void;
  getUserFilters: () => TFilter[];
  setFixedFilters: (filters: TFilter[]) => void;
  clearFixedFilters: () => void;
  getFixedFilters: () => TFilter[];
  getAllFilters: () => TFilter[];
}

export interface ISearchContextConfig {
  indexPattern: IndexPattern;
  fixedFilters: TFilter[];
  contextId?: string;
  searchService: DataService['search'];
}

export interface ISearchContext {
  executeQuery: () => Promise<SearchResponse>;
  refreshQuery: () => Promise<SearchResponse>;
  setUserFilters: (filters: TFilter[]) => void;
  clearUserFilters: () => void;
  getUserFilters: () => TFilter[];
  setFixedFilters: (filters: TFilter[]) => void;
  clearFixedFilters: () => void;
  getFixedFilters: () => TFilter[];
  getAllFilters: () => TFilter[];
}

export interface IQueryService {
  executeQuery: (params?: SearchParams) => Promise<SearchResponse>;
  refreshQuery: (params?: SearchParams) => Promise<SearchResponse>;
}

export interface QueryManagerFactoryConfig {
  indexPatterns: { id: string }[];
}

export interface ICreateSearchContextConfig {
  indexPatternId: string;
  fixedFilters: TFilter[];
  contextId?: string;
  searchService: DataService['search'];
}

export interface IQueryManagerConfig {
  indexPatterns: { id: string }[];
  dataService: DataService;
  patternsRepository: IIndexPatternRepository;
}

export type TQueyManagerCreateSearchContextConfig = Omit<
  ICreateSearchContextConfig,
  'searchService'
>;

export interface IQueryManagerService {
  createSearchContext: (
    config: TQueyManagerCreateSearchContextConfig,
  ) => Promise<ISearchContext>;
}

export interface IQueryManagerFactory {
  create: (config: QueryManagerFactoryConfig) => Promise<IQueryManagerService>;
}
