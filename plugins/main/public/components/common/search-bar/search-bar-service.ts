import { getPlugins } from '../../../kibana-services';
import {
  IndexPattern,
  OpenSearchQuerySortValue,
} from '../../../../../../src/plugins/data/public';
import { SearchResponse } from '../../../../../../src/core/server';
import { tFilter, tSearchParams } from '../data-source/index';
import dateMath from '@elastic/datemath';

export type SearchParams = {
  indexPattern: IndexPattern;
} & tSearchParams;

export const search = async (
  params: SearchParams,
): Promise<SearchResponse | void> => {
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
  const fromField =
    (pagination?.pageIndex || 0) * (pagination?.pageSize || 100);
  const sortOrder: OpenSearchQuerySortValue[] =
    sorting?.columns.map(column => {
      const sortDirection = column.direction === 'asc' ? 'asc' : 'desc';
      return { [column?.id || '']: sortDirection } as OpenSearchQuerySortValue;
    }) || [];
  let filters = defaultFilters;

  // check if dateRange is defined
  if (params.dateRange && params.dateRange?.from && params.dateRange?.to) {
    // when the from and to are equal, the to is now
    /* ToDo: Search the OSD date range parser, to prevent this change and fix
        when the fllter is "Today" and "This week". In those ranges the filter to and from are the same
        Today: from: now/d, to: now/d
        This Week: from: now/w to:now/w
    */
    if (params.dateRange.from === params.dateRange.to) {
      params.dateRange.to = 'now';
    }
    const { from, to } = params.dateRange;

    filters = [
      ...filters,
      {
        // @ts-ignore
        range: {
          [indexPattern.timeFieldName || 'timestamp']: {
            gte: dateMath.parse(from).toISOString(),
            lte: dateMath.parse(to).toISOString(),
            format: 'strict_date_optional_time',
          },
        },
      },
    ];
  }

  if (aggs) {
    searchSource.setField('aggs', aggs);
  }

  const searchParams = searchSource
    .setParent(undefined)
    .setField('filter', filters)
    .setField('query', query)
    .setField('sort', sortOrder)
    .setField('size', pagination?.pageSize)
    .setField('from', fromField)
    .setField('index', indexPattern);

  // add fields
  if (fields && Array.isArray(fields) && fields.length > 0) {
    searchParams.setField('fields', fields);
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

export const hideCloseButtonOnFixedFilters = (
  filters: tFilter[],
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
          value: filter.meta?.params?.query || filter.meta?.value,
        };
      }
    })
    .filter(filter => filter);

  elements.forEach((element, index) => {
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
    if (filter) {
      // hide the remove button
      const iconButton = element.querySelector(
        '.euiBadge__iconButton',
      ) as HTMLElement;
      iconButton?.style?.setProperty('display', 'none');
      // change the cursor to not-allowed
      const badgeButton = element.querySelector(
        '.euiBadge__content .euiBadge__childButton',
      ) as HTMLElement;
      badgeButton?.style?.setProperty('cursor', 'not-allowed');
      // remove the popup on click to prevent the filter from being removed
      element.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
      });
    }
  });
};
