import type {
  FieldUsage,
  MissingField,
} from '../../../common/saved-objects-missing-fields';

export interface SavedObjectLike {
  id: string;
  type: string;
  attributes: {
    title?: string;
    fields?: string;
    visState?: string;
    columns?: string[];
    sort?: unknown[];
    savedSearchRefName?: string;
    kibanaSavedObjectMeta?: { searchSourceJSON?: string };
    [attribute: string]: unknown;
  };
  references?: { name: string; type: string; id: string }[];
}

interface Filter {
  meta?: { key?: string; disabled?: boolean };
  query?: Filter;
  exists?: { field?: string };
  [clause: string]: unknown;
}

interface Aggregation {
  params?: {
    field?: unknown;
    sortField?: unknown;
    filters?: { input?: { query?: unknown } }[];
    [nested: string]: unknown;
  };
}

interface SearchSource {
  query?: { query?: unknown };
  filter?: Filter[];
  indexRefName?: string;
  index?: unknown;
}

// Meta fields every index has, and the "all fields" placeholder.
const ALWAYS_PRESENT = new Set([
  '_id',
  '_index',
  '_score',
  '_source',
  '_type',
  '*',
]);

const FILTER_CLAUSES = [
  'match_phrase',
  'match',
  'term',
  'terms',
  'range',
  'prefix',
  'wildcard',
];

// Aggregation params that hold a nested aggregation (order by metric, pipeline aggs).
const NESTED_AGG_PARAMS = ['orderAgg', 'customMetric', 'customBucket'];

function parseJSON<T>(value: unknown): Partial<T> {
  if (typeof value !== 'string') {
    return (value ?? {}) as Partial<T>;
  }
  try {
    return JSON.parse(value) ?? {};
  } catch {
    return {};
  }
}

const getSearchSource = (so: SavedObjectLike) =>
  parseJSON<SearchSource>(
    so.attributes?.kibanaSavedObjectMeta?.searchSourceJSON,
  );

/**
 * Fields of a KQL or Lucene query: `field:value`, `field : value`, `field >= 1`,
 * `_exists_:field`. Quoted values are dropped first, so `"a:b"` does not count.
 */
export function extractQueryFields(query: unknown): string[] {
  if (typeof query !== 'string' || !query.trim()) {
    return [];
  }
  const unquoted = query.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  const fields = new Set<string>();
  const fieldRe = /(^|[\s(!+-])([A-Za-z_@][\w.@*-]*)\s*(?::|<=|>=|<|>)/g;
  const existsRe = /_exists_\s*:\s*([A-Za-z_@][\w.@*-]*)/g;
  let match: RegExpExecArray | null;

  while ((match = fieldRe.exec(unquoted))) {
    if (match[2] !== '_exists_') {
      fields.add(match[2]);
    }
  }
  while ((match = existsRe.exec(unquoted))) {
    fields.add(match[1]);
  }

  return [...fields];
}

function extractFilterFields(filter: Filter): string[] {
  if (filter?.meta?.disabled) {
    return [];
  }
  if (filter?.meta?.key) {
    return [filter.meta.key];
  }
  const query = filter?.query ?? filter;
  const clause = FILTER_CLAUSES.find(name => query?.[name]);

  if (clause) {
    return Object.keys(query[clause] as object);
  }

  return query?.exists?.field ? [query.exists.field] : [];
}

function extractAggregationFields(agg: Aggregation): unknown[] {
  const params = agg?.params ?? {};
  const fields = [params.field, params.sortField];

  (params.filters ?? []).forEach(filter =>
    fields.push(...extractQueryFields(filter?.input?.query)),
  );
  NESTED_AGG_PARAMS.forEach(name => {
    if (params[name]) {
      fields.push(...extractAggregationFields(params[name] as Aggregation));
    }
  });

  return fields;
}

/** Every field a visualization or saved search uses, with where it uses it. */
export function collectReferencedFields(
  so: SavedObjectLike,
): Map<string, Set<FieldUsage>> {
  const used = new Map<string, Set<FieldUsage>>();
  const add = (where: FieldUsage) => (field: unknown) => {
    if (typeof field !== 'string' || !field || ALWAYS_PRESENT.has(field)) {
      return;
    }
    if (!used.has(field)) {
      used.set(field, new Set());
    }
    used.get(field)?.add(where);
  };
  const searchSource = getSearchSource(so);

  extractQueryFields(searchSource?.query?.query).forEach(add('query'));
  const filters = searchSource?.filter;
  (Array.isArray(filters) ? filters : []).forEach(filter =>
    extractFilterFields(filter).forEach(add('filter')),
  );

  if (so.type === 'visualization') {
    const { aggs } = parseJSON<{ aggs: Aggregation[] }>(
      so.attributes?.visState,
    );
    (Array.isArray(aggs) ? aggs : []).forEach(agg =>
      extractAggregationFields(agg).forEach(add('aggregation')),
    );
  }

  if (so.type === 'search') {
    (so.attributes?.columns ?? []).forEach(add('column'));
    const sort = so.attributes?.sort ?? [];
    // Older objects store one [field, direction] pair instead of a list of pairs.
    const pairs = Array.isArray(sort[0]) ? sort : sort.length ? [sort] : [];
    pairs.forEach(pair => add('sort')(Array.isArray(pair) ? pair[0] : pair));
  }

  return used;
}

/** The index pattern the object queries, or the saved search it is built on. */
export function resolveSource(so: SavedObjectLike): {
  indexPatternId?: string;
  savedSearchId?: string;
} {
  const searchSource = getSearchSource(so);
  const references = so.references ?? [];

  if (searchSource?.indexRefName) {
    const reference = references.find(
      ({ name }) => name === searchSource.indexRefName,
    );
    if (reference) {
      return { indexPatternId: reference.id };
    }
  }
  if (typeof searchSource?.index === 'string') {
    return { indexPatternId: searchSource.index };
  }
  const savedSearch = references.find(
    ({ name, type }) =>
      type === 'search' &&
      name === (so.attributes?.savedSearchRefName ?? 'search_0'),
  );

  return savedSearch ? { savedSearchId: savedSearch.id } : {};
}

const wildcardToRegExp = (pattern: string) =>
  new RegExp(
    `^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`,
  );

/** The fields the object uses that are not in `existingFields`, sorted by name. */
export function findMissingFields(
  so: SavedObjectLike,
  existingFields: Set<string>,
): MissingField[] {
  const missing: MissingField[] = [];

  collectReferencedFields(so).forEach((usedIn, field) => {
    if (existingFields.has(field)) {
      return;
    }
    // A wildcard such as `rule.*` is fine when any field matches it.
    if (field.includes('*')) {
      const pattern = wildcardToRegExp(field);
      if ([...existingFields].some(name => pattern.test(name))) {
        return;
      }
    }
    missing.push({ field, usedIn: [...usedIn] });
  });

  return missing.sort((a, b) => a.field.localeCompare(b.field));
}
