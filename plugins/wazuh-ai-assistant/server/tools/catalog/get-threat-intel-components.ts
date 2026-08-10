import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  parseSecurityAnalyticsSpace,
  SECURITY_ANALYTICS_SPACES,
} from './common';

const COMPONENT_TYPES = [
  'decoders',
  'integrations',
  'policies',
  'filters',
  'kvdbs',
] as const;
type ComponentType = (typeof COMPONENT_TYPES)[number];

/** Maps the model-facing enum value to the internal index constant -- mirrors
 * find-document-by-field.ts's `INDEX_ID_FIELDS` pattern. Never a runtime string concatenation of
 * the enum value into the index name (that shape is exactly what `checkIndexAllowlist`'s
 * comma-smuggling guard exists to defend against); a map keeps the reachable index set statically
 * greppable. */
const COMPONENT_INDEX: Record<ComponentType, string> = {
  decoders: 'wazuh-threatintel-decoders*',
  integrations: 'wazuh-threatintel-integrations*',
  policies: 'wazuh-threatintel-policies*',
  filters: 'wazuh-threatintel-filters*',
  kvdbs: 'wazuh-threatintel-kvdbs*',
};

const ENABLED_VALUES = ['enabled', 'disabled', 'any'] as const;

/** "Open in Security Analytics" deep link per component type (app path + hash route confirmed
 * live against a real 5.0 stack) -- `space` is filled in by executor.ts's
 * `resolveSecurityAnalyticsSpace`. `policies` has no dedicated list view of its own: it is only
 * ever shown on the integrations app's Overview tab, so it reuses that same route. */
const COMPONENT_SECURITY_ANALYTICS_PATH: Record<
  ComponentType,
  (space: string) => string
> = {
  decoders: space => `/app/decoders#/decoders?space=${space}`,
  integrations: space => `/app/sa-integrations#/integrations?space=${space}`,
  policies: space => `/app/sa-integrations#/integrations?space=${space}`,
  filters: space =>
    `/app/sa-integrations#/filters?space=${space}&dataSourceId=`,
  kvdbs: space => `/app/kvdbs#/kvdbs?space=${space}`,
};

/**
 * Security Analytics pipeline/config content -- decoders, integrations, policies, filters, and
 * KVDBs -- grouped into one parametrized tool rather than five near-identical ones: all five share
 * the same envelope and the same question shape ("what is configured/active?"), unlike
 * `get_rules` (rules carry level/status/tags/MITRE technique fields none of these five
 * have, and this repo's flat JSON-schema has no way to express "these 4 params only apply for
 * component_type=rules" -- see get-rules.ts).
 *
 * `document.metadata.title` is the only name-like field present on all 5 types (confirmed live:
 * policies 4/4, decoders 501/501, integrations 128/128, kvdbs 56/56) -- it is always the "Name"
 * column. `document.name` is ABSENT entirely from `integrations`/`policies`, and present on only
 * some `kvdbs` docs (11/56) -- reliable only for decoders (501/501). It is therefore never the
 * primary display column, only a decoder-oriented `rowField`. Neither is a usable sort key, hence
 * `sort: ['_doc']` for every type, and the table stays deliberately dense (3 columns meaningful for
 * all 5 types) with the type-specific fields pushed to `rowFields`/`digest.sampleColumns` instead
 * of a sparse table where columns are empty for any given type.
 *
 * `wazuh-threatintel-filters*` is a real, currently EMPTY index (0 docs, live-confirmed) -- a
 * 0-row result there is correct, not a bug.
 */
