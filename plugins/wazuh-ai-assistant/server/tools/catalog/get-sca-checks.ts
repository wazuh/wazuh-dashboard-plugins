import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  optionalStringParam,
  requireNonEmptyString,
  validateAgentId,
} from './common';
import { BREAKDOWN_BUCKET_CAP } from '../digest';

/**
 * Wazuh 5.0 rewrite: the 4.14 Manager endpoint
 * `GET /sca/{agent_id}/checks/{policy_id}` was REMOVED in 5.0 (returns 404 on 5.0). Per-check SCA
 * data now lives in the `wazuh-states-sca` Indexer index, one doc per check (mapping
 * verified against a live 5.0 stack). Field renames vs 4.14: id→check.id, title→check.name,
 * result→check.result, reason→check.reason, remediation→check.remediation; the old
 * file/directory/command fields have NO dedicated 5.0 field (per the matrix, likely folded into
 * the `check.rules` strings — carried as a rowField so the row expander still surfaces whatever
 * the rules text contains). `check.description`/`check.rationale` stay out of the digest (long
 * text, same budget decision as 4.14). `check.result` is confirmed live to store CAPITALIZED
 * values (`"Passed"`/`"Failed"`/`"Not applicable"`), unlike the lowercase 4.14 values this tool's
 * `result` parameter still exposes to the model -- `RESULT_VALUE_MAP` translates at the
 * `buildRequest` boundary so the model-facing contract doesn't have to change.
 */
const RESULT_VALUE_MAP: Record<string, string> = {
  passed: 'Passed',
  failed: 'Failed',
  'not applicable': 'Not applicable',
};

/**
 * Enumeration-answer bucket cap for this tool's `matching_checks` aggregation below -- the size
 * that answers "which checks match" (as opposed to `BREAKDOWN_BUCKET_CAP`, sized for the 3-value
 * Passed/Failed/Not-applicable category breakdown; 5 buckets cannot enumerate a ~10-member "which
 * SSH checks failed" answer).
 *
 * DEFINED LOCALLY rather than imported from `digest.ts`: this item (#8935 I2, branch
 * wf2/scoped-enumeration) was implemented against the `fix/8920-ai-assistant-answer-correctness`
 * base, and the architect's design says this branch STACKS on item I1 (`wf2/bucket-budget`),
 * which is expected to add a shared `ANSWER_BUCKET_CAP` export to digest.ts. At implementation
 * time I1 had not landed (verified: `wf2/bucket-budget` was at the same commit as this base, no
 * such export existed anywhere in the plugin) -- reaching into digest.ts is also outside this
 * item's file list regardless. Value (50) matches the architect's own design note for the
 * unscoped-fallback case ("the unscoped variant degrades honestly -- 50 carried + disclosed
 * remainder via I1").
 *
 * WHEN I1 LANDS: delete this local constant and import `ANSWER_BUCKET_CAP` from `../digest`
 * instead, so this tool's enumeration size and I1's request-size/digest-carry budget agree by
 * construction rather than by two numbers happening to match. Flagged for the human integrator's
 * merge/live-proof pass.
 */
const ANSWER_BUCKET_CAP = 50;

/**
 * Builds a `terms.include` Lucene-regexp pattern that matches any `check.name` CONTAINING
 * `subject` (a substring/contains match), case-insensitively -- the aggregation-side enumeration
 * this tool's `search` parameter drives once a fragment is supplied (see `matching_checks` below).
 *
 * Mirrors `entity-resolution.ts`'s `buildNearMissIncludePattern` (case-class expansion) and
 * `get-mitre-findings.ts`'s `escapeTechniqueIdForRegexp`/`buildTechniqueIdsAggInclude` (the same
 * "scope an aggregation via `include` rather than reversing the query-side ban" shape) at once:
 * each letter expands to a `[xX]` class (Lucene `terms.include` regexps are ANCHORED with no
 * case-insensitivity flag, so there is no other way to match both cases), each digit passes
 * through unchanged (no leading-zero normalization needed for a check name), and every other
 * character is backslash-escaped so it matches literally rather than as regexp syntax. Wrapped in
 * `.*...*.` so the match can start/end anywhere in the field value -- the actual "contains" part.
 *
 * COST ARGUMENT (why this is not the leading-wildcard/substring ban this file already records
 * below on the `search` HITS query): a `terms.include` regexp is evaluated only against the
 * CANDIDATE BUCKET TERMS of `check.name` -- a finite benchmark check catalog (hundreds of checks
 * per policy; ~207 for cis_ubuntu22-04), never against the full document/term-dictionary the way
 * an unanchored substring query against a keyword field would. This is the identical cost profile
 * already accepted for the near-miss probe's `include` (executor.ts's agent-name near-miss
 * aggregation) and for `get-mitre-findings.ts`'s `technique_ids` aggregation -- both scope a
 * bounded-cardinality field's aggregation via `include`, neither touches the HITS query. This does
 * NOT reverse this file's recorded ban on a substring HITS query (see the `search` filter comment
 * below): that ban is about the QUERY (an unbounded scan over free text), this is a different
 * mechanism (a bounded scan over a finite aggregation candidate set) with a different cost.
 */
