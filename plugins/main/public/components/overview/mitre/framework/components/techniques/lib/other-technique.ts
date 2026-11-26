// The API catalog and the query DSL use snake_case names (external_id, must_not)
/* eslint-disable camelcase */
export const TECHNIQUE_FIELD = 'wazuh.rule.mitre.technique.id';
export const OTHER_TECHNIQUE_ID = '__other__';
export const OTHER_AGGREGATION_KEY = 'otherTechniques';
export const OTHER_FILTER_LABEL = 'MITRE technique: Others';

const MITRE_ATTACK = 'mitre-attack';

type tCatalogTechnique = {
  source?: string;
  external_id?: string;
  references?: { source: string; external_id?: string }[];
};

/**
 * ATT&CK ID (e.g. T1059.001) of an item returned by the server API catalog
 */
export const getTechniqueExternalId = (
  technique: tCatalogTechnique,
): string | undefined =>
  technique.source === MITRE_ATTACK
    ? technique.external_id
    : technique.references?.find(item => item.source === MITRE_ATTACK)
        ?.external_id;

/**
 * Every ATT&CK ID of the catalog, sub-techniques included, without duplicates
 */
export const getCatalogTechniqueIds = (
  catalog: tCatalogTechnique[],
): string[] =>
  Array.from(
    new Set(
      catalog
        .map(getTechniqueExternalId)
        .filter((id): id is string => Boolean(id)),
    ),
  );

/**
 * Query (not summed buckets) that matches the findings with technique IDs and
 * none of them in the catalog.
 */
export const buildOtherQuery = (catalogIds: string[]) => ({
  bool: {
    must: [{ exists: { field: TECHNIQUE_FIELD } }],
    must_not: [{ terms: { [TECHNIQUE_FIELD]: catalogIds } }],
  },
});

/**
 * Aggregation that counts the "Other" findings within the current query, filters
 * and time range.
 */
export const buildOtherAggregation = (catalogIds: string[]) => ({
  [OTHER_AGGREGATION_KEY]: { filter: buildOtherQuery(catalogIds) },
});

/**
 * DSL filter with a readable label, used to filter for/out "Other"
 */
export const buildOtherFilter = (
  indexPatternId: string,
  catalogIds: string[],
  negate = false,
) => ({
  meta: {
    alias: OTHER_FILTER_LABEL,
    disabled: false,
    negate,
    index: indexPatternId,
    type: 'custom',
  },
  query: buildOtherQuery(catalogIds),
  $state: { store: 'appState' },
});

/**
 * Buckets of the technique IDs that are not in the catalog, from the terms aggregation of
 * the technique field (a finding with several IDs adds one count to each of them).
 */
export const getUnknownBuckets = (
  buckets: { key: string; doc_count: number }[],
  catalogIds: string[],
) => {
  const catalog = new Set(catalogIds);
  return buckets.filter(bucket => !catalog.has(bucket.key));
};
