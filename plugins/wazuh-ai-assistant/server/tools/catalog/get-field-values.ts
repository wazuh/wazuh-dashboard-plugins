import {
  ResolvedToolParams,
  ResolveParamsResult,
  ToolDefinition,
} from '../types';
import {
  WAZUH_FIELD,
  COMPLIANCE_FRAMEWORK_FIELDS,
} from '../../../common/wazuh-fields';
import {
  isAggAllowedField,
  listAggAllowedFields,
  requiresBoundedTimeRange,
} from '../guardrails';
import {
  FIELD_ALIASES,
  resolveFieldAlias,
} from '../../../common/field-catalog';
import { STATE_FAMILIES } from '../state-families';
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

/** Code review B9: `prefix` is turned into a `[xX]`-doubled Lucene regexp below (one character
 * class pair per input character), so an unbounded caller-supplied string can grow the compiled
 * automaton past Lucene's `max_determinized_states` (10,000) and surface as an opaque 400 the
 * model has to interpret instead of a clear parameter error. 64 is far beyond any real field value
 * prefix a caller would type, so this never clips a legitimate query. */
const PREFIX_MAX_LENGTH = 64;

/** Tool family (`FieldLocation.family`, this module's own vocabulary) -> `common/field-catalog.ts`
 * family key, for the two families `FIELD_ALIASES` actually covers. Deliberately a tiny, explicit
 * map rather than a generic rule: only `findings`/`events` currently have a known-unpopulated ECS
 * twin (see `common/field-catalog.ts`'s `FIELD_ALIASES` doc comment). */
const TOOL_FAMILY_TO_CATALOG_FAMILY: Record<string, string> = {
  findings: 'events.findings',
  events: 'events.main',
};

/** One field's queryable location: a router-style `family` label (mirrors the vocabulary an
 * analyst/the model already uses for "which surface") plus the concrete index pattern to query. */
interface FieldLocation {
  family: string;
  index: string;
}

const FINDINGS: FieldLocation = {
  family: 'findings',
  index: 'wazuh-findings-v5*',
};
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
  // BLOCKER FIX (empty-answer audit, 2026-08-20, CV-033): `event.category` was added to
  // `guardrails.ts`'s `AGG_FIELD_ALLOWLIST` (it is events-v5's own finite category taxonomy --
  // 11 values over 258k live docs, verified) but had NO entry here, so `isAggAllowedField` passed
  // while `FIELD_LOCATIONS[field] === undefined` still failed the same guard clause -- the call
  // could only ever hit the "not one of this tool's vetted fields" error branch, an INCORRECT
  // message for a field that genuinely is allowlisted, and a wasted round trip for the model.
  // `event.outcome` is added alongside it for the same reason (success/failure/unknown, same
  // finite-enum class) and the same events-v5 surface.
  'event.category': [EVENTS],
  'event.outcome': [EVENTS],
  [WAZUH_FIELD.AGENT_ID]: [FINDINGS, EVENTS, VULNERABILITIES, SCA],
  [WAZUH_FIELD.AGENT_NAME]: [FINDINGS, EVENTS, VULNERABILITIES, SCA],
  'vulnerability.severity': [VULNERABILITIES],
  'policy.id': [SCA],
  'check.result': [SCA],
  'check.name': [SCA],
  'interface.state': [INVENTORY_PORTS],
  'network.transport': [INVENTORY_PORTS],
  'package.name': [INVENTORY_PACKAGES],
  // Code review B1 (AI/plan/b-review.md P1.1): extended from `[INVENTORY_SYSTEM]` alone. Without
  // `FINDINGS`/`EVENTS` here, the model could never even OBSERVE the empty ECS twin on the surface
  // the CEO scenario actually asks about (findings/events) -- it would silently get routed to
  // inventory_system instead, which answers a different question and hides the `missing_count`
  // this tool exists to surface. See `resolveParams` below for what points the model at the
  // populated `wazuh.agent.host.os.*` twin once it lands here.
  'host.os.name': [INVENTORY_SYSTEM, FINDINGS, EVENTS],
  'host.os.platform': [INVENTORY_SYSTEM, FINDINGS, EVENTS],
  'source.ip': [FINDINGS, EVENTS],
  // Code review B1: the populated twins of the two ECS fields above -- see guardrails.ts's
  // AGG_FIELD_ALLOWLIST entry for the live cardinality evidence.
  [WAZUH_FIELD.AGENT_OS_NAME]: [FINDINGS, EVENTS],
  [WAZUH_FIELD.AGENT_OS_PLATFORM]: [FINDINGS, EVENTS],
  [WAZUH_FIELD.INTEGRATION_NAME]: [FINDINGS, EVENTS],
};
// Every compliance-framework requirement field (wazuh.rule.compliance.pci_dss, .hipaa, ...) lives
// on findings-v5 only, same as the rest of the rule taxonomy above -- filled in from the shared
// COMPLIANCE_FRAMEWORK_FIELDS map rather than hand-listing all 10, so a future 11th framework
// needs no change here.
for (const field of Object.values(COMPLIANCE_FRAMEWORK_FIELDS)) {
  FIELD_LOCATIONS[field] = [FINDINGS];
}

