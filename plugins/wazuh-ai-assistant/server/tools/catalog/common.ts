import { JsonSchemaObject, JsonSchemaProperty } from '../../../common/types';
import { ToolTableColumnSpec } from '../types';
import { clampInt } from '../guardrails';

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

/** Reads an optional string params value, returning `undefined` for anything not a string. */
export function optionalStringParam(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Severity model: `wazuh.rule.level` on wazuh-findings-v5* is a
 * KEYWORD with these five ordered values. A numeric range query on it would do lexicographic
 * string comparison (silently wrong), so severity filters are expressed as a `terms` filter
 * instead — an exact match by default (`severityFilterValues`), or a floor/ceiling over this
 * ordered list when opted into (`severitiesAtOrAbove`/`severitiesAtOrBelow`).
 */
export const SEVERITY_ORDER = [
  'informational',
  'low',
  'medium',
  'high',
  'critical',
] as const;
export type SeverityWord = (typeof SEVERITY_ORDER)[number];

/**
 * The severity words at or above `min` (inclusive), for a `terms` filter — e.g. `'medium'` ->
 * `['medium','high','critical']`. Case-insensitive; an unrecognized value returns the full list
 * (no floor), failing OPEN toward showing more rather than silently hiding findings.
 */
export function severitiesAtOrAbove(min: string): SeverityWord[] {
  const idx = SEVERITY_ORDER.indexOf(min.trim().toLowerCase() as SeverityWord);
  return idx === -1 ? [...SEVERITY_ORDER] : SEVERITY_ORDER.slice(idx);
}

/**
 * The severity words at or below `max` (inclusive), for a `terms` filter — e.g. `'medium'` ->
 * `['informational','low','medium']`. Case-insensitive; an unrecognized value returns the full
 * list (no ceiling), failing OPEN toward showing more rather than silently hiding findings.
 */
export function severitiesAtOrBelow(max: string): SeverityWord[] {
  const idx = SEVERITY_ORDER.indexOf(max.trim().toLowerCase() as SeverityWord);
  return idx === -1 ? [...SEVERITY_ORDER] : SEVERITY_ORDER.slice(0, idx + 1);
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
): SeverityWord[] {
  if (
    comparison !== undefined &&
    !VALID_SEVERITY_COMPARISONS.includes(comparison)
  ) {
    return [...SEVERITY_ORDER];
  }
  if (comparison === 'at_or_above') {
    return severitiesAtOrAbove(value);
  }
  if (comparison === 'at_or_below') {
    return severitiesAtOrBelow(value);
  }
  const normalized = value.trim().toLowerCase() as SeverityWord;
  return SEVERITY_ORDER.includes(normalized)
    ? [normalized]
    : [...SEVERITY_ORDER];
}

/** The `severity` enum property shared by the finding tools that take a severity filter. */
export function severityProperty(): JsonSchemaProperty {
  return {
    type: 'string',
    description:
      'Severity to filter on: one of informational, low, medium, high, critical. Matches ' +
      'that exact severity by default — use severity_comparison for "or above"/"or below". ' +
      'Omit for no severity filter.',
    enum: [...SEVERITY_ORDER],
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
 * Shared baseline `tableSpec.columns`/`digest.sampleColumns` for the 8 finding-hits tools
 * (get_critical_findings, get_findings_by_time, get_brute_force, get_suspicious_powershell,
 * search_findings_by_agent, search_findings_by_multiple_agents, search_findings_by_rule_title,
 * search_findings_by_rule_group). Each previously kept its own identical copy.
 */
export const STANDARD_FINDING_TABLE_COLUMNS: ToolTableColumnSpec[] = [
  { field: '@timestamp', label: 'Time' },
  { field: 'wazuh.agent.name', label: 'Agent' },
  { field: 'wazuh.rule.title', label: 'Title' },
  { field: 'wazuh.rule.level', label: 'Level', severity: true },
  { field: 'wazuh.rule.category', label: 'Category' },
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
  'wazuh.rule.tags',
  'wazuh.rule.mitre.technique.id',
  'source.ip',
  'source.port',
  'source.user.name',
  'destination.user.name',
  'process.command_line',
];

/**
 * Fields added to every finding-hits tool's digest `sampleColumns` — the model-facing subset of
 * the investigation row set (deliberately narrower: `source.port`/`process.command_line` stay
 * row-only, not sent to the model). Every one of these has a `server/tools/privacy.ts`
 * `FIELD_POLICY_DEFAULTS` entry before it reaches a digest. These are the ECS
 * findings-v5 field names.
 */
export const FINDING_DIGEST_EXTRA_COLUMNS = [
  'wazuh.rule.tags',
  'destination.user.name',
  'source.user.name',
  'source.ip',
  'wazuh.rule.mitre.technique.id',
];

/**
 * Returns `FINDING_INVESTIGATION_ROW_FIELDS` minus whatever the calling tool already declares as a
 * visible `tableSpec.columns` field (e.g. `get_pci_dss_findings`'s `wazuh.rule.compliance.pci_dss`)
 * — so `buildTableSpec` (digest.ts) never assigns the same dot-path into a row twice.
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
 * get_critical_vulnerabilities, get_vulnerabilities_by_agent, get_vulnerability_by_cve) —
 * Identical across all four call sites.
 */
export const VULN_DIGEST_SAMPLE_COLUMNS = [
  'wazuh.agent.name',
  'vulnerability.id',
  'vulnerability.severity',
  'package.name',
  'package.version',
  'package.architecture',
  'vulnerability.score.base',
];

/**
 * Shared outbound `_source` list for get_vulnerabilities and get_critical_vulnerabilities —
 * Identical (same fields, same order) at every call site.
 * Part of the outbound Indexer request: order and contents must stay exactly as below.
 */
export const VULN_SOURCE_FIELDS = [
  ...VULN_DIGEST_SAMPLE_COLUMNS,
  'vulnerability.description',
];

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
