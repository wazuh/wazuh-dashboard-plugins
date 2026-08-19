import { ToolDefinition } from '../types';
import { WAZUH_FIELD, COMPLIANCE_FRAMEWORK_FIELDS } from '../../../common/wazuh-fields';
import { isAggAllowedField, listAggAllowedFields } from '../guardrails';
import {
  objectSchema,
  optionalStringParam,
  requireNonEmptyString,
  resolveTimeRange,
  timeRangeProperties,
} from './common';

/** Bucket cap: this is a CHEAP discovery tool ("does this value exist, roughly how many others
 * are there"), not an exhaustive dump -- a caller who needs more than 50 distinct values should
 * narrow with `prefix` rather than raise a limit, so there is deliberately no caller-configurable
 * `limit` param (unlike the listing tools). Kept well under `guardrails.ts`'s `MAX_AGG_SIZE`
 * (100), which this request would also have to satisfy either way. */
const BUCKET_CAP = 50;

/** One field's queryable location: a router-style `family` label (mirrors the vocabulary an
 * analyst/the model already uses for "which surface") plus the concrete index pattern to query. */
interface FieldLocation {
  family: string;
  index: string;
}

const FINDINGS: FieldLocation = { family: 'findings', index: 'wazuh-findings-v5*' };
const EVENTS: FieldLocation = { family: 'events', index: 'wazuh-events-v5*' };
const VULNERABILITIES: FieldLocation = {
  family: 'vulnerabilities',
  index: 'wazuh-states-vulnerabilities*',
};
const SCA: FieldLocation = { family: 'sca', index: 'wazuh-states-sca*' };
const INVENTORY_PACKAGES: FieldLocation = {
  family: 'inventory_packages',
  index: 'wazuh-states-inventory-packages*',
};
const INVENTORY_SYSTEM: FieldLocation = {
  family: 'inventory_system',
  index: 'wazuh-states-inventory-system*',
};
const INVENTORY_PORTS: FieldLocation = {
  family: 'inventory_ports',
  index: 'wazuh-states-inventory-ports*',
};

/**
 * Where each `guardrails.ts` `AGG_FIELD_ALLOWLIST` field can actually be aggregated -- this tool's
 * `field` parameter is restricted to that allowlist (see `buildRequest`'s validation below), so
 * every reachable field has an entry here. A field present on more than one index (e.g.
 * `wazuh.agent.id`, which findings-v5/events-v5/every `wazuh-states-*` index all carry) lists every
 * location the model can reasonably want; `index_family` disambiguates, defaulting to the first
 * (most common) entry when omitted.
 *
 * Deliberately NOT auto-derived from `common/field-catalog.ts`: the catalog says a field EXISTS
 * and its ECS/WCS TYPE, not which of several physically distinct indices carries it for THIS
 * product's tool surface -- that mapping is this tool's own concern, same as
 * `get-threat-intel-components.ts`'s `COMPONENT_INDEX` map.
 */
export const FIELD_LOCATIONS: Record<string, FieldLocation[]> = {
  [WAZUH_FIELD.RULE_ID]: [FINDINGS],
  [WAZUH_FIELD.RULE_LEVEL]: [FINDINGS],
  [WAZUH_FIELD.RULE_TITLE]: [FINDINGS],
  [WAZUH_FIELD.RULE_CATEGORY]: [FINDINGS],
  [WAZUH_FIELD.RULE_TAGS]: [FINDINGS],
  [WAZUH_FIELD.RULE_MITRE_TECHNIQUE_ID]: [FINDINGS],
  [WAZUH_FIELD.RULE_MITRE_TECHNIQUE_NAME]: [FINDINGS],
  [WAZUH_FIELD.RULE_MITRE_TACTIC_NAME]: [FINDINGS],
  [WAZUH_FIELD.INTEGRATION_CATEGORY]: [FINDINGS, EVENTS],
  [WAZUH_FIELD.AGENT_ID]: [FINDINGS, EVENTS, VULNERABILITIES, SCA],
  [WAZUH_FIELD.AGENT_NAME]: [FINDINGS, EVENTS, VULNERABILITIES, SCA],
  'vulnerability.severity': [VULNERABILITIES],
  'policy.id': [SCA],
  'check.result': [SCA],
  'check.name': [SCA],
  'interface.state': [INVENTORY_PORTS],
  'network.transport': [INVENTORY_PORTS],
  'package.name': [INVENTORY_PACKAGES],
  'host.os.name': [INVENTORY_SYSTEM],
  'host.os.platform': [INVENTORY_SYSTEM],
  'source.ip': [FINDINGS, EVENTS],
};
// Every compliance-framework requirement field (wazuh.rule.compliance.pci_dss, .hipaa, ...) lives
// on findings-v5 only, same as the rest of the rule taxonomy above -- filled in from the shared
// COMPLIANCE_FRAMEWORK_FIELDS map rather than hand-listing all 10, so a future 11th framework
// needs no change here.
for (const field of Object.values(COMPLIANCE_FRAMEWORK_FIELDS)) {
  FIELD_LOCATIONS[field] = [FINDINGS];
}