/**
 * The state surfaces' field-discovery routes. Derived from `../state-families.ts` rather than
 * hand-written here, because the SAME rows also produce `search_wazuh_data`'s enum and
 * `guardrails.ts`'s aggregation allowlist: a field that can be enumerated on an index the enum
 * cannot name is unreachable, and an index the enum can name whose fields cannot be discovered is
 * unanswerable. The header comment above still holds for the distinction it makes -- the WCS
 * catalog says a field EXISTS, not which index carries it for this product -- and
 * `state-families.ts` is where that second, product-owned fact lives for the state surfaces.
 *
 * APPEND-ONLY and de-duplicated by tool family, deliberately: a field's FIRST location is its
 * default when the caller omits `index_family`, so every pre-existing default above is preserved
 * exactly (e.g. `host.os.name` still defaults to inventory_system, `package.name` to
 * inventory_packages, `interface.state` to inventory_ports) and the new families only ever widen
 * the choice.
 */
for (const stateFamily of STATE_FAMILIES) {
  const { toolFamily } = stateFamily;
  if (!toolFamily) {
    continue;
  }
  for (const field of stateFamily.aggFields) {
    if (FIELD_LOCATIONS[field] === undefined) {
      FIELD_LOCATIONS[field] = [];
    }
    const locations = FIELD_LOCATIONS[field];
    if (!locations.some(location => location.family === toolFamily)) {
      locations.push({ family: toolFamily, index: stateFamily.pattern });
    }
  }
}

const ALL_FAMILIES = Array.from(
  new Set(
    Object.values(FIELD_LOCATIONS).flatMap(locations =>
      locations.map(l => l.family),
    ),
  ),
).sort();

/** Every `AGG_FIELD_ALLOWLIST` field this tool knows how to query on the given `family` (this
 * module's own `family` vocabulary -- "findings"/"events"/"sca"/etc., NOT `common/
 * field-catalog.ts`'s dotted family keys). Used by `field-drift-canary.ts` to also live-check the
 * fields tool params actually filter/aggregate on, not just the WCS catalog's fields -- see that
 * module's doc comment for why both sources matter. */
export function fieldsForFamily(family: string): string[] {
  return Object.entries(FIELD_LOCATIONS)
    .filter(([, locations]) =>
      locations.some(location => location.family === family),
    )
    .map(([field]) => field)
    .sort();
}

/** Simple, bounded prefix/substring match for the "did you mean" suggestion list -- no fuzzy
 * matching dependency, just a plain scan of the (short, ~20-entry) allowlist. Two tiers, STRONG
 * matches (substring either direction, or one's last dot-segment is a prefix of the other's --
 * catches a truncated-field-path typo, e.g. "wazuh.rule.lev" -> "wazuh.rule.level", the case this
 * module's own test exercises) sorted ahead of WEAK matches (same leading path segment only, e.g.
 * any other "wazuh.*" field) -- so a near-miss on the meaningful part of the name is never pushed
 * out of the capped top 5 by a same-namespace field that shares nothing but "wazuh.". Code review
 * B10: an inserted-letter typo like "wazuh.rule.leveel" shares no contiguous substring or
 * last-segment prefix relation with "wazuh.rule.level" and is NOT caught by this tier -- that class
 * of typo is out of scope for this deliberately simple matcher, not a bug. */