function buildContainsIncludePattern(subject: string): string {
  const parts: string[] = [];
  for (const char of subject) {
    if (/[a-zA-Z]/.test(char)) {
      parts.push(`[${char.toLowerCase()}${char.toUpperCase()}]`);
    } else if (/[0-9]/.test(char)) {
      parts.push(char);
    } else {
      parts.push(`\\${char}`);
    }
  }
  return `.*${parts.join('')}.*`;
}
export const getScaChecksTool: ToolDefinition = {
  spec: {
    name: 'get_sca_checks',
    description:
      'Lists the individual checks within one Security Configuration Assessment (SCA) policy for ' +
      'one agent — check name, pass/fail result, reason, and (via the row expander) the ' +
      'remediation and rule text for each check. Use for "which SCA checks failed"/"why did this ' +
      'policy fail" drill-down questions AFTER get_sca_results has given you a policy_id for the ' +
      'agent — this tool needs that policy_id, it cannot discover one itself. Use ' +
      'result="failed" for "which checks fail" questions. For a TOPIC question ("which SSH ' +
      'checks failed"), pass a topic fragment via search (e.g. "ssh") together with ' +
      'result="failed": the digest breakdown\'s "matching_checks" entries name every matching ' +
      'check over the full result set, not just the returned rows.',
    parameters: objectSchema(
      {
        agent_id: {
          type: 'string',
          description: 'Numeric Wazuh agent ID, e.g. "003".',
        },
        policy_id: {
          type: 'string',
          description:
            'SCA policy id to drill into, obtained from a prior get_sca_results call for this ' +
            'agent (the summary table’s "Policy ID" column).',
        },
        result: {
          type: 'string',
          description:
            'Filter by check result. Exact values only: "failed", "passed", or "not applicable".',
          enum: ['failed', 'passed', 'not applicable'],
        },
        search: {
          type: 'string',
          description:
            'Exact check name, a LEADING prefix of one (e.g. "Ensure SSH"), or a topic fragment ' +
            '(e.g. "ssh"). check.name is an exact keyword field, so a fragment does NOT narrow ' +
            'which ROWS come back — but it DOES scope the digest breakdown\'s "matching_checks" ' +
            'enumeration to check names containing it (case-insensitive). For a topic question, ' +
            'pass the fragment here together with result="failed" and read "matching_checks" for ' +
            'the full list of matching check names.',
        },
        limit: limitProperty(
          'Max number of checks to return (default 20, max 500).',
        ),
      },
      ['agent_id', 'policy_id'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const agentId = validateAgentId(params.agent_id);
    const policyId = requireNonEmptyString(
      params.policy_id,
      'Parameter "policy_id" is required and must be a non-empty string.',
    );
    const limit = clampLimit(params.limit, 20, 500);
    const result = optionalStringParam(params.result);
    const search = optionalStringParam(params.search);
    // `search` is EXACT-or-PREFIX, never substring, for the HITS query. `check.name`/
    // `check.description`/`check.rationale` are all mapped `keyword` in 5.0, so a bare
    // `multi_match` silently returned nothing for the fragment its own description once invited:
    // proven live, `search: "ssh"` -> 0 hits, while the full exact check name -> 1 hit, against
    // real check names like "Ensure SSH root login is disabled".
    //
    // The multi_match is kept (it is correct for a full exact value) and OR'd with a non-leading
    // `prefix` on `check.name`, so "Ensure SSH" also works. A true substring search is
    // deliberately NOT attempted on the HITS query: on a keyword field it needs a leading
    // wildcard, which this plugin's guardrails reject on purpose (unbounded term-dictionary
    // scan). The real long-term fix for the HITS side is an analyzed sub-field on these three
    // fields in the SCA index template, which is a platform-side change, not a plugin one.
    const searchShould = search
      ? {
          bool: {
            minimum_should_match: 1,
            should: [
              {
                multi_match: {
                  query: search,
                  fields: [
                    'check.name',
                    'check.description',
                    'check.rationale',
                  ],
                },
              },
              { prefix: { 'check.name': search.trim() } },
            ],
          },
        }
      : undefined;
    // #8935 item I2: attached whenever `result` OR `search` is supplied -- the two drill-down
    // shapes behind "which checks failed"/"which SSH checks failed". A bare listing call (neither
    // supplied) attaches no `matching_checks` agg at all, so its request body stays byte-identical
    // to before this item. Scoped to `search`'s fragment via `buildContainsIncludePattern` when a
    // fragment was supplied; unscoped (still capped at ANSWER_BUCKET_CAP) when only `result` was
    // supplied, which is what closes the enumeration half of the HONEST SCOPE NOTE below.
    const matchingChecksAgg =
      result || search
        ? {
            matching_checks: {
              terms: {
                field: 'check.name',
                size: ANSWER_BUCKET_CAP,
                ...(search
                  ? { include: buildContainsIncludePattern(search.trim()) }
                  : {}),
              },
            },
          }
        : undefined;
    return {
      target: 'indexer',
      index: 'wazuh-states-sca*',
      body: {
        query: {
          bool: {
            filter: [
              { term: { 'wazuh.agent.id': agentId } },
              { term: { 'policy.id': policyId.trim() } },
              ...(result
                ? [
                    {
                      term: {
                        'check.result': RESULT_VALUE_MAP[result] ?? result,
                      },
                    },
                  ]
                : []),
            ],
          },
        },
        // `search`'s should-clause moved from `query.bool.filter` to `post_filter` (#8935 item
        // I2). `post_filter` runs AFTER aggregations, filtering HITS (and hits.total) only -- so
        // exact-name/prefix HITS behavior for a `search` caller is completely unchanged, while
        // `results` and `matching_checks` below are computed over the full agent+policy+result
        // matched set, unaffected by a fragment. Before this move, `search: "ssh"` (0 hits on a
        // keyword field) put the search clause in `query.bool.filter`, so EVERY aggregation was
        // also computed over that same empty set -- a topic fragment degenerated every
        // aggregation to zero, not just the hits list. `hits.total` honoring `post_filter` (so a
        // fragment still narrows the reported `counts.total`, just not the aggregations) is
        // documented OpenSearch behavior, not a guess -- flagged here for the live-proof pass.
        ...(searchShould ? { post_filter: searchShould } : {}),
        _source: [
          'check.id',
          'check.name',
          'check.result',
          'check.reason',
          'check.remediation',
          'check.rules',
        ],
        sort: ['_doc'],
        size: limit,
        // Population-true Passed/Failed/Not-applicable distribution over the FULL matched set
        // (issue #8920 item 1: "named 2 of 10 failed checks" -- this tool only ever ran a plain
        // hits search, so a `limit`-truncated page gave the model no view of results outside it).
        // OpenSearch computes `aggregations` over every matched doc regardless of `size`, so this
        // stays correct even when `limit` truncates the returned rows. `check.result` is on
        // guardrails.ts's AGG_FIELD_ALLOWLIST as a closed 3-value enum; digest.ts's `buildBreakdown`
        // already reads any response's `aggregations` generically, so this needs no digest change.
        //
        // HONEST SCOPE NOTE: when the caller ALREADY filters by `result` (the natural call behind
        // "which SSH checks failed"), `results` above is a single bucket equal to counts.total —
        // it adds category-count truth for UNFILTERED calls, but on its own it does NOT close the
        // enumeration half of the reported instance ("named 2 of 10 failed checks" with the count
        // already present). #8935 item I2 closes that half: `matching_checks` below enumerates the
        // actual check NAMES over the same full matched set, so a `result="failed"` (optionally
        // `search`-scoped) call now gets both the count (from `results`) and the names (from
        // `matching_checks`) population-true, inside ANSWER_BUCKET_CAP/MAX_AGG_SIZE. Two top-level
        // aggs total when both apply, inside guardrails' MAX_TOP_LEVEL_AGGS (5).
        aggs: {
          results: {
            terms: { field: 'check.result', size: BREAKDOWN_BUCKET_CAP },
          },
          ...(matchingChecksAgg ? matchingChecksAgg : {}),
        },
      },
    };
  },
  tableSpec: {
    columns: [
      { field: 'check.id', label: 'Check ID' },
      { field: 'check.name', label: 'Check' },
      // `check.result` is a pass/fail/not-applicable WORD, not a finding-severity level — plain
      // column, not `severity: true` (same rationale as the 4.14 version of this tool).
      { field: 'check.result', label: 'Result' },
      { field: 'check.reason', label: 'Reason' },
    ],
    // Row expander: remediation + the raw rule text (where 5.0 folds the old
    // file/directory/command detail, per the matrix — the investigative payload of this tool).
    rowFields: ['check.remediation', 'check.rules'],
  },
  // description/rationale excluded on purpose: hundreds of words each (same budget decision as
  // 4.14). remediation/rules are row-only for the same reason.
  digest: { sampleColumns: ['check.id', 'check.name', 'check.result'] },
};
