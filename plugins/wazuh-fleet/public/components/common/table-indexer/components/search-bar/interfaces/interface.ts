import { Filter } from '../../../../../../../../../src/plugins/data/common';
import { Direction } from '../../../../../../../../wazuh-core/common/types';

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
      direction: Direction;
    }[];
  };
  dateRange?: {
    from: string;
    to: string;
  };
  aggs?: any;
}

export type TFilter = Filter;