const ALL_FAMILIES = Array.from(
  new Set(Object.values(FIELD_LOCATIONS).flatMap(locations => locations.map(l => l.family))),
).sort();

/** Every `AGG_FIELD_ALLOWLIST` field this tool knows how to query on the given `family` (this
 * module's own `family` vocabulary -- "findings"/"events"/"sca"/etc., NOT `common/
 * field-catalog.ts`'s dotted family keys). Used by `field-drift-canary.ts` to also live-check the
 * fields tool params actually filter/aggregate on, not just the WCS catalog's fields -- see that
 * module's doc comment for why both sources matter. */
export function fieldsForFamily(family: string): string[] {
  return Object.entries(FIELD_LOCATIONS)
    .filter(([, locations]) => locations.some(location => location.family === family))
    .map(([field]) => field)
    .sort();
}

/** Simple, bounded prefix/substring match for the "did you mean" suggestion list -- no fuzzy
 * matching dependency, just a plain scan of the (short, ~20-entry) allowlist for a candidate that
 * shares a leading path segment or a substring with the caller's typo. Capped at 5 suggestions. */
function suggestCloseFields(field: string): string[] {
  const needle = field.toLowerCase();
  const firstSegment = needle.split('.')[0];
  const candidates = listAggAllowedFields().filter(candidate => {
    const lower = candidate.toLowerCase();
    return (
      lower.includes(needle) ||
      needle.includes(lower) ||
      lower.split('.')[0] === firstSegment
    );
  });
  return candidates.slice(0, 5);
}

/** Quote-free, fully-escaped, anchored "starts with" Lucene regexp for a `terms.include` clause --
 * same escaping approach as get-sca-checks.ts's `buildContainsIncludePattern`, but anchored only
 * at the START (a true prefix match, not "contains") since this tool's `prefix` parameter is
 * documented as a prefix, not a substring. No case-insensitive flag exists for `terms.include`,
 * so each letter expands to a `[xX]` character class exactly like that sibling helper. */
function buildPrefixIncludePattern(prefix: string): string {
  const parts: string[] = [];
  for (const char of prefix) {
    if (/[a-zA-Z]/.test(char)) {
      parts.push(`[${char.toLowerCase()}${char.toUpperCase()}]`);
    } else if (/[0-9]/.test(char)) {
      parts.push(char);
    } else {
      parts.push(`\\${char}`);
    }
  }
  return `${parts.join('')}.*`;
}

/**
 * Cheap discovery tool (workstream B, `AI/plan/qa-rules-decoders-rootcause.md`'s "verify before
 * filter" gap): returns the actual distinct values of one field, with counts, instead of the
 * model guessing a filter value and either matching by luck or silently getting zero rows for a
 * value that was simply spelled/cased differently than it guessed. `field` is restricted to
 * `guardrails.ts`'s `AGG_FIELD_ALLOWLIST` -- the same bounded-cardinality set every other
 * aggregation in this catalog is restricted to -- so this tool can never be used to run an
 * unbounded-cardinality enumeration under a different name.
 */
