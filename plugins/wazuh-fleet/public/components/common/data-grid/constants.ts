import { PaginationOptions } from './types';

export const MAX_ENTRIES_PER_QUERY = 10000;
export const DEFAULT_PAGE_INDEX = 0;
export const DEFAULT_PAGE_SIZE = 15;
export const DEFAULT_PAGE_SIZE_OPTIONS = [DEFAULT_PAGE_SIZE, 25, 50, 100];
export const DEFAULT_PAGINATION_OPTIONS = {
  pageIndex: DEFAULT_PAGE_INDEX,
  pageSize: DEFAULT_PAGE_SIZE,
  pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
} as const satisfies PaginationOptions;
export const ALWAYS_VISIBLE_COLUMNS = ['agent.name'];

export const DATA_GRID_MODE_STICKY = 'sticky';
