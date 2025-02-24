import { SearchResponse } from 'src/core/server';
import { Filter } from 'src/plugins/data/common';
import { IndexPattern, DataPublicPluginStart } from 'src/plugins/data/public';

export type TFilter = Filter;
export type QueryResult = SearchResponse;

export type DataService = DataPublicPluginStart;

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
}

export interface QueryManagerConfig {
  indexPatterns: { id: string }[];
}

export interface IQueryService {
  executeQuery: (
    indexPatternId: IndexPattern,
    filters: TFilter,
  ) => Promise<SearchResponse>;
  refreshQuery: () => Promise<SearchResponse>;
}

export interface ICreateSearchContextConfig {
  indexPatternId: string;
  fixedFilters: TFilter[];
  contextId?: string;
  searchService: DataService['search'];
}

export interface IQueryManagerService {
  createSearchContext: (config: ICreateSearchContextConfig) => ISearchContext;
}

export interface IIndexPatternRepository {
  get: (id: string) => Promise<IndexPattern>;
  getAll: () => Promise<IndexPattern[]>;
}
