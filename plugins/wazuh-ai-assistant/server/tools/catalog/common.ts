import { JsonSchemaObject, JsonSchemaProperty } from '../../../common/types';
import { SEVERITY_LEVELS, SeverityLevel } from '../../../common/wazuh-fields';
import { ToolTableColumnSpec } from '../types';
import { clampInt, MAX_AGG_SIZE } from '../guardrails';
import { BREAKDOWN_BUCKET_CAP } from '../digest';

/**
 * Shared helpers for the catalog tool modules under server/tools/catalog/. Kept separate from
 * server/tools/guardrails.ts: these are per-tool *parameter* concerns (defaults, clamping, format
 * validation for a single field) applied while building the request; guardrails.ts is the
 * uniform, defense-in-depth pass applied to every outbound request regardless of which tool (or
 * the escape hatch) produced it.
 */

/** `now`, `now-90d`, `now-24h`, `now-15m`, or an ISO-8601 timestamp (date or date-time). */
const DATE_MATH_OR_ISO_RE =
  /^now(-\d+[dhm])?$|^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/;

export const DEFAULT_TIME_RANGE_GTE = 'now-90d';
export const DEFAULT_TIME_RANGE_LTE = 'now';

/** Security Analytics content (get_rules, get_threat_intel_components) is namespaced across these
 * four spaces (confirmed live via each index's own `space.name` field) -- shared here so both
 * tools' `space` parameter and executor.ts's `resolveSecurityAnalyticsSpace` fallback agree on the
 * same vocabulary. */
export const SECURITY_ANALYTICS_SPACES = [
  'draft',
  'test',
  'custom',
  'standard',
] as const;
export type SecurityAnalyticsSpace = (typeof SECURITY_ANALYTICS_SPACES)[number];

/** Optional `space` parameter shared by get_rules/get_threat_intel_components -- `undefined` when
 * absent or not one of `SECURITY_ANALYTICS_SPACES`, meaning "no space filter" (every space). */
export function parseSecurityAnalyticsSpace(
  value: unknown,
): SecurityAnalyticsSpace | undefined {
  return typeof value === 'string' &&
    (SECURITY_ANALYTICS_SPACES as readonly string[]).includes(value)
    ? (value as SecurityAnalyticsSpace)
    : undefined;
}

/**
 * Validates a time-range bound's format (`common/types.ts`'s flat JsonSchemaObject has no way to
 * express a regex/pattern constraint, so this lives outside the generic schema_validator).
 * Returns the value unchanged when valid (OpenSearch accepts date-math strings verbatim); throws
 * a descriptive Error otherwise, which the orchestration loop turns into a bounded tool_result
 * error for the model to self-correct.
 */
export function validateTimeBound(value: string, paramName: string): string {
  if (!DATE_MATH_OR_ISO_RE.test(value)) {
    throw new Error(
      `Parameter "${paramName}" must be date-math ("now", "now-90d", "now-24h", "now-15m") or an ` +
        `ISO-8601 timestamp; got "${value}".`,
    );
  }
  return value;
}

/** Clamps a caller-supplied limit to [1, max], applying `defaultValue` when omitted.
 *
 * The `Number.isFinite` guard runs HERE, before ever calling the shared `clampInt` primitive
 * (server/tools/guardrails.ts) -- unlike `clampManagerParams` in that file, a non-finite `value`
 * (NaN, Infinity, or simply not a number) falls back to `defaultValue` rather than propagating.
 * `clampInt` itself only does the floor/cap clamp; the finite check and truncation are this call
 * site's own responsibility, same as before this was factored out. */
export function clampLimit(
  value: unknown,
  defaultValue: number,
  max: number,
): number {
  const numeric =
    typeof value === 'number' && Number.isFinite(value) ? value : defaultValue;
  return clampInt(Math.trunc(numeric), 1, max);
}

/** The `limit` property shared by every catalog tool's params schema. */
export function limitProperty(description: string): JsonSchemaProperty {
  return { type: 'number', description };
}

/**
 * `clampLimit` for a limit that becomes an AGGREGATION `size` rather than a hits `size` — clamps to
 * `MAX_AGG_SIZE` (server/tools/guardrails.ts) instead of taking a caller-chosen max.
 *
 * Use this, never `clampLimit(value, n, <literal>)`, whenever the clamped result is written into a
 * `terms`/`composite`/`multi_terms` `size`. Reason (issue #8894): `guardrails.ts`'s `checkAggs`
 * rejects any aggregation size above `MAX_AGG_SIZE`, and `executor.ts` runs `lintDsl` on EVERY
 * indexer request with no per-tool exemption. So a tool that clamped its own limit to a larger
 * number did not get a bigger aggregation — it got a hard failure for the whole range above the cap.
 * `get_sca_results` clamped to 500 and every call in 101-500 was refused. Taking the cap from the
 * guardrail constant makes that arithmetic mismatch unrepresentable rather than merely fixed once.
 *
 * Hits-paging limits are unaffected and must keep using `clampLimit`: `applySafetyValves` clamps a
 * top-level `size` to `MAX_SIZE` (500) rather than rejecting it, so a large hits limit degrades
 * gracefully where a large agg size does not. That asymmetry is exactly why the two need different
 * helpers.
 */