function suggestCloseFields(field: string): string[] {
  const needle = field.toLowerCase();
  const needleSegments = needle.split('.');
  const firstSegment = needleSegments[0];
  const lastSegment = needleSegments[needleSegments.length - 1];
  const strong: string[] = [];
  const weak: string[] = [];
  for (const candidate of listAggAllowedFields()) {
    const lower = candidate.toLowerCase();
    const segments = lower.split('.');
    const candidateLastSegment = segments[segments.length - 1];
    const isStrongMatch =
      lower.includes(needle) ||
      needle.includes(lower) ||
      candidateLastSegment.startsWith(lastSegment) ||
      lastSegment.startsWith(candidateLastSegment);
    if (isStrongMatch) {
      strong.push(candidate);
    } else if (segments[0] === firstSegment) {
      weak.push(candidate);
    }
  }
  return [...strong, ...weak].slice(0, 5);
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
      "not a fixed, already-documented enum (a tool parameter's own `enum` list already tells " +
      'you its valid values -- you do not need this tool for those); also use it AFTER a filtered ' +
      'call returns zero rows, to check whether the filter value itself was wrong before ' +
      'concluding the data does not exist. Only works for a small set of vetted, bounded-' +
      "cardinality fields (the same list this catalog's aggregations are always restricted to) -- " +
      'if the field you need is not accepted, say what you could check instead of guessing a value. ' +
      'On the "findings"/"events" surfaces specifically, the ECS `host.os.name`/`host.os.platform` ' +
      'fields are largely UNPOPULATED -- if a call on one of those returns a high `missing_count`, ' +
      'call this tool again with field "wazuh.agent.host.os.name"/"wazuh.agent.host.os.platform" ' +
      '(the populated twin for the same data) before concluding the value does not exist.',
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
            `most common values overall. Max ${PREFIX_MAX_LENGTH} characters.`,
        },
        ...timeRangeProperties(),
      },
      ['field'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  /** Code review B1 (alias surfacing, AI/plan/b-review.md P1.1): the only production caller of
   * `common/field-catalog.ts`'s `FIELD_ALIASES`/`resolveFieldAlias` -- without this, that map had
   * zero runtime consumers and was exercised only by its own unit test. When the resolved
   * `field`/`index_family` combination has a known-unpopulated-on-this-family alias (currently
   * `host.os.name`/`host.os.platform` on `findings`/`events`), this surfaces the POPULATED twin's
   * field name via `Digest.assumptionNote` -- the same channel `get_agent_inventory` uses for an
   * inferred `agent_id` -- so the model sees the pointer on the SAME call instead of needing a
   * prompt-only hint to know to ask again. Params are never rewritten here: the tool still queries
   * exactly the field/family the caller asked for (so `missing_count` on the empty twin remains
   * observable, per this scenario's own point), the note only tells the model where to look next. */
  resolveParams(params): Promise<ResolveParamsResult> {
    const resolvedParams: Record<string, unknown> = { ...params };
    const field = typeof params.field === 'string' ? params.field : undefined;
    if (
      !field ||
      !isAggAllowedField(field) ||
      FIELD_LOCATIONS[field] === undefined
    ) {
      return Promise.resolve({
        ok: true,
        resolved: { params: resolvedParams },
      });
    }
    const locations = FIELD_LOCATIONS[field];
    const requestedFamily = optionalStringParam(params.index_family);
    const location = requestedFamily
      ? locations.find(candidate => candidate.family === requestedFamily)
      : locations[0];
    if (!location) {
      return Promise.resolve({
        ok: true,
        resolved: { params: resolvedParams },
      });
    }
    const catalogFamily = TOOL_FAMILY_TO_CATALOG_FAMILY[location.family];
    if (!catalogFamily) {
      return Promise.resolve({
        ok: true,
        resolved: { params: resolvedParams },
      });
    }
    const populatedTwin = resolveFieldAlias(catalogFamily, field);
    const resolved: ResolvedToolParams = { params: resolvedParams };
    if (
      populatedTwin !== field &&
      FIELD_ALIASES[catalogFamily]?.[field] !== undefined
    ) {
      resolved.note =
        `"${field}" is largely unpopulated on the "${location.family}" surface -- ` +
        `"${populatedTwin}" is the populated twin for the same data on this fleet; call ` +
        `get_field_values again with field "${populatedTwin}" to see the real distribution.`;
    }
    return Promise.resolve({ ok: true, resolved });
  },
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
    if (rawPrefix && rawPrefix.length > PREFIX_MAX_LENGTH) {
      throw new Error(
        `Parameter "prefix" is ${rawPrefix.length} characters long; the maximum is ` +
          `${PREFIX_MAX_LENGTH}. Narrow the prefix instead of passing the full expected value.`,
      );
    }
    const prefix = rawPrefix && rawPrefix.length > 0 ? rawPrefix : undefined;

    // Code review B8: reuse the single source of truth for "does this index need a bounded
    // @timestamp range" instead of hand-rolling the same family check a second time -- this drifts
    // the moment a new time-based family is added, and the old failure mode was a guardrail
    // rejection at runtime, not a compile error.
    const isTimeBased = requiresBoundedTimeRange(location.index);
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
          missing_count: {
            filter: { bool: { must_not: [{ exists: { field } }] } },
          },
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
  // Cost-budget class 1 (chat.ts's tool-round budget): this request is `size: 0` --
  // aggregation-only, no hit documents (see the buildBody `size: 0` above).
  costClass: 1,
};