export const getThreatIntelComponentsTool: ToolDefinition = {
  spec: {
    name: 'get_threat_intel_components',
    description:
      'Lists Security Analytics pipeline components: decoders, integrations, policies, filters, ' +
      'or KVDBs (key-value databases). Use for "which decoders/integrations/policies are ' +
      'active" questions. `component_type="policies"` here means a Security Analytics pipeline ' +
      'policy (config content), NOT a Security Configuration Assessment (SCA) compliance ' +
      'benchmark like CIS Ubuntu -- for that, use get_sca_results instead. Not for rules (use ' +
      'get_rules) or threat intel indicators/IOCs.',
    parameters: objectSchema(
      {
        component_type: {
          type: 'string',
          description: 'Which component family to list.',
          enum: [...COMPONENT_TYPES],
        },
        enabled: {
          type: 'string',
          description:
            'Filter by whether the component is enabled. Defaults to "any" (no filter).',
          enum: [...ENABLED_VALUES],
        },
        space: {
          type: 'string',
          description:
            'Filter by Security Analytics space. Omit to search across every space (the default).',
          enum: [...SECURITY_ANALYTICS_SPACES],
        },
        limit: limitProperty(
          'Max number of components to return (default 20, max 500).',
        ),
      },
      ['component_type'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const componentType = params.component_type;
    if (
      typeof componentType !== 'string' ||
      !(COMPONENT_TYPES as readonly string[]).includes(componentType)
    ) {
      throw new Error(
        `Parameter "component_type" must be one of: ${COMPONENT_TYPES.join(
          ', ',
        )}.`,
      );
    }
    const index = COMPONENT_INDEX[componentType as ComponentType];

    const enabled =
      typeof params.enabled === 'string' &&
      (ENABLED_VALUES as readonly string[]).includes(params.enabled)
        ? params.enabled
        : 'any';
    const space = parseSecurityAnalyticsSpace(params.space);
    const limit = clampLimit(params.limit, 20, 500);

    const filter: Record<string, unknown>[] = [];
    if (enabled !== 'any') {
      filter.push({ term: { 'document.enabled': enabled === 'enabled' } });
    }
    if (space) {
      filter.push({ term: { 'space.name': space } });
    }

    return {
      target: 'indexer',
      index,
      body: {
        query: { bool: { filter } },
        // One union `_source` for all 5 types: requesting a field unmapped for a given sub-family
        // is a silent no-op in OpenSearch, so per-type tailoring would add a second constant map
        // for zero behavioral gain. `space.name` is read by executor.ts's
        // `resolveSecurityAnalyticsSpace` to fill in `buildSecurityAnalyticsLink`'s `space`, and
        // also shown as its own "Space" table column (see tableSpec below).
        _source: [
          'document.name',
          'document.metadata.title',
          'document.enabled',
          'document.category',
          'document.mode',
          'document.metadata.module',
          'document.enrichments',
          'document.index_discarded_events',
          'document.index_unclassified_events',
          'space.name',
        ],
        sort: ['_doc'],
        size: limit,
      },
    };
  },
  buildSecurityAnalyticsLink(params, space) {
    const componentType = params.component_type as ComponentType;
    return {
      label: 'Open in Security Analytics',
      url: COMPONENT_SECURITY_ANALYTICS_PATH[componentType](space),
    };
  },
  tableSpec: {
    // Dense: only fields meaningful across all 5 types. document.metadata.title is present on
    // every type, so it is always the display column -- labeled "Title" (not "Name") because that
    // is the field actually backing it; document.name is decoder-oriented only (see doc comment
    // above) and lives in rowFields instead.
    columns: [
      { field: 'document.metadata.title', label: 'Title' },
      { field: 'document.enabled', label: 'Enabled' },
      // Content is namespaced across draft/test/custom/standard spaces (confirmed live) -- shown
      // as its own column (not just a rowField) so a mixed-space result set is visibly mixed,
      // which matters directly for `buildSecurityAnalyticsLink`'s single-space-per-table link.
      { field: 'space.name', label: 'Space' },
    ],
    // Type-specific fields, sparse across types: document.category/document.mode only exist on
    // integrations, document.metadata.module only on decoders, document.name reliably only on
    // decoders, document.enrichments/index_discarded_events/index_unclassified_events only on
    // policies (confirmed live: absent from decoders/integrations/kvdbs/filters mappings). Opaque
    // blobs (check/definitions/normalize on decoders/filters, content on kvdbs -- all `object,
    // enabled:false` in the live mapping, unqueryable/unaggregatable) and UUID reference arrays
    // (decoders[]/rules[]/kvdbs[]/integrations[]/parents[]) and the raw top-level `yaml` source are
    // excluded entirely -- plumbing, not analyst-facing content.
    rowFields: [
      'document.name',
      'document.category',
      'document.mode',
      'document.metadata.module',
      'document.enrichments',
      'document.index_discarded_events',
      'document.index_unclassified_events',
    ],
  },
  digest: {
    sampleColumns: [
      'document.metadata.title',
      'document.enabled',
      'space.name',
      'document.name',
      'document.category',
      'document.mode',
      'document.metadata.module',
      'document.enrichments',
      'document.index_discarded_events',
      'document.index_unclassified_events',
    ],
    // Synthetic fallback (issue #8920 item 1): "which pipeline components are enabled / what
    // categories exist" was answered from 5 sample rows on a limit-truncated page. Both fields
    // are already in `_source` (getByPath groups the RETURNED rows — no AGG_FIELD_ALLOWLIST entry
    // or live mapping check needed for the digest-level grouping) and are vendor-curated config
    // enums, structurally safe under privacy. Page-scoped with `breakdownNote` when truncated.
    breakdownDimensions: ['document.category', 'document.mode'],
  },
};