export function clampAggLimit(value: unknown, defaultValue: number): number {
  return clampLimit(value, defaultValue, MAX_AGG_SIZE);
}

/**
 * `limitProperty` for an aggregation-backed limit: builds the description so the advertised maximum
 * is READ FROM the same `MAX_AGG_SIZE` the guardrail enforces.
 *
 * The half of issue #8894 that actually misled the model was the description — it promised `max 500`
 * on a tool that failed above 100, so a model following the schema was steered into the broken
 * range. Generating the sentence removes the possibility of the two numbers disagreeing; a future
 * change to the cap updates every tool's advertised maximum automatically.
 */
export function aggLimitProperty(
  subject: string,
  defaultValue: number,
): JsonSchemaProperty {
  return limitProperty(
    `Max number of ${subject} to return (default ${defaultValue}, max ${MAX_AGG_SIZE}).`,
  );
}

/** Reads an optional string params value, returning `undefined` for anything not a string. */
export function optionalStringParam(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Severity model: `wazuh.rule.level` on wazuh-findings-v5* is a
 * KEYWORD with these five ordered values (`SEVERITY_LEVELS`, `common/wazuh-fields.ts`). A numeric
 * range query on it would do lexicographic string comparison (silently wrong), so severity
 * filters are expressed as a `terms` filter instead — an exact match by default
 * (`severityFilterValues`), or a floor/ceiling over this ordered list when opted into
 * (`severitiesAtOrAbove`/`severitiesAtOrBelow`).
 */

/**
 * The severity words at or above `min` (inclusive), for a `terms` filter — e.g. `'medium'` ->
 * `['medium','high','critical']`. Case-insensitive; an unrecognized value returns the full list
 * (no floor), failing OPEN toward showing more rather than silently hiding findings.
 */
export function severitiesAtOrAbove(min: string): SeverityLevel[] {
  const idx = SEVERITY_LEVELS.indexOf(
    min.trim().toLowerCase() as SeverityLevel,
  );
  return idx === -1 ? [...SEVERITY_LEVELS] : SEVERITY_LEVELS.slice(idx);
}

/**
 * The severity words at or below `max` (inclusive), for a `terms` filter — e.g. `'medium'` ->
 * `['informational','low','medium']`. Case-insensitive; an unrecognized value returns the full
 * list (no ceiling), failing OPEN toward showing more rather than silently hiding findings.
 */
export function severitiesAtOrBelow(max: string): SeverityLevel[] {
  const idx = SEVERITY_LEVELS.indexOf(
    max.trim().toLowerCase() as SeverityLevel,
  );
  return idx === -1 ? [...SEVERITY_LEVELS] : SEVERITY_LEVELS.slice(0, idx + 1);
}

export type SeverityComparison = 'exact' | 'at_or_above' | 'at_or_below';

const VALID_SEVERITY_COMPARISONS: readonly string[] = [
  'exact',
  'at_or_above',
  'at_or_below',
];

/**
 * Resolves a severity value + comparison mode to the `terms` list a query should filter on.
 * `wazuh.rule.level` is a categorical word, not a numeric scale, so an exact match is the
 * correct default — "medium" means medium, not "medium or worse". `at_or_above`/`at_or_below`
 * are opt-in for when the user actually asks for a floor/ceiling ("medium or higher").
 *
 * `comparison` is only trustworthy at the type level — a model can send any string for it, and
 * the JSON Schema `enum` isn't runtime-enforced. An unrecognized comparison fails OPEN to the
 * full severity list (same direction as an unrecognized `value`), not to a silent exact match —
 * a hallucinated comparison should widen results, never narrow them without saying so.
 */
export function severityFilterValues(
  value: string,
  comparison?: string,
): SeverityLevel[] {
  if (
    comparison !== undefined &&
    !VALID_SEVERITY_COMPARISONS.includes(comparison)
  ) {
    return [...SEVERITY_LEVELS];
  }
  if (comparison === 'at_or_above') {
    return severitiesAtOrAbove(value);
  }
  if (comparison === 'at_or_below') {
    return severitiesAtOrBelow(value);
  }
  const normalized = value.trim().toLowerCase() as SeverityLevel;
  return SEVERITY_LEVELS.includes(normalized)
    ? [normalized]
    : [...SEVERITY_LEVELS];
}

/** The `severity` enum property shared by the finding tools that take a severity filter. */
export function severityProperty(): JsonSchemaProperty {
  return {
    type: 'string',
    description:
      'Severity to filter on: one of informational, low, medium, high, critical. Matches ' +
      'that exact severity by default — use severity_comparison for "or above"/"or below". ' +
      'Omit for no severity filter.',
    enum: [...SEVERITY_LEVELS],
  };
}

/** The `severity_comparison` enum property shared by the finding tools that take a severity
 * filter — paired with `severityProperty()`. Defaults to an exact match. */
export function severityComparisonProperty(): JsonSchemaProperty {
  return {
    type: 'string',
    description:
      'How to compare against severity: "exact" (default) matches only that severity; ' +
      '"at_or_above" includes that severity and everything more severe; "at_or_below" ' +
      'includes that severity and everything less severe. Only meaningful when severity is set.',
    enum: ['exact', 'at_or_above', 'at_or_below'],
  };
}

/** The two flat time-range properties shared by every Indexer-backed catalog tool. */
export function timeRangeProperties(): Record<string, JsonSchemaProperty> {
  return {
    time_range_gte: {
      type: 'string',
      description:
        'Start of the time range: date-math ("now-90d", "now-24h") or ISO-8601. ' +
        'Defaults to "now-90d".',
    },
    time_range_lte: {
      type: 'string',
      description:
        'End of the time range: date-math ("now") or ISO-8601. Defaults to "now".',
    },
  };
}

/**
 * Optional artifact-filter parameters shared by the finding-hits tools (issue: "Add artifact
 * filters to finding tools"): `source.ip` is already returned in every finding-hits tool's
 * digest (`FINDING_DIGEST_EXTRA_COLUMNS` below) and named in `server/prompts.ts`'s guidance to
 * "prefer the typed finding tools" for IP/user/process questions, yet no typed tool could
 * actually filter on it -- the model's only option was hand-writing DSL via search_wazuh_data.
 * `destination.ip` is confirmed `ip`-mapped and `searchable` on `wazuh-findings-v5*` via a live
 * `_field_caps` check (see the issue) even though it is not itself in the digest yet; a filter on
 * it is still correct (it narrows to documents that HAVE it), just possibly sparse. `process.name`
 * is already used internally by `get_suspicious_powershell.ts`'s own `buildRequest`, confirming
 * it is queryable on this index -- this exposes the same field as a caller-supplied filter
 * instead of a hardcoded value list. Follows the same shape as `severityProperty()`/
 * `timeRangeProperties()` above: a properties-map helper paired with a clause-resolver
 * (`findingArtifactFilterClauses` below) that every finding-hits tool's `buildRequest` calls.
 */
export function findingArtifactFilterProperties(): Record<
  string,
  JsonSchemaProperty
> {
  return {
    source_ip: {
      type: 'string',
      description:
        'Filter to findings whose source.ip exactly matches this IP address (the attacker/' +
        'originating side).',
    },
    destination_ip: {
      type: 'string',
      description:
        'Filter to findings whose destination.ip exactly matches this IP address (the target ' +
        'side). Mapped but not densely populated on every dataset -- 0 rows may mean the field ' +
        'is absent on matching documents, not that none exist.',
    },
    process_name: {
      type: 'string',
      description:
        'Filter to findings whose process.name exactly matches this process/program name (e.g. ' +
        '"powershell.exe").',
    },
    source_user_name: {
      type: 'string',
      description:
        'Filter to findings whose source.user.name exactly matches this username.',
    },
    destination_user_name: {
      type: 'string',
      description:
        'Filter to findings whose destination.user.name exactly matches this username.',
    },
  };
}

/**
 * Resolves `findingArtifactFilterProperties()`'s five optional params to zero or more `term`
 * filter clauses, in the fixed order below, for each caller's `buildRequest` to append to its own
 * `bool.filter` array (see e.g. search-findings-by-agent.ts). A call that supplies none of the
 * five gets `[]` back -- every existing caller's request body is therefore byte-identical to
 * before this existed, which is what makes "a tool call with no artifact filter supplied is
 * unchanged" true by construction rather than by a separate code path.
 */
export function findingArtifactFilterClauses(
  params: Record<string, unknown>,
): Record<string, unknown>[] {
  const clauses: Record<string, unknown>[] = [];
  const sourceIp = optionalStringParam(params.source_ip);
  if (sourceIp) {
    clauses.push({ term: { 'source.ip': sourceIp } });
  }
  const destinationIp = optionalStringParam(params.destination_ip);
  if (destinationIp) {
    clauses.push({ term: { 'destination.ip': destinationIp } });
  }
  const processName = optionalStringParam(params.process_name);
  if (processName) {
    clauses.push({ term: { 'process.name': processName } });
  }
  const sourceUserName = optionalStringParam(params.source_user_name);
  if (sourceUserName) {
    clauses.push({ term: { 'source.user.name': sourceUserName } });
  }
  const destinationUserName = optionalStringParam(params.destination_user_name);
  if (destinationUserName) {
    clauses.push({ term: { 'destination.user.name': destinationUserName } });
  }
  return clauses;
}

export function resolveTimeRange(params: Record<string, unknown>): {
  gte: string;
  lte: string;
} {
  const gte = validateTimeBound(
    typeof params.time_range_gte === 'string'
      ? params.time_range_gte
      : DEFAULT_TIME_RANGE_GTE,
    'time_range_gte',
  );
  const lte = validateTimeBound(
    typeof params.time_range_lte === 'string'
      ? params.time_range_lte
      : DEFAULT_TIME_RANGE_LTE,
    'time_range_lte',
  );
  return { gte, lte };
}

/** Builds a flat JsonSchemaObject from a properties map, matching this repo's minimal subset. */
export function objectSchema(
  properties: Record<string, JsonSchemaProperty>,
  required?: string[],
): JsonSchemaObject {
  return { type: 'object', properties, ...(required ? { required } : {}) };
}

/**
 * Negative-scope + vocabulary note appended to every finding-hits tool's `spec.description` --
 * the fix for a measured failure ("give me everything that happened on X") where two different
 * model families silently substituted a narrower rule-matched-only search and reported "nothing
 * happened" instead of saying no rule fired. Kept as one shared string so all 8 (see
 * `STANDARD_FINDING_TABLE_COLUMNS`'s doc comment below) finding-hits tools carry identical
 * wording rather than independently-drifting paraphrases -- every finding-hits tool description
 * appends this verbatim. "alerts/hits/signals" is the synonym vocabulary analysts use for
 * "findings"; the model matches on this text at tool-choice time, not against a fixed keyword map.
 */
export const FINDING_SCOPE_NOTE =
  'Covers rule-matched detections (alerts/hits/signals) only -- never the raw, unmatched event ' +
  'stream; if this returns 0 rows, say so plainly rather than reporting nothing happened. ' +
  // EXPLAIN-WAVE PHASE 4 (eval items EV2-VUL-001, EV2-EXP-013): the surface half. A question
  // scoped to detection history ("which agents have a CVE-2024-21412 detection in the findings
  // history") was answered from `wazuh-states-vulnerabilities`, which lists two hosts where the
  // findings stream records one -- the model disclosed the substitution and still answered the
  // wrong surface, so the distinction has to be visible at tool-choice time, not only afterwards.
  'Findings are detection HISTORY (what was detected, and when), not current state.';

/** Current-state note appended to the 4 vulnerability tools' descriptions: `wazuh-states-
 * vulnerabilities*` is a snapshot, not a timeline, so there is no "solved/resolved" history to
 * report -- see also `server/prompts.ts`'s matching instruction, which this makes visible at
 * tool-choice time too, not only after a tool is already picked. */
export const VULN_CURRENT_STATE_NOTE =
  'Reflects current vulnerability state only -- no patched/unpatched history over time. ' +
  // EXPLAIN-WAVE PHASE 4 (eval items EV2-VUL-001, EV2-EXP-013): the other half of the surface
  // split FINDING_SCOPE_NOTE now names. "Current state only" said what this surface is NOT a
  // timeline of, but never that another surface answers the history question -- so a detection-
  // history question stayed here and came back with the wrong host set.
  'This is what IS vulnerable right now; for what WAS detected, and when, use the findings tools.';

/**
 * Current-state note appended to the two SCA tools' descriptions (get_sca_results,
 * get_sca_checks). EXPLAIN-WAVE PHASE 4: same surface split as `VULN_CURRENT_STATE_NOTE` /
 * `FINDING_SCOPE_NOTE` above -- `wazuh-states-sca` holds the LATEST scan verdict per check, while
 * an SCA-check finding on the findings stream records that a check was seen failing at a point in
 * time. Nothing told the model those were different surfaces, and a compliance question phrased
 * either way reached whichever tool the router happened to offer.
 */
export const SCA_CURRENT_STATE_NOTE =
  'Reflects the latest SCA scan state (what passes/fails now), not a history of when a check ' +
  'started failing; for that, use the findings tools.';

/** Current-state note appended to the syscollector inventory tools' descriptions (and, from issue
 * 12's consolidation onward, to `get_agent_inventory`'s): `wazuh-states-inventory-*` is a snapshot
 * written at scan/collection time, not an event-time record, so it answers "what does agent X look
 * like now", never "what did it look like when finding Y fired". */
export const INVENTORY_CURRENT_STATE_NOTE =
  'Reflects current state only, not the state at any past event time.';

/**
 * Shared baseline `tableSpec.columns`/`digest.sampleColumns` for the 8 finding-hits tools
 * (get_critical_findings, get_findings_by_time, get_brute_force, get_suspicious_powershell,
 * search_findings_by_agent, search_findings_by_multiple_agents, search_findings_by_rule_title,
 * search_findings_by_rule_tag). Each previously kept its own identical copy.
 */
export const STANDARD_FINDING_TABLE_COLUMNS: ToolTableColumnSpec[] = [
  { field: '@timestamp', label: 'Time' },
  { field: 'wazuh.agent.name', label: 'Agent' },
  { field: 'wazuh.rule.title', label: 'Title' },
  { field: 'wazuh.rule.level', label: 'Level', severity: true },
  { field: 'wazuh.integration.category', label: 'Category' },
];
export const STANDARD_FINDING_TABLE_COLUMN_FIELDS =
  STANDARD_FINDING_TABLE_COLUMNS.map(column => column.field);
export const STANDARD_FINDING_SAMPLE_COLUMNS = [
  '@timestamp',
  'wazuh.agent.name',
  'wazuh.rule.title',
  'wazuh.rule.level',
];

/**
 * Investigation field set added to every finding-hits tool's table ROWS: revealed by the row
 * expander (and available to `digest.sampleColumns`, see `findingDigestColumns` below), never as
 * a visible `tableSpec.columns` entry (visible columns stay exactly as they are). The heavy,
 * PII-rich raw full-log field is deliberately excluded — there is no equivalent field to
 * include here.
 */
export const FINDING_INVESTIGATION_ROW_FIELDS = [
  '_id',
  'wazuh.rule.id',
  'wazuh.rule.tags',
  'wazuh.rule.mitre.technique.id',
  'source.ip',
  'source.port',
  'source.user.name',
  'destination.user.name',
  'process.command_line',
];

/**
 * Group-by dimensions for digest.ts's `buildSyntheticBreakdown` — shared by the same 8
 * finding-hits tools listed above. These two are the ones the issue this exists for names
 * verbatim ("which agents"/"which rules"); every finding row carries both regardless of which
 * columns the calling tool declares visible, so this is safe to share across all 8 unconditionally.
 */
export const FINDING_BREAKDOWN_DIMENSIONS = [
  'wazuh.agent.name',
  'wazuh.rule.title',
  // Severity (2026-08-14, UI run C8): "how many findings by severity" is the most obvious
  // aggregative question a security product gets, and with only the two dimensions above no
  // finding-hits tool could answer it in one call -- the model fanned out one filtered call per
  // severity, spent the whole MAX_TOOL_ROUNDS budget on three of the five levels, and (honestly)
  // reported low/informational as never requested. A closed five-word vocabulary
  // (informational..critical), so the extra terms agg is five buckets of overhead at most, and
  // the field is already on field-policy-coverage.test.ts's reviewed known-safe list.
  'wazuh.rule.level',
];

/** Derives a valid, unique OpenSearch top-level aggregation name from a dot-path field — agg names
 * are plain object keys with no dot restriction, but a stable NAME distinct from the field path
 * itself (rather than reusing the path verbatim as the key) keeps `digest.ts`'s `breakdown[].agg`
 * tag readable and avoids relying on dots surviving unescaped through any future request
 * transform. */
export function aggNameForField(field: string): string {
  return field.replace(/\./g, '_');
}

/**
 * Real `terms` aggregations over `FINDING_BREAKDOWN_DIMENSIONS`, attached to every finding-hits
 * typed tool's request body (see e.g. get-critical-findings.ts's `buildRequest`) alongside the
 * existing `query`/`sort`/`size` — OpenSearch computes `aggregations` over the FULL MATCHED set of
 * a query regardless of `size`, independently of how many hits are actually returned. This closes
 * the #8870 validation-gate gap: a breakdown computed over only the RETURNED page
 * (`buildSyntheticBreakdown`, digest.ts) is wrong whenever `size`/`limit` truncates the match set,
 * because the digest hands it to the model as if it were the population. With this `aggs` clause
 * present, `buildBreakdown` (digest.ts, unmodified — it already read `result.aggregations`
 * generically for the search_wazuh_data escape hatch) picks up the real, population-true
 * distribution instead, and the synthetic path never runs for these 8 tools.
 *
 * Both dimension fields are already on `guardrails.ts`'s `AGG_FIELD_ALLOWLIST`, so this passes
 * `checkAggs` unmodified. Sized at `BREAKDOWN_BUCKET_CAP` — the same per-dimension bucket budget
 * `buildSyntheticBreakdown` uses — so the token cost of a breakdown does not change depending on
 * whether the real or the synthetic path ends up serving a given call.
 */
export const FINDING_BREAKDOWN_AGGS: Record<string, unknown> =
  Object.fromEntries(
    FINDING_BREAKDOWN_DIMENSIONS.map(field => [
      aggNameForField(field),
      { terms: { field, size: BREAKDOWN_BUCKET_CAP } },
    ]),
  );

/**
 * Fields added to every finding-hits tool's digest `sampleColumns` — the model-facing subset of
 * the investigation row set (`source.port` stays row-only, not sent to the model). Every one of
 * these has a `server/tools/privacy.ts` `FIELD_POLICY_DEFAULTS` entry before it reaches a digest.
 * These are the ECS findings-v5 field names.
 *
 * EXPLAIN-WAVE PHASE 2 (AI/plan/eval-v2/tooling-gap-map.md gap 2): `wazuh.rule.description` and
 * `process.command_line` are new here, and `process.command_line` REVERSES this list's previous
 * "stays row-only, not sent to the model" decision. The measured reason: an explanatory question
 * ("explain this event and what to do about it") was answerable only from a rule TITLE, which on
 * findings-v5 is a short templated label — the model could name the finding but never say what the
 * detection actually is or what ran, and `FINAL_ROUND_ANSWER_INSTRUCTION` correctly forbids
 * inventing either. `wazuh.rule.description` is the ruleset's own prose about the detection (the
 * same text the Manager rule carries, gap 4) and is curated, not analyst/attacker input — reviewed
 * `allow`, on `wazuh.rule.title`'s reasoning. `process.command_line` is the one field that says
 * WHAT ran; it keeps its `anonymize` policy, so under privacy mode it reaches the model as a
 * pseudonym exactly as it does in the row expander (a documented explanation-quality tradeoff of
 * privacy mode, gap-map item 11 — not a new leak: `applyFieldPolicy` runs over the digest in
 * `executor.ts` regardless of which columns are declared here).
 *
 * BUDGET: both fields are free prose that can run long, so both are capped tighter than
 * `MAX_FIELD_VALUE_LENGTH` by `DIGEST_FIELD_MAX_LENGTH_DEFAULTS` (digest.ts) — see that constant
 * for the per-row arithmetic against `DIGEST_CHAR_CAP`/`CONTEXT_CHAR_BUDGET`.
 */
export const FINDING_DIGEST_EXTRA_COLUMNS = [
  'wazuh.rule.tags',
  'destination.user.name',
  'source.user.name',
  'source.ip',
  'wazuh.rule.mitre.technique.id',
  'wazuh.rule.description',
  'process.command_line',
];

/**
 * Returns `FINDING_INVESTIGATION_ROW_FIELDS` minus whatever the calling tool already declares as a
 * visible `tableSpec.columns` field — so `buildTableSpec` (digest.ts) never assigns the same
 * dot-path into a row twice.
 */
export function findingRowFields(existingColumnFields: string[]): string[] {
  return FINDING_INVESTIGATION_ROW_FIELDS.filter(
    field => !existingColumnFields.includes(field),
  );
}

/**
 * Appends `FINDING_DIGEST_EXTRA_COLUMNS` to a tool's own `digest.sampleColumns`, deduping any column
 * the tool already whitelists, so a sample row never carries the same field twice.
 */
export function findingDigestColumns(
  existingSampleColumns: string[],
): string[] {
  const extras = FINDING_DIGEST_EXTRA_COLUMNS.filter(
    field => !existingSampleColumns.includes(field),
  );
  return [...existingSampleColumns, ...extras];
}

/**
 * Shared `digest.sampleColumns` for the 4 vulnerability tools (get_vulnerabilities,
 * get_critical_vulnerabilities, get_vulnerabilities_by_agent, get_vulnerability_by_cve) — and for
 * get_cve_intel, whose local-detection request body mirrors get_vulnerability_by_cve's.
 * Identical across all five call sites.
 */
export const VULN_DIGEST_SAMPLE_COLUMNS = [
  'wazuh.agent.name',
  'vulnerability.id',
  'vulnerability.severity',
  'package.name',
  'package.version',
  'package.architecture',
  'vulnerability.score.base',
  // The two fields whose ABSENCE produced a measured capability over-promise (UI run 2026-08-14,
  // A3/B2): without them the model offered to "check whether an updated lxd package is
  // available" (no tool can) and recommended apt for a snap. `scanner.condition` carries the
  // scanner's own fix bound ("Package less than 5.21.4") -- the honest form of that offer -- and
  // `package.type` (deb/snap/pypi/npm) picks the right remediation channel. Both are
  // scanner/OS-curated metadata, not analyst/attacker free text.
  'vulnerability.scanner.condition',
  'package.type',
  // EXPLAIN-WAVE PHASE 4 (class-E "remediate this item" answers, judged ~4/10 in eval run
  // 20260825-174333). `wazuh-states-vulnerabilities` has NO dedicated fixed-version or remediation
  // field -- the live 5.0 mapping (checked against this eval env's index) carries the fix bound in
  // `vulnerability.scanner.condition` above ("Package less than KB5034763") and nothing else
  // prescriptive -- so the enrichment available here is the one field the docs DO carry and the
  // digest was silently dropping: `vulnerability.description`, already requested in
  // `VULN_SOURCE_FIELDS` below and rendered in get_cve_intel's TABLE, but never sent to the model.
  // Without it part (2) of an explanatory answer ("why it matters") has to come entirely from the
  // model's own recall of the CVE, and part (3)'s fix is stated with no idea what the flaw is. The
  // measured contrast is EV2-EXP-013, which scored 9/10 on actionability purely because
  // `scanner.condition` named `KB5034763` -- the same lever, one field wider. Third-party feed
  // prose, so capped by DIGEST_FIELD_MAX_LENGTH_DEFAULTS (digest.ts) and classified `allow-scan`
  // in privacy.ts rather than the plain `allow` the scanner/OS-curated fields above get.
  'vulnerability.description',
];

/**
 * Shared outbound `_source` list for get_vulnerabilities and get_critical_vulnerabilities —
 * Identical (same fields, same order) at every call site.
 * Part of the outbound Indexer request: order and contents must stay exactly as below.
 *
 * `vulnerability.description` used to be appended here BECAUSE it was table-only and therefore
 * absent from the digest columns; it is now a digest column itself (see above), so this list is
 * exactly the digest set and the explicit append would be a duplicate `_source` entry.
 */
export const VULN_SOURCE_FIELDS = [...VULN_DIGEST_SAMPLE_COLUMNS];

/**
 * Shared outbound `_source` list for get_vulnerabilities_by_agent and get_vulnerability_by_cve —
 * Identical (same fields, same order, `wazuh.agent.id` first) at every call site. Part of the outbound Indexer request: order and contents must stay exactly as
 * below.
 */
export const VULN_SOURCE_FIELDS_WITH_AGENT_ID = [
  'wazuh.agent.id',
  ...VULN_SOURCE_FIELDS,
];

/**
 * Dimensions for the vulnerability-listing tools' population-true breakdown (issue #8920 item 1,
 * "sample narrated as population"): get_vulnerabilities/get_critical_vulnerabilities/
 * get_vulnerabilities_by_agent only ever ran a plain hits search, so a truncated result -- e.g. "no
 * high-severity vulnerabilities" on a host with 2 critical + 2 high, all sorted outside the
 * returned page -- had no population-true view of either dimension. Both fields are already on
 * `guardrails.ts`'s `AGG_FIELD_ALLOWLIST` (severity: a closed 4-value enum; agent name: shared with
 * `FINDING_BREAKDOWN_DIMENSIONS` above). `get_vulnerability_by_cve` attaches these same
 * aggregations too (its own buildRequest): both fields are allowlisted and its index is not
 * time-based, so the population-true option is free there as well.
 */
export const VULN_BREAKDOWN_DIMENSIONS = [
  'vulnerability.severity',
  'wazuh.agent.name',
];

/**
 * Real `terms` aggregations over `VULN_BREAKDOWN_DIMENSIONS`, attached to the three hits-based
 * vulnerability tools' request bodies -- same shape and reasoning as `FINDING_BREAKDOWN_AGGS`
 * above. OpenSearch computes `aggregations` over the FULL matched set regardless of `size`, so this
 * is population-true even when the tool's own `limit` truncates the returned rows. Sized at
 * `BREAKDOWN_BUCKET_CAP` for the same token-parity reason as every other breakdown aggregation in
 * this file.
 */
export const VULN_BREAKDOWN_AGGS: Record<string, unknown> = Object.fromEntries(
  VULN_BREAKDOWN_DIMENSIONS.map(field => [
    aggNameForField(field),
    { terms: { field, size: BREAKDOWN_BUCKET_CAP } },
  ]),
);

/**
 * Guard shared by ~11 catalog buildRequest sites that require a non-empty string param: validates
 * and returns `value` unchanged (never trimmed) so a call site that needs the trimmed/transformed
 * value (e.g. get_vulnerability_by_cve's `cveId.trim().toUpperCase()`) still applies its own
 * transform afterward. `message` is the exact per-site Error text — this helper does not
 * standardize wording.
 */
export function requireNonEmptyString(value: unknown, message: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(message);
  }
  return value;
}

