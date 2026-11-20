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
    savedSearchId?: string;
    kibanaSavedObjectMeta?: { searchSourceJSON?: string };
    [attribute: string]: unknown;
  };
  references?: { name: string; type: string; id: string }[];
}

interface Filter {
  meta?: { key?: string; type?: string; disabled?: boolean };
  [clause: string]: unknown;
}

type DslClause = Record<string, unknown> | null;

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

// Clauses keyed by field name: `{ term: { field: value } }`.
const FIELD_CLAUSES = [
  'match_phrase',
  'match_phrase_prefix',
  'match',
  'term',
  'terms',
  'range',
  'prefix',
  'wildcard',
  'regexp',
  'fuzzy',
];
const CLAUSE_OPTIONS = new Set(['boost', '_name']);
const BOOL_CLAUSES = ['must', 'should', 'filter', 'must_not'];
// Filters whose `meta.key` is a clause name, not a field.
const DSL_FILTER_TYPES = new Set(['custom', 'query_string', 'match_all']);

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

const FIELD_RE = /([A-Za-z_@][\w.@*-]*)\s*(:|<=|>=|<|>)\s*/y;
// A field value: a Lucene range (`[a TO b]`, `{a TO b}`), or a run up to the next space or
// group delimiter.
const VALUE_RE = /\[[^\]]*\]|\{[^{}]*\sTO\s[^{}]*\}|(?:\\.|[^\s(){}])+/y;
const SEPARATOR_RE = /[\s(){!+-]/;

const matchAt = (re: RegExp, text: string, index: number) => {
  re.lastIndex = index;
  return re.exec(text);
};

/**
 * Fields of a KQL or Lucene query: `field:value`, `field : value`, `field >= 1`,
 * `_exists_:field`, KQL nested `parent:{ child: x }`. Values are skipped, so `"a:b"` or
 * `url: foo-bar:baz` add nothing.
 */
export function extractQueryFields(query: unknown): string[] {
  if (typeof query !== 'string' || !query.trim()) {
    return [];
  }
  const text = query.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  const fields = new Set<string>();
  const parents: string[] = [];
  let index = 0;

  while (index < text.length) {
    const char = text[index];
    const field = matchAt(FIELD_RE, text, index);

    if (SEPARATOR_RE.test(char)) {
      index++;
    } else if (char === '}') {
      parents.pop();
      index++;
    } else if (field) {
      index = FIELD_RE.lastIndex;
      const value = matchAt(VALUE_RE, text, index);
      const name = [...parents.slice(-1), field[1]].join('.');

      if (field[1] === '_exists_') {
        fields.add(value?.[0] ?? '');
      } else if (field[2] === ':' && text[index] === '{' && !value) {
        parents.push(name);
      } else {
        fields.add(name);
      }
      index = value ? VALUE_RE.lastIndex : index;
    } else {
      // A free-text term or a keyword such as AND.
      index =
        (matchAt(VALUE_RE, text, index) && VALUE_RE.lastIndex) || index + 1;
    }
  }
  fields.delete('');

  return [...fields];
}

/** Fields of a query DSL clause. Scripts are not parsed. */
function extractDslFields(query: unknown): string[] {
  if (Array.isArray(query)) {
    return query.flatMap(extractDslFields);
  }
  if (!query || typeof query !== 'object') {
    return [];
  }

  return Object.entries(query as Record<string, DslClause>).flatMap(
    ([clause, body]) => {
      if (!body || typeof body !== 'object') {
        return [];
      }
      if (FIELD_CLAUSES.includes(clause)) {
        return Object.keys(body).filter(key => !CLAUSE_OPTIONS.has(key));
      }
      switch (clause) {
        case 'exists':
          return typeof body.field === 'string' ? [body.field] : [];
        case 'query_string':
          return extractQueryFields(body.query);
        case 'bool':
          return BOOL_CLAUSES.flatMap(name => extractDslFields(body[name]));
        case 'query':
          return extractDslFields(body);
        case 'nested':
          return extractDslFields(body.query);
        case 'constant_score':
          return extractDslFields(body.filter);
        default:
          return [];
      }
    },
  );
}

function extractFilterFields(filter: Filter): string[] {
  const { meta } = filter ?? {};
  if (meta?.disabled) {
    return [];
  }
  // `meta` and `$state` are not query clauses, so the walk skips them.
  const fields = extractDslFields(filter);

  // Scripted fields filter by script; the key is the field name.
  return fields.length || !meta?.key || DSL_FILTER_TYPES.has(meta.type ?? '')
    ? fields
    : [meta.key];
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

  // Objects not migrated to references keep the id as an attribute.
  const savedSearchId = savedSearch?.id ?? so.attributes?.savedSearchId;

  return typeof savedSearchId === 'string' && savedSearchId
    ? { savedSearchId }
    : {};
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
