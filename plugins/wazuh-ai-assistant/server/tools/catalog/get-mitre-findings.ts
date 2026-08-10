import { ToolDefinition } from '../types';
import { BREAKDOWN_BUCKET_CAP } from '../digest';
import {
  findingDigestColumns,
  findingRowFields,
  FINDING_BREAKDOWN_AGGS,
  FINDING_BREAKDOWN_DIMENSIONS,
  clampLimit,
  limitProperty,
  objectSchema,
  optionalStringParam,
  resolveTimeRange,
  timeRangeProperties,
} from './common';

/** Bare parent technique id, e.g. "T1059" -- no sub-technique dot. A dotted id ("T1059.001") names
 * one specific sub-technique and must NOT match this. */
const PARENT_TECHNIQUE_ID_RE = /^T\d+$/i;

/** Dotted sub-technique id, e.g. "T1059.001". Only used to decide whether an input LOOKS like an
 * ATT&CK id at all, so case-normalization can be skipped for anything that does not. */
const SUB_TECHNIQUE_ID_RE = /^T\d+\.\d+$/i;

/**
 * Sub-technique rollup (issue #8920 item 2): a bare parent id must match its own exact bucket
 * AND every "<id>.NNN" sub-technique -- MITRE ATT&CK itself treats a parent technique as
 * covering its children, so a `term`-only filter on "T1059" silently excludes every
 * T1059.001/.002/... finding, undercounting "how many T1059 findings" questions. Expressed as a
 * `should` of an exact `term` plus a `prefix` on "<id>." (guardrail-legal shape -- see
 * get-sca-checks.ts:131's `prefix` precedent; `wazuh.rule.mitre.technique.id` is already on
 * guardrails.ts's `AGG_FIELD_ALLOWLIST`, so this needs no guard change). A dotted id is already
 * maximally specific and stays an exact `term`, never broadened --
 * `technique-rollup-coverage.test.ts` pins both halves of this for every present and future tool
 * with a technique-id parameter, not just this one.
 */
function buildMitreTechniqueFilter(
  techniqueId: string,
): Record<string, unknown> {
  // MITRE ids are indexed UPPERCASE and `term`/`prefix` on a keyword field are case-sensitive:
  // a caller's "t1110" would otherwise build a query that matches nothing at all — a silent
  // 0-row lie, strictly worse than the undercount this rollup fixes. Case-normalization is
  // GATED ON THE ID SHAPE, though: an input that is not an ATT&CK id is passed through verbatim
  // rather than upper-cased, so a caller's own string is never rewritten on its way into an error
  // message or a 0-row explanation (same principle as this issue's "preserve user-supplied
  // identifiers verbatim" rule for agent names).
  const isAttackId =
    PARENT_TECHNIQUE_ID_RE.test(techniqueId) ||
    SUB_TECHNIQUE_ID_RE.test(techniqueId);
  const normalized = isAttackId ? techniqueId.toUpperCase() : techniqueId;
  if (!PARENT_TECHNIQUE_ID_RE.test(normalized)) {
    return { term: { 'wazuh.rule.mitre.technique.id': normalized } };
  }
  return {
    bool: {
      minimum_should_match: 1,
      should: [
        { term: { 'wazuh.rule.mitre.technique.id': normalized } },
        { prefix: { 'wazuh.rule.mitre.technique.id': `${normalized}.` } },
      ],
    },
  };
}

/**
 * MITRE ATT&CK-tagged findings. MITRE-tagged findings are detected via an `exists` filter on
 * `wazuh.rule.mitre.technique.id` (a `keyword`-mapped array), with
 * `wazuh.rule.mitre.technique.name` and `wazuh.rule.mitre.tactic.name` as sibling display
 * columns. `technique_id` narrows to one technique AND its sub-techniques via
 * `buildMitreTechniqueFilter` above (a dotted id stays exact); omitted, the tool falls back to
 * the `exists` filter for "any MITRE-tagged finding". A `terms` agg on the same field is always
 * attached so the digest `breakdown` discloses the exact-vs-rolled-up split population-true
 * ("T1059: 3, T1059.001: 9") rather than leaving the model to infer it from `samples` alone --
 * the disclosure this rollup exists for is a data field, not a sentence of prose.
 */