/** Wazuh agent IDs are zero-padded numeric strings, e.g. "000", "001", "0512" (3+ digits). */
const AGENT_ID_RE = /^\d{3,}$/;

/**
 * Validates a Manager-API agent ID param shared by the SCA and syscollector (inventory) tools.
 * Unlike `agent_name`/`agent_identifier` (free text matched against the Indexer), this value is
 * interpolated directly into a Manager API path segment, so it is validated strictly against the
 * Wazuh agent-ID format rather than merely checked for non-emptiness.
 */
export function validateAgentId(value: unknown): string {
  if (typeof value !== 'string' || !AGENT_ID_RE.test(value)) {
    throw new Error(
      'Parameter "agent_id" must be a numeric Wazuh agent ID of at least 3 digits (e.g. "001").',
    );
  }
  return value;
}

/**
 * Shared "name" filter for the two Security Analytics catalog tools (get_rules,
 * get_threat_intel_components) -- hotfix A0, root-caused in
 * `AI/plan/qa-rules-decoders-rootcause.md`: neither tool exposed ANY keyword filter, so a
 * QUALIFIED question ("is there a decoder for apache?", "the rule about SSTI") always fell back
 * to reading the full unfiltered page and admitting defeat, even though the underlying data
 * trivially answers it (live: 1 SSH decoder, 5 Apache decoders, 1 SSTI rule).
 *
 * `document.name` (decoders only) and `document.metadata.title` (every type) are mapped
 * `keyword` on every `wazuh-threatintel-*` index (confirmed live) -- exact value only, no
 * analyzer, no multi-field. A genuine substring match on a keyword field needs a LEADING
 * wildcard (`*apache*`), which `guardrails.ts`'s `lintDsl`/`findLeadingWildcard` bans outright
 * (an unbounded term-dictionary scan) -- the exact same constraint `get-sca-checks.ts`'s
 * `search` param already documents and works around for `check.name`. Do NOT reach for
 * `wildcard`/`query_string`/`regexp` here; it will be rejected by lintDsl on every call.
 *
 * This helper closes the gap in three should-clauses, none of which need a leading wildcard:
 *  1. a case-insensitive exact `term` on each keyword field (the full name/title case);
 *  2. a case-insensitive, non-leading `prefix` on each keyword field (a fragment anchored at
 *     the start, e.g. "Ensure SSH" against a check-style name) -- same shape as get-sca-checks.ts;
 *  3. an analyzed `match` against `document.metadata.description` (mapped `text`, unlike the
 *     keyword name/title fields -- a `match` TOKENIZES it, so "ssh" matches the standalone word
 *     "SSH" wherever it sits, with no wildcard involved at all).
 *
 * (3) is what actually closes the QA report's three live-witnessed failures, none of which are
 * name-prefix matches: live-verified against `wazuh-threatintel-{rules,decoders}-a`, `match
 * document.metadata.description "apache"` returns exactly the same 5 decoders the report's raw
 * wildcard probe found (apache-access, apache-error, modsecurity-apache, both apache-tomcat
 * decoders); `"ssh"` returns the 1 SSH decoder (plus one honest extra whose description also
 * names SSH); `"ssti"` returns the one rule ("Server side template injection strings...") that
 * burned Q8's whole round budget on `tag`/`technique_id` guesses that could only ever return 0.
 * The description `match` uses `operator: 'and'` (review finding F1): the default `or` operator
 * matches on ANY token, and because this whole clause sits in a non-scoring `bool.filter` sorted
 * by `_doc`, a multi-word `name` (e.g. "decoder/apache-access/0") returns hundreds of unranked,
 * mostly-irrelevant rows instead of the one row the caller meant -- live-verified 330 -> 1 hit for
 * that exact name. `and` costs nothing on the single-token cases above (unchanged results) and
 * still lets the exact-title `term`/`prefix` should-clauses fire independently.
 */
export function nameFilterProperty(subject: string): JsonSchemaProperty {
  return {
    type: 'string',
    description:
      `Case-insensitive filter on the ${subject}'s name/title (exact value or a prefix) or a ` +
      'whole-word match anywhere in its description. If a call returns 0 rows, retry once with ' +
      'a shorter root word (e.g. "ssh" instead of "sshd") before concluding nothing exists.',
  };
}

export function nameFilterClause(
  name: string,
  keywordFields: string[],
  descriptionField: string,
): Record<string, unknown> {
  const should: Record<string, unknown>[] = [];
  for (const field of keywordFields) {
    should.push({
      term: { [field]: { value: name, case_insensitive: true } },
    });
    should.push({
      prefix: { [field]: { value: name, case_insensitive: true } },
    });
  }
  should.push({
    match: { [descriptionField]: { query: name, operator: 'and' } },
  });
  return { bool: { minimum_should_match: 1, should } };
}