export const getFieldValuesTool: ToolDefinition = {
  spec: {
    name: 'get_field_values',
    description:
      'Discover which values actually exist in a field BEFORE filtering on it, so a filter is ' +
      'never a guess. Returns up to 50 distinct values with their document counts, plus how many ' +
      'documents are missing the field entirely. Use this before a filtered call whose value is ' +
      'not a fixed, already-documented enum (a tool parameter\'s own `enum` list already tells ' +
      'you its valid values -- you do not need this tool for those); also use it AFTER a filtered ' +
      'call returns zero rows, to check whether the filter value itself was wrong before ' +
      'concluding the data does not exist. Only works for a small set of vetted, bounded-' +
      'cardinality fields (the same list this catalog\'s aggregations are always restricted to) -- ' +
      'if the field you need is not accepted, say what you could check instead of guessing a value.',
    parameters: objectSchema(
      {
        field: {
          type: 'string',
          description:
            'The exact field path to enumerate, e.g. "wazuh.rule.level", "check.result", ' +
            '"host.os.name". Must be one of this tool\'s vetted fields (a rejected value lists ' +
            'the closest known field names).',
        },
        index_family: {
          type: 'string',
          description:
            'Which data surface to query, when the field exists on more than one (e.g. ' +
            '"wazuh.agent.id" on findings/events/vulnerabilities/sca). Omit to use the field\'s ' +
            'most common surface.',
          enum: ALL_FAMILIES,
        },
        prefix: {
          type: 'string',
          description:
            'Only return values starting with this text (case-insensitive). Omit to see the ' +
            'most common values overall.',
        },
        ...timeRangeProperties(),
      },
      ['field'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const field = requireNonEmptyString(
      params.field,
      'Parameter "field" is required and must be a non-empty string.',
    );

    if (!isAggAllowedField(field) || FIELD_LOCATIONS[field] === undefined) {
      const suggestions = suggestCloseFields(field);
      const suggestionText =
        suggestions.length > 0
          ? ` Closest known fields: ${suggestions.join(', ')}.`
          : ' No similarly-named known field was found.';
      throw new Error(
        `Parameter "field" ("${field}") is not one of this tool's vetted, bounded-cardinality ` +
          `fields, so its values cannot be enumerated this way.${suggestionText}`,
      );
    }

    const locations = FIELD_LOCATIONS[field];
    const requestedFamily = optionalStringParam(params.index_family);
    const location = requestedFamily
      ? locations.find(candidate => candidate.family === requestedFamily)
      : locations[0];
    if (!location) {
      const validFamilies = locations.map(l => l.family).join(', ');
      throw new Error(
        `Parameter "index_family" ("${requestedFamily}") is not valid for field "${field}". ` +
          `Valid surfaces for this field: ${validFamilies}.`,
      );
    }

    const rawPrefix = optionalStringParam(params.prefix)?.trim();
    const prefix = rawPrefix && rawPrefix.length > 0 ? rawPrefix : undefined;

    const isTimeBased = location.family === 'findings' || location.family === 'events';
    const filter: Record<string, unknown>[] = [];
    if (isTimeBased) {
      const { gte, lte } = resolveTimeRange(params);
      filter.push({ range: { '@timestamp': { gte, lte } } });
    }

    return {
      target: 'indexer',
      index: location.index,
      body: {
        query: { bool: { filter } },
        size: 0,
        aggs: {
          values: {
            terms: {
              field,
              size: BUCKET_CAP,
              ...(prefix ? { include: buildPrefixIncludePattern(prefix) } : {}),
            },
          },
          // A `filter` single-bucket doc-count agg, NOT the `missing` agg type: `filter` is on
          // `agg-representability-coverage.test.ts`'s `REPRESENTABLE_BUCKET_AGG_TYPES` (and
          // digest.ts's `isSingleBucketDocCount` reads its `{doc_count}` response shape
          // generically, by shape, not by agg-type name) -- `missing` is not yet a type either of
          // those recognize, and adding it registry-wide is out of this tool's scope. Same final
          // result (a doc count of documents lacking `field`), reached through an agg type this
          // catalog already knows how to represent end to end.
          missing_count: { filter: { bool: { must_not: [{ exists: { field } }] } } },
        },
      },
    };
  },
  tableSpec: {
    columns: [
      { field: 'key', label: 'Value' },
      { field: 'doc_count', label: 'Documents' },
    ],
  },
  digest: {
    sampleColumns: ['key', 'doc_count'],
  },
};
