import { OpenSearchQuerySortValue } from 'src/plugins/data/public';
import { SearchResponse } from 'src/core/server';
import dateMath from '@elastic/datemath';
import { parse } from 'query-string';
import { DataService, SearchParams } from './types';

enum SEARCHFIELD {
  FILTER = 'filter',
  QUERY = 'query',
  SORT = 'sort',
  SIZE = 'size',
  FROM = 'from',
  INDEX = 'index',
  FIELDS = 'fields',
  AGGS = 'aggs',
}

const DEFAULT_PAGE_SIZE = 100;
const MAX_ENTRIES_PER_QUERY = 10000;

// ///////////////////////////////////////////////////////////////////////////////////////
// This methods are used to use correcty the forceNow setting in the date range picker
// ///////////////////////////////////////////////////////////////////////////////////////

/**
 * Parse the query string and return an object with the query parameters
 */
function parseQueryString() {
  // window.location.search is an empty string
  // get search from href
  const hrefSplit = globalThis.location.href.split('?');

  if (hrefSplit.length <= 1) {
    return {};
  }

  return parse(hrefSplit[1], { sort: false });
}

/**
 * Get the forceNow query parameter
 */
export function getForceNow() {
  const forceNow = parseQueryString().forceNow as string;

  if (!forceNow) {
    return;
  }

  const ticks = Date.parse(forceNow);

  if (Number.isNaN(ticks)) {
    throw new TypeError(
      `forceNow query parameter, ${forceNow}, can't be parsed by Date.parse`,
    );
  }

  return new Date(ticks);
}

// //////////////////////////////////////////////////////////////////////////////////

export const search = async (
  params: SearchParams,
  searchService: DataService['search'],
): Promise<SearchResponse> => {
  const {
    indexPattern,
    filters: defaulTFilters = [],
    query,
    pagination,
    sorting,
    fields,
    aggs,
  } = params;

  if (!indexPattern) {
    throw new Error('Index pattern is required');
  }

  const searchSource = await searchService?.searchSource?.create();
  const paginationPageSize = pagination?.pageSize || DEFAULT_PAGE_SIZE;
  const fromField = (pagination?.pageIndex || 0) * paginationPageSize;
  // If the paginationPageSize + the offset exceeds the 10000 result limit of OpenSearch, truncates the page size
  // to avoid an exception
  const pageSize =
    paginationPageSize + fromField < MAX_ENTRIES_PER_QUERY
      ? paginationPageSize
      : MAX_ENTRIES_PER_QUERY - fromField;
  const sortOrder: OpenSearchQuerySortValue[] =
    sorting?.columns?.map(column => {
      const sortDirection = column.direction === 'asc' ? 'asc' : 'desc';

      return { [column?.id]: sortDirection } as OpenSearchQuerySortValue;
    }) || [];
  let filters = defaulTFilters;

  // check if dateRange is defined
  if (params.dateRange && params.dateRange?.from && params.dateRange?.to) {
    const { from, to } = params.dateRange;

    filters = [
      ...filters,
      {
        range: {
          [indexPattern.timeFieldName]: {
            gte: dateMath.parse(from).toISOString(),
            /* roundUp: true is used to transform the osd dateform to a generic date format
              For instance: the "This week" date range in the date picker.
              To: now/w
              From: now/w
              Without the roundUp the to and from date will be the same and the search will return no results or error

              - src/plugins/data/common/query/timefilter/get_time.ts
            */
            lte: dateMath
              .parse(to, { roundUp: true, forceNow: getForceNow() })
              .toISOString(),
            format: 'strict_date_optional_time',
          },
        },
      },
    ];
  }

  const searchParams = searchSource
    .setParent(undefined)
    .setField(SEARCHFIELD.FILTER, filters)
    .setField(SEARCHFIELD.QUERY, query)
    .setField(SEARCHFIELD.SORT, sortOrder)
    .setField(SEARCHFIELD.SIZE, pageSize)
    .setField(SEARCHFIELD.FROM, fromField)
    .setField(SEARCHFIELD.INDEX, indexPattern);

  if (fields && Array.isArray(fields) && fields.length > 0) {
    searchParams.setField(SEARCHFIELD.FIELDS, fields);
  }

  if (aggs) {
    searchSource.setField(SEARCHFIELD.AGGS, aggs);
  }

  try {
    return await searchParams.fetch();
  } catch (error) {
    if (error instanceof Error && 'body' in error) {
      throw error.body;
    }

    throw error;
  }
};