export const getMitreFindingsTool: ToolDefinition = {
  spec: {
    name: 'get_mitre_findings',
    description:
      'Searches security findings for findings mapped to MITRE ATT&CK techniques, within a time ' +
      'range, most recent first. Optional technique_id (e.g. "T1110") covers that technique AND ' +
      'its sub-techniques (e.g. "T1059" includes every "T1059.*"); pass a dotted id (e.g. ' +
      '"T1059.001") to narrow to one sub-technique only. Omit technique_id to list any ' +
      'MITRE-tagged finding. The digest breakdown shows counts per exact technique id, so a ' +
      'rolled-up parent id call still shows which sub-technique(s) the matches actually belong to.',
    parameters: objectSchema({
      technique_id: {
        type: 'string',
        description:
          'Optional MITRE technique ID, e.g. "T1110". A bare parent id ("T1059") also matches ' +
          'its sub-techniques ("T1059.001", "T1059.002", ...); pass a dotted id for one ' +
          'sub-technique only.',
      },
      limit: limitProperty(
        'Max number of findings to return (default 20, max 500).',
      ),
      ...timeRangeProperties(),
    }),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    const techniqueId = optionalStringParam(params.technique_id);
    const mitreFilter = techniqueId
      ? buildMitreTechniqueFilter(techniqueId)
      : { exists: { field: 'wazuh.rule.mitre.technique.id' } };
    return {
      target: 'indexer',
      index: 'wazuh-findings-v5*',
      body: {
        query: {
          bool: {
            filter: [mitreFilter, { range: { '@timestamp': { gte, lte } } }],
          },
        },
        sort: [{ '@timestamp': { order: 'desc' } }],
        size: limit,
        // Population-true breakdowns over the FULL matched set — BOTH halves are load-bearing:
        // FINDING_BREAKDOWN_AGGS (issue #8920 item 1 — agent/rule-title distribution, same
        // mechanism as every other finding-hits tool; this tool was missed when that fix first
        // landed) AND technique_ids (issue #8920 item 2 — the per-exact-technique-id split the
        // rollup above broadens the match for, so the model can attribute rolled-up rows to
        // their sub-technique). Three top-level aggs total, inside guardrails'
        // MAX_TOP_LEVEL_AGGS.
        aggs: {
          ...FINDING_BREAKDOWN_AGGS,
          technique_ids: {
            terms: {
              field: 'wazuh.rule.mitre.technique.id',
              size: BREAKDOWN_BUCKET_CAP,
            },
          },
        },
      },
    };
  },
  tableSpec: {
    columns: [
      { field: '@timestamp', label: 'Time' },
      { field: 'wazuh.agent.name', label: 'Agent' },
      { field: 'wazuh.rule.title', label: 'Title' },
      { field: 'wazuh.rule.mitre.technique.id', label: 'Technique ID' },
      { field: 'wazuh.rule.mitre.technique.name', label: 'Technique' },
      { field: 'wazuh.rule.mitre.tactic.name', label: 'Tactic' },
      { field: 'wazuh.rule.level', label: 'Level', severity: true },
    ],
    // Same finding-hits investigation row set as the other finding tools
    // (server/tools/catalog/common.ts). `wazuh.rule.mitre.technique.id` is already a visible column
    // above, so `findingRowFields` filters it back out — no duplicate row key.
    rowFields: findingRowFields([
      '@timestamp',
      'wazuh.agent.name',
      'wazuh.rule.title',
      'wazuh.rule.mitre.technique.id',
      'wazuh.rule.mitre.technique.name',
      'wazuh.rule.mitre.tactic.name',
      'wazuh.rule.level',
    ]),
  },
  digest: {
    // `wazuh.rule.mitre.tactic.name` is included — it is what the
    // official Wazuh MITRE dashboard surfaces by default — alongside the shared finding-hits extras.
    sampleColumns: findingDigestColumns([
      '@timestamp',
      'wazuh.agent.name',
      'wazuh.rule.mitre.technique.id',
      'wazuh.rule.mitre.technique.name',
      'wazuh.rule.mitre.tactic.name',
    ]),
    breakdownDimensions: FINDING_BREAKDOWN_DIMENSIONS,
  },
};
