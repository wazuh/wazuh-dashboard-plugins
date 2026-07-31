import { ToolDefinition } from '../types';
import { clampLimit, limitProperty, objectSchema } from './common';

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

/**
 * Security Analytics pipeline/config content -- decoders, integrations, policies, filters, and
 * KVDBs -- grouped into one parametrized tool rather than five near-identical ones: all five share
 * the same envelope and the same question shape ("what is configured/active?"), unlike
 * `get_detection_rules` (rules carry level/status/tags/MITRE technique fields none of these five
 * have, and this repo's flat JSON-schema has no way to express "these 4 params only apply for
 * component_type=rules" -- see get-detection-rules.ts).
 *
 * `document.name` is ABSENT from the live mapping of `integrations` and `policies` (confirmed
 * against a live `_mapping` call) -- not a usable sort key, hence `sort: ['_doc']` for every type,
 * and the table stays deliberately dense (3 columns meaningful for all 5 types) with the
 * type-specific fields pushed to `rowFields`/`digest.sampleColumns` instead of a sparse 6-column
 * table where 3 columns are empty for any given type.
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
      'active" questions. Not for detection rules (use get_detection_rules) or threat intel ' +
      'indicators/IOCs.',
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
        `Parameter "component_type" must be one of: ${COMPONENT_TYPES.join(', ')}.`,
      );
    }
    const index = COMPONENT_INDEX[componentType as ComponentType];

    const enabled =
      typeof params.enabled === 'string' &&
      (ENABLED_VALUES as readonly string[]).includes(params.enabled)
        ? params.enabled
        : 'any';
    const limit = clampLimit(params.limit, 20, 500);

    const filter: Record<string, unknown>[] =
      enabled === 'any' ? [] : [{ term: { 'document.enabled': enabled === 'enabled' } }];

    return {
      target: 'indexer',
      index,
      body: {
        query: { bool: { filter } },
        // One union `_source` for all 5 types: requesting a field unmapped for a given sub-family
        // is a silent no-op in OpenSearch, so per-type tailoring would add a second constant map
        // for zero behavioral gain.
        _source: [
          'document.name',
          'document.metadata.title',
          'document.enabled',
          'document.category',
          'document.mode',
          'document.metadata.module',
        ],
        sort: ['_doc'],
        size: limit,
      },
    };
  },
  tableSpec: {
    // Dense: only fields meaningful across all 5 types. document.name is ABSENT on
    // integrations/policies by mapping -- simply omitted per row (JSON-sparse), never null.
    columns: [
      { field: 'document.name', label: 'Name' },
      { field: 'document.metadata.title', label: 'Title' },
      { field: 'document.enabled', label: 'Enabled' },
    ],
    // Type-specific fields, sparse across types: document.category/document.mode only exist on
    // integrations, document.metadata.module only on decoders. Opaque blobs
    // (check/definitions/normalize on decoders/filters, content on kvdbs -- all `object,
    // enabled:false` in the live mapping, unqueryable/unaggregatable) and UUID reference arrays
    // (decoders[]/rules[]/kvdbs[]/integrations[]/parents[]) and the raw top-level `yaml` source are
    // excluded entirely -- plumbing, not analyst-facing content.
    rowFields: ['document.category', 'document.mode', 'document.metadata.module'],
  },
  digest: {
    sampleColumns: [
      'document.name',
      'document.metadata.title',
      'document.enabled',
      'document.category',
      'document.mode',
      'document.metadata.module',
    ],
  },
};
