// The API catalog and the query DSL use snake_case names (external_id, must_not)
/* eslint-disable camelcase */
export const TECHNIQUE_FIELD = 'wazuh.rule.mitre.technique.id';
export const TACTIC_FIELD = 'wazuh.rule.mitre.tactic.id';
export const OTHER_TECHNIQUE_ID = '__other__';
export const OTHER_AGGREGATION_KEY = 'otherTechniques';
export const OTHER_TECHNIQUES_BUCKETS_KEY = 'techniques';
export const OTHER_FILTER_LABEL = 'MITRE technique: Others';

const MITRE_ATTACK = 'mitre-attack';

type tCatalogTechnique = {
  id?: string;
  source?: string;
  external_id?: string;
  references?: { source: string; external_id?: string }[];
};

type tCatalogTactic = {
  external_id?: string;
  /** Catalog (internal) IDs of the techniques of the tactic */
  techniques?: string[];
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

const getSelectedTactics = (
  tacticsObject: Record<string, tCatalogTactic>,
  selectedTactics: Record<string, boolean>,
) =>
  Object.keys(tacticsObject)
    .filter(name => selectedTactics?.[name])
    .map(name => tacticsObject[name]);

/**
 * ATT&CK IDs (e.g. TA0003) of the selected tactics
 */
export const getSelectedTacticIds = (
  tacticsObject: Record<string, tCatalogTactic>,
  selectedTactics: Record<string, boolean>,
): string[] =>
  getSelectedTactics(tacticsObject, selectedTactics)
    .map(tactic => tactic.external_id)
    .filter((id): id is string => Boolean(id));

/**
 * ATT&CK IDs of the techniques listed for the selected tactics (the central list,
 * regardless of the search box and of the switch that hides the empty ones)
 */
export const getListedTechniqueIds = (
  tacticsObject: Record<string, tCatalogTactic>,
  selectedTactics: Record<string, boolean>,
  catalog: tCatalogTechnique[],
): string[] => {
  const catalogById = new Map(
    catalog.map(technique => [technique.id, technique]),
  );
  return Array.from(
    new Set(
      getSelectedTactics(tacticsObject, selectedTactics)
        .flatMap(tactic => tactic.techniques || [])
        .map(id => catalogById.get(id))
        .map(technique => technique && getTechniqueExternalId(technique))
        .filter((id): id is string => Boolean(id)),
    ),
  );
};

/**
 * Query (not summed buckets) that matches the findings of the selected tactics with
 * none of the listed techniques. A finding without techniques matches too.
 */
export const buildOtherQuery = (
  tacticIds: string[],
  listedTechniqueIds: string[],
) => ({
  bool: {
    filter: [{ terms: { [TACTIC_FIELD]: tacticIds } }],
    must_not: listedTechniqueIds.length
      ? [{ terms: { [TECHNIQUE_FIELD]: listedTechniqueIds } }]
      : [],
  },
});

/**
 * Aggregation that counts the "Other" findings within the current query, filters and
 * time range, and the technique IDs these findings have.
 */
export const buildOtherAggregation = (
  tacticIds: string[],
  listedTechniqueIds: string[],
) => ({
  [OTHER_AGGREGATION_KEY]: {
    filter: buildOtherQuery(tacticIds, listedTechniqueIds),
    aggs: {
      [OTHER_TECHNIQUES_BUCKETS_KEY]: {
        terms: { field: TECHNIQUE_FIELD, size: 1000 },
      },
    },
  },
});

/**
 * DSL filter with a readable label, used to filter for/out "Other"
 */
export const buildOtherFilter = (
  indexPatternId: string,
  tacticIds: string[],
  listedTechniqueIds: string[],
  negate = false,
) => ({
  meta: {
    alias: OTHER_FILTER_LABEL,
    disabled: false,
    negate,
    index: indexPatternId,
    type: 'custom',
  },
  query: buildOtherQuery(tacticIds, listedTechniqueIds),
  $state: { store: 'appState' },
});
