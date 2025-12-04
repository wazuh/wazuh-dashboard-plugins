import { getCore } from '../../../kibana-services';
import { get, set } from 'lodash';

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
export async function fetchInternalOpenSearchIndexItemsInTable<
  T = any,
  R = any,
>(
  index: string,
  tableContext: {
    pagination: { pageIndex: number; pageSize: number };
    sorting: { sort: { field: string; direction: string } };
    searchParams: any;
  },
  options: { mapResponseItem?: (item: any) => R } = {},
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
        const data = item._source;
        return options?.mapResponseItem ? options?.mapResponseItem(data) : data;
      },
    },
  );
}

interface RelationDefintion {
  field?: string;
  index: string;
  indexField?: string;
  target_field?: string;
  type?: 'one-to-one' | 'one-to-many';
}

export async function fetchInternalOpenSearchIndexItemsRelation<
  T = any,
  R = any,
>(
  items: T[],
  relations: {
    [key: string]: RelationDefintion;
  },
): Promise<R[]> {
  for (const relation of Object.values(relations)) {
    const {
      field,
      indexField: relationField,
      index,
      target_field,
      type = 'one-to-one',
    } = relation as RelationDefintion;

    const useDocIds = !relationField;

    const relatedIds = items
      .map((item: any) => get(item, field))
      .filter((v: any, i: number, a: any[]) => v != null && a.indexOf(v) === i);

    const query = useDocIds
      ? { ids: { values: relatedIds } }
      : {
          terms: { [relationField]: relatedIds },
        };

    const response = await fetchInternalOpenSearchIndexItems(index, {
      size: relatedIds.length,
      query,
    });

    const relatedIdsSet = new Set(relatedIds);

    const relatedItemsMap = new Map();

    for (const { _id, _source } of Object.values(response.items) as {
      _id: string;
      _source: any;
    }[]) {
      let key;
      if (useDocIds) {
        key = _id;
        relatedItemsMap.set(key, _source);
      } else {
        const relationFieldValue = get(_source, relationField!);
        if (Array.isArray(relationFieldValue)) {
          for (const relationFieldVal of relationFieldValue) {
            if (relatedIdsSet.has(relationFieldVal)) {
              if (type === 'one-to-one') {
                if (!relatedItemsMap.has(relationFieldVal)) {
                  relatedItemsMap.set(relationFieldVal, _source);
                }
              } else if (type === 'one-to-many') {
                if (!relatedItemsMap.has(relationFieldVal)) {
                  relatedItemsMap.set(relationFieldVal, []);
                }
                relatedItemsMap.get(relationFieldVal).push(_source);
              }
            }
          }
        } else {
          key = relationFieldValue;
          relatedItemsMap.set(key, _source);
        }
      }
    }

    items = items.map((item: any) => {
      const relationData = relatedItemsMap.get(get(item, field));
      set(item, target_field || field, relationData);
      return item;
    });
  }

  return items as unknown as R[];
}

export async function fetchInternalOpenSearchIndexItemsInTableRelation<
  T = any,
  R = any,
>(
  index: string,
  tableContext: {
    pagination: { pageIndex: number; pageSize: number };
    sorting: { sort: { field: string; direction: string } };
    searchParams: any;
  },
  options: {
    mapResponseItem?: (item: any) => R;
    relations?: {
      [key: string]: RelationDefintion;
    };
  } = {},
): Promise<{ items: T; totalItems: number }> {
  const { relations, ...restOptions } = options;
  let { items, totalItems } = await fetchInternalOpenSearchIndexItemsInTable(
    index,
    tableContext,
    restOptions,
  );

  if (relations) {
    items = await fetchInternalOpenSearchIndexItemsRelation(items, relations);
  }

  return { items, totalItems };
}
