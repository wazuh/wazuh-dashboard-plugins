import { Filter } from '../../../../../../../../../src/plugins/data/common';

export interface ISearchParams {
  filters?: Filter[];
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

export type TFilter = Filter;
