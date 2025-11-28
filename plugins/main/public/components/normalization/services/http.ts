import { getCore } from '../../../kibana-services';

/**
 * Fetches data from an OpenSearch index via internal API.
 * @param index OpenSearch index
 * @param body Request body
 * @returns OpenSearch raw response
 */
export async function fetchInternalOpenSearchIndex<T = any>(
  index: string,
  body: any,
): Promise<{ items: T; totalItems: number }> {
  const { rawResponse } = await getCore().http.post(
    `/internal/search/opensearch`,
    {
      body: JSON.stringify({ params: { index, body } }),
    },
  );
  return rawResponse;
}

/**
 * Fetches items from an OpenSearch index via internal API.
 * @param index OpenSearch index
 * @param query
 * @param param2
 * @returns
 */
export async function fetchInternalOpenSearchIndexItems<T = any>(
  index: string,
  query: any,
  { mapResponseItem }: { mapResponseItem?: (item: any) => T } = {},
): Promise<{ items: T; totalItems: number }> {
  const response = await fetchInternalOpenSearchIndex(index, query);

  const items = response?.hits?.hits ?? [];
  const totalItems = response?.hits?.total ?? 0;

  return {
    totalItems: totalItems,
    items: mapResponseItem ? items.map(mapResponseItem) : items,
  } as any;
}

/**
 * Fetches items from an OpenSearch index for table display via internal API.
 * @param index
 * @param tableContext
 * @returns
 */
export async function fetchInternalOpenSearchIndexItemsInTable<T = any>(
  index: string,
  tableContext: {
    pagination: { pageIndex: number; pageSize: number };
    sorting: { sort: { field: string; direction: string } };
    searchParams: any;
  },
): Promise<{ items: T; totalItems: number }> {
  // Map table context to OpenSearch query parameters
  const {
    pagination: { pageIndex, pageSize },
    sorting: { sort: tableSort },
    searchParams,
  } = tableContext;

  const sort = tableSort?.field
    ? [{ [tableSort.field]: { order: tableSort.direction } }]
    : [];

  const query = searchParams?.query || {
    match_all: {},
  };

  return fetchInternalOpenSearchIndexItems(
    index,
    {
      from: pageIndex * pageSize,
      size: pageSize,
      query,
      sort,
    },
    {
      mapResponseItem(item) {
        return item._source;
      },
    },
  );
}
