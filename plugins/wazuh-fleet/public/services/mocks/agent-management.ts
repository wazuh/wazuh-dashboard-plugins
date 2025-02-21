import dateMath from '@elastic/datemath';
import { parse } from 'query-string';
import { SearchResponse } from '../../../../../src/core/server';
import { getPlugins } from '../../plugin-services';
import { OpenSearchQuerySortValue } from '../../../../../src/plugins/data/public';

const MAX_ENTRIES_PER_QUERY = 10000;
const DEFAULT_PAGE_SIZE = 100;

export const deleteAgent = (documentId: string | string[]): Promise<any> =>
  new Promise((resolve, reject) => {
    // Simulate API delay
    setTimeout(() => {
      // Simulate random success/error (50% success rate)
      if (Math.random() > 0.5) {
        resolve({
          status: 200,
          body: {
            message: `Agent${Array.isArray(documentId) ? 's' : ''} deleted successfully`,
            data: {
              affected_items: Array.isArray(documentId)
                ? documentId
                : [documentId],
              failed_items: [],
              total_affected_items: Array.isArray(documentId)
                ? documentId.length
                : 1,
              total_failed_items: 0,
            },
          },
        });
      } else {
        reject({
          status: 500,
          body: {
            message: 'Error deleting agent(s)',
            error: 1,
            data: {
              affected_items: [],
              failed_items: Array.isArray(documentId)
                ? documentId
                : [documentId],
              total_affected_items: 0,
              total_failed_items: Array.isArray(documentId)
                ? documentId.length
                : 1,
            },
          },
        });
      }
    }, 1000); // 500ms delay
  });

export const editName = (agentId: string, newName: string): Promise<any> =>
  new Promise((resolve, reject) => {
    // Simulate API delay
    setTimeout(() => {
      // Simulate random success/error (50% success rate)
      if (Math.random() > 0.5) {
        resolve({
          status: 200,
          body: {
            message: `Renamed agent ${agentId} successfully to ${newName}`,
            data: {
              affected_items: [agentId],
              failed_items: [],
              total_affected_items: 1,
              total_failed_items: 0,
            },
          },
        });
      } else {
        reject({
          status: 500,
          body: {
            message: `Error renaming agent ${agentId} to ${newName}`,
            error: 1,
            data: {
              affected_items: [],
              failed_items: [agentId],
              total_affected_items: 0,
              total_failed_items: 1,
            },
          },
        });
      }
    }, 1000); // 500ms delay
  });

export const removeGroups = (
  agentId: string | string[],
  groupIds: string | string[],
): Promise<any> =>
  new Promise((resolve, reject) => {
    // Simulate API delay
    setTimeout(() => {
      // Simulate random success/error (50% success rate)
      if (Math.random() > 0.5) {
        resolve({
          status: 200,
          data: {
            message: `Removed successfully to agent`,
            error: null,
            data: {
              affected_items: [
                {
                  _id: agentId,
                  _source: { agent: { groups: groupIds, name: 'agent' } },
                },
              ],
              failed_items: [],
              total_affected_items: Array.isArray(agentId) ? agentId.length : 1,
              total_failed_items: 0,
            },
          },
        });
      } else if (Math.random() > 0.8) {
        resolve({
          status: 400,
          data: {
            message: 'Error removing groups agent(s)',
            error: 1,
            data: {
              affected_items: [],
              failed_items: [
                {
                  groups: groupIds,
                  error: { code: Math.floor(Math.random() * 9000) + 1000 },
                },
              ],
              total_affected_items: 0,
              total_failed_items: Array.isArray(agentId) ? agentId.length : 1,
            },
          },
        });
      } else {
        reject({
          status: 500,
          data: {
            message: 'Error removing groups agent(s)',
            error: 1,
            data: {
              affected_items: [],
              failed_items: [
                {
                  groups: groupIds,
                  error: { code: Math.floor(Math.random() * 9000) + 1000 },
                },
              ],
              total_affected_items: 0,
              total_failed_items: Array.isArray(agentId) ? agentId.length : 1,
            },
          },
        });
      }
    }, 1000); // 500ms delay
  });

export const addGroups = async (
  documentId: string | string[],
  groupIds: string | string[],
) => {
  try {
    return await removeGroups(documentId, groupIds);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const queryManagerService = () => {
  let currentContext = null;

  const createContext = async ({
    indexPatternId,
    fixedFilters = [],
  }: {
    indexPatternId: string;
    fixedFilters: object[] | [];
  }) => {
    currentContext = {
      indexPattern: await getPlugins().data.indexPatterns.get(indexPatternId),
      filters: fixedFilters,
      pagination: {
        pageIndex: 0,
      },
      sorting: {
        columns: [],
      },
      query: undefined,
    };

    return currentContext;
  };

  /**
   * Parse the query string and return an object with the query parameters
   */
  const parseQueryString = () => {
    // window.location.search is an empty string
    // get search from href
    const hrefSplit = globalThis.location.href.split('?');

    if (hrefSplit.length <= 1) {
      return {};
    }

    return parse(hrefSplit[1], { sort: false });
  };

  /**
   * Get the forceNow query parameter
   */
  const getForceNow = () => {
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
  };

  const search = async (params: any = {}): Promise<SearchResponse> => {
    if (!currentContext) {
      throw new Error('Context must be created before searching');
    }

    const searchParams = {
      ...currentContext,
      ...params,
      indexPattern: currentContext.indexPattern,
      filters: [...(currentContext.filters || []), ...(params.filter || [])],
      pagination: { ...currentContext.pagination, ...params.pagination },
      sorting: params.sort || currentContext.sorting,
    };
    const {
      indexPattern,
      filters: defaultFilters,
      query,
      pagination,
      sorting,
      fields,
      aggs,
    } = searchParams;

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
    const sortOrder: OpenSearchQuerySortValue[] = {
      [sorting.field]: {
        order: sorting.direction,
      },
    };
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

    const searchParamsRequest = searchSource
      .setParent(undefined)
      .setField('filter', filters)
      .setField('query', query)
      .setField('sort', sortOrder)
      .setField('size', pageSize)
      .setField('from', fromField)
      .setField('index', indexPattern);

    if (fields && Array.isArray(fields) && fields.length > 0) {
      searchParamsRequest.setField('fields', fields);
    }

    if (aggs) {
      searchParamsRequest.setField('aggs', aggs);
    }

    try {
      return await searchParamsRequest.fetch();
    } catch (error) {
      if (error.body) {
        throw error.body;
      }

      throw error;
    }
  };

  const manager = {
    createContext,
    search,
  };

  return manager;
};
