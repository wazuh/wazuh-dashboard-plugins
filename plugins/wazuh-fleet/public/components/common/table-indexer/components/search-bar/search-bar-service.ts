import dateMath from '@elastic/datemath';
import { parse } from 'query-string';
import {
  IndexPattern,
  OpenSearchQuerySortValue,
  TimeRange,
} from '../../../../../../../../src/plugins/data/public';
import { SearchResponse } from '../../../../../../../../src/core/server';
import { getPlugins } from '../../../../../plugin-services';
import { TFilter, ISearchParams } from './interfaces/interface';

const MAX_ENTRIES_PER_QUERY = 10000;
const DEFAULT_PAGE_SIZE = 100;

export type SearchParams = {
  indexPattern: IndexPattern;
  filePrefix: string;
} & ISearchParams;

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

export function transformDateRange(dateRange: TimeRange) {
  return {
    from: dateMath.parse(dateRange.from).toISOString(),
    to: dateMath
      .parse(dateRange.to, { roundUp: true, forceNow: getForceNow() })
      .toISOString(),
  };
}

// //////////////////////////////////////////////////////////////////////////////////

export const search = async (params: SearchParams): Promise<SearchResponse> => {
  const {
    indexPattern,
    filters: defaultFilters = [],
    query,
    pagination,
    sorting,
    fields,
    aggs,
  } = params;

  if (!indexPattern) {
    return;
  }

  const data = getPlugins().data;
  const searchSource = await data.search.searchSource.create();
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

      return { [column?.id || '']: sortDirection } as OpenSearchQuerySortValue;
    }) || [];
  let filters = defaultFilters;

  // check if dateRange is defined
  if (params.dateRange && params.dateRange?.from && params.dateRange?.to) {
    const { from, to } = params.dateRange;

    filters = [
      ...filters,
      {
        range: {
          [indexPattern.timeFieldName || 'timestamp']: {
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
    .setField('filter', filters)
    .setField('query', query)
    .setField('sort', sortOrder)
    .setField('size', pageSize)
    .setField('from', fromField)
    .setField('index', indexPattern);

  if (fields && Array.isArray(fields) && fields.length > 0) {
    searchParams.setField('fields', fields);
  }

  if (aggs) {
    searchSource.setField('aggs', aggs);
  }

  try {
    return await searchParams.fetch();
  } catch (error) {
    if (error.body) {
      throw error.body;
    }

    throw error;
  }
};

const getValueDisplayedOnFilter = (filter: TFilter) =>
  filter.query?.bool?.minimum_should_match === 1
    ? `is one of ${filter.meta?.value}`
    : filter.meta?.params?.query || filter.meta?.value;

export const hideCloseButtonOnFixedFilters = (
  filters: TFilter[],
  elements: NodeListOf<Element>,
) => {
  const fixedFilters = filters
    .map((filter, index) => {
      if (
        filter.meta.controlledBy &&
        !filter.meta.controlledBy.startsWith('hidden')
      ) {
        return {
          index,
          filter,
          field: filter.meta?.key,
          value: getValueDisplayedOnFilter(filter),
        };
      }
    })
    .filter(Boolean);

  for (const [index, element] of elements.entries()) {
    // the filter badge will be changed only when the field and value are the same and the position in the array is the same
    const filterField = element
      .querySelector('.euiBadge__content .euiBadge__childButton > span')
      ?.textContent?.split(':')[0];
    const filterValue = element.querySelector(
      '.euiBadge__content .globalFilterLabel__value',
    )?.textContent;
    // when the field,value and index is the same, hide the remove button
    const filter = fixedFilters.find(
      filter =>
        filter?.field === filterField &&
        filter?.value === filterValue &&
        filter?.index === index,
    );
    const removeButton = element.querySelector('.euiBadge__iconButton');
    const badgeButton = element.querySelector(
      '.euiBadge__content .euiBadge__childButton',
    ) as HTMLElement;

    if (filter) {
      $(removeButton).addClass('hide-close-button');
      // eslint-disable-next-line @typescript-eslint/naming-convention
      $(removeButton).on('click', event_ => {
        event_.stopPropagation();
      });
      // eslint-disable-next-line @typescript-eslint/naming-convention
      $(badgeButton).on('click', event_ => {
        event_.stopPropagation();
      });
      $(badgeButton).css('cursor', 'not-allowed');
    } else {
      $(removeButton).removeClass('hide-close-button');
      $(removeButton).off('click');
      $(badgeButton).off('click');
      $(badgeButton).css('cursor', 'pointer');
    }
  }
};
