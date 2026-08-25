import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  optionalStringParam,
  requireNonEmptyString,
  SCA_CURRENT_STATE_NOTE,
  validateAgentId,
} from './common';
import { ANSWER_BUCKET_CAP, BREAKDOWN_BUCKET_CAP } from '../digest';
import { resolveScaCheckParams } from '../param-resolution';

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

/**
 * Upper bound on the normalized `search` subject. `optionalStringParam` does not bound length,
 * and every character of the subject becomes 1-4 characters of the `terms.include` regexp above —
 * a model-supplied 5k-char fragment would otherwise become an unbounded cluster-side regexp
 * (integration review of #8935 item I2). 200 chars comfortably covers the longest real 5.0 check
 * name observed (~110 chars) plus headroom; anything longer cannot be a check-name fragment.
 */
const MAX_SEARCH_SUBJECT_LENGTH = 200;

/**
 * IN-BAND scope attribution for the enumeration aggregation (#8935 item I2, integration review):
 * every entry of a multi-aggregation digest breakdown is tagged with its aggregation NAME
 * (digest.ts's `buildBreakdown`), so the name itself is the one deterministic, code-level channel
 * that tells the model what the enumerated check names ARE. A `result`-filtered call scopes the
 * whole query — and therefore this aggregation — to that result, so the name says so
 * (`matching_failed_checks`); a fragment-only call enumerates across ALL results, and the name
 * says that too (`matching_checks_all_results`), so a "which SSH checks FAILED" answer cannot
 * silently present passed checks as failures. Relying on the model to also pass `result` was the
 * prompt layer — measured 0/3 — which is why the attribution rides in the data instead.
 */
function matchingChecksAggName(result: string | undefined): string {
  return result
    ? `matching_${result.replace(/\s+/g, '_')}_checks`
    : 'matching_checks_all_results';
}
const getScaChecksToolBase: ToolDefinition = {
  spec: {
    name: 'get_sca_checks',
    description:
      'Lists the individual checks within one Security Configuration Assessment (SCA) policy for ' +
      'one agent — check name, pass/fail result, reason, and (via the row expander) the ' +
      'remediation and rule text for each check. Use for "which SCA checks failed"/"why did this ' +
      'policy fail" drill-down questions. Both agent_id and policy_id may be omitted: agent_id ' +
      'resolves to the only active agent, and policy_id resolves to the only SCA policy for that ' +
      'agent, each automatically when unambiguous -- pass an explicit policy_id (e.g. from a ' +
      'prior get_sca_results call) when the agent has more than one policy. For "how do I ' +
      'remediate check ID X" questions where a specific numeric check id is already known, pass ' +
      "check_id instead: it resolves agent_id/policy_id directly from that check's own document, " +
      'without needing to know or disambiguate the agent first. Use result="failed" for "which ' +
      'checks fail" questions. For a TOPIC question ("which SSH checks failed"), pass a topic ' +
      'fragment via search (e.g. "ssh") together with result="failed": the digest breakdown\'s ' +
      '"matching_failed_checks" entries name the matching checks over the full result set ' +
      '(alphabetical; if more match than the list carries, the digest says how many were cut — ' +
      `narrow the fragment to see them all). ${SCA_CURRENT_STATE_NOTE}`,
    parameters: objectSchema(
      {
        agent_id: {
          type: 'string',
          description:
            'Numeric Wazuh agent ID, e.g. "003". Optional: omit this for a deictic host ' +
            'reference ("this box"/"this server") with no known id -- the call resolves to the ' +
            'only active agent automatically, or (when check_id is given instead) from that ' +
            "check's own document. If the user named a host (e.g. \"lin-web-01\"), resolve that " +
            'name to its numeric id first and pass it here: omitting this parameter does NOT ' +
            'search across agents, it resolves to a single agent, so an unscoped call answers ' +
            'about the wrong host.',
        },
        policy_id: {
          type: 'string',
          description:
            'SCA policy id to drill into, obtained from a prior get_sca_results call for this ' +
            'agent (the summary table’s "Policy ID" column). Optional: omit this when the agent ' +
            'has exactly one SCA policy -- it resolves automatically. If the agent has more than ' +
            'one policy, this is required (the candidates are reported so you can ask which one).',
        },
        check_id: {
          type: 'string',
          description:
            'Exact numeric check.id to look up (e.g. "28500"), when the user already names a ' +
            'specific check id (typically a remediation/drill-down question about that one ' +
            'check). When supplied, agent_id and policy_id resolve automatically from that ' +
            'check\'s own document -- this is the preferred way to answer "how do I remediate ' +
            'failed check ID X" without first asking which agent, since the check id alone ' +
            'already identifies which agent/policy it belongs to.',
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
            '(e.g. "ssh"). The returned ROWS and their total include only exact/leading-prefix ' +
            'matches (check.name is an exact keyword field, so a mid-word fragment usually ' +
            "matches 0 rows — that is expected, not an error). The fragment's real effect is on " +
            'the digest breakdown: it scopes the "matching_*" enumeration to check names ' +
            'CONTAINING it (case-insensitive), computed over the full result set. For a topic ' +
            'question, pass the fragment here together with result="failed" and answer from ' +
            'that enumeration.',
        },
        limit: limitProperty(
          'Max number of checks to return (default 20, max 500).',
        ),
      },
      [],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  // Issue: generic sole-candidate parameter resolution (template: #8913's
  // resolveDeicticAgentParams in get-agent-inventory.ts). Both `agent_id` and `policy_id` measured
  // as blockers on deictic/topic-only SCA questions when strictly required. Order matters:
  // `agent_id` resolves first (unscoped, against the Manager API), then `policy_id` resolves
  // against the Indexer's `policy.id` values scoped to whichever `agent_id` is now in `params` --
  // either the caller's own or the one just resolved.
  soleCandidateParams: [
    { param: 'agent_id', source: { kind: 'manager-agents' } },
    {
      param: 'policy_id',
      source: {
        kind: 'indexer-terms',
        index: 'wazuh-states-sca*',
        field: 'policy.id',
        scopedBy: { param: 'agent_id', field: 'wazuh.agent.id' },
      },
    },
  ],
  buildRequest(params) {
    const agentId = validateAgentId(params.agent_id);
    const policyId = requireNonEmptyString(
      params.policy_id,
      'Parameter "policy_id" is required and must be a non-empty string.',
    );
    const limit = clampLimit(params.limit, 20, 500);
    const result = optionalStringParam(params.result);
    const search = optionalStringParam(params.search);
    // Normalized subject (#8935 item I2, integration review): trimmed, treated as ABSENT when
    // whitespace-only (a '   ' subject otherwise became include '.*\ \ \ .*' — matches nothing —
    // plus a prefix on the empty string), and length-capped so the per-character include
    // expansion below stays bounded cluster-side.
    const trimmedSearch = search?.trim().slice(0, MAX_SEARCH_SUBJECT_LENGTH);
    const subject =
      trimmedSearch && trimmedSearch.length > 0 ? trimmedSearch : undefined;
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
    const searchShould = subject
      ? {
          bool: {
            minimum_should_match: 1,
            should: [
              {
                multi_match: {
                  query: subject,
                  fields: [
                    'check.name',
                    'check.description',
                    'check.rationale',
                  ],
                },
              },
              { prefix: { 'check.name': subject } },
            ],
          },
        }
      : undefined;
    // #8935 item I2: attached whenever `result` OR `search` is supplied -- the two drill-down
    // shapes behind "which checks failed"/"which SSH checks failed". A bare listing call (neither
    // supplied) attaches no enumeration agg at all, so its request body stays byte-identical to
    // before this item. Scoped to `search`'s fragment via `buildContainsIncludePattern` when a
    // fragment was supplied; unscoped (still capped at ANSWER_BUCKET_CAP) when only `result` was
    // supplied, which is what closes the enumeration half of the HONEST SCOPE NOTE below. The agg
    // NAME carries the result scope in-band — see matchingChecksAggName.
    const matchingChecksAgg =
      result || subject
        ? {
            [matchingChecksAggName(result)]: {
              terms: {
                field: 'check.name',
                size: ANSWER_BUCKET_CAP,
                // Alphabetical, EXPLICITLY (#8935 item I2, integration review): wazuh-states-sca
                // holds one document per check per agent+policy, so every bucket's doc_count is 1
                // and the default count ordering degenerates to its _key tie-break anyway —
                // making the order explicit makes the cut DETERMINISTIC and honestly describable
                // when more checks match than `size` can carry (the digest's trim/remainder note
                // describes a first-N-in-response-order cut; "the alphabetically first N" is that,
                // stated plainly, instead of an arbitrary cut a model could read as a top-N).
                order: { _key: 'asc' },
                ...(subject
                  ? { include: buildContainsIncludePattern(subject) }
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
        // the enumeration agg below is computed over the full agent+policy+result matched set,
        // unaffected by a fragment. Before this move, `search: "ssh"` (0 hits on a keyword field)
        // put the search clause in `query.bool.filter`, so EVERY aggregation was also computed
        // over that same empty set -- a topic fragment degenerated every aggregation to zero, not
        // just the hits list. `hits.total` honoring `post_filter` (so a fragment still narrows
        // the reported `counts.total`, just not the aggregations) is documented OpenSearch
        // behavior, not a guess -- flagged here for the live-proof pass. The digest side is
        // post_filter-AWARE: buildZeroRowHint (digest.ts) sees `post_filter` on the request body
        // and tells the model the 0 rows are a post-filter artifact with the aggregations still
        // population-true, instead of blaming the query filters (integration review: a fragment
        // call otherwise reported "0 rows. Filters applied: wazuh.agent.id, policy.id,
        // check.result" right beside a breakdown proving all three matched).
        ...(searchShould ? { post_filter: searchShould } : {}),
        _source: [
          'check.id',
          'check.name',
          'check.result',
          'check.reason',
          'check.rationale',
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
        // "which SSH checks failed"), `results` is a single bucket equal to counts.total — it
        // adds category-count truth for UNFILTERED calls, but on its own it does NOT close the
        // enumeration half of the reported instance ("named 2 of 10 failed checks" with the count
        // already present). #8935 item I2 closes that half: the matching_* agg below enumerates
        // the actual check NAMES over the same full matched set, so a `result="failed"`
        // (optionally `search`-scoped) call now gets both the count (from `results`) and the
        // names population-true, inside ANSWER_BUCKET_CAP/MAX_AGG_SIZE and guardrails'
        // MAX_TOP_LEVEL_AGGS (5).
        //
        // `results` is DROPPED whenever a `search` subject is supplied (#8935 item I2,
        // integration review): with the search clause in `post_filter`, `results` would count the
        // WHOLE agent+policy(+result) scope while the question is about the subject — an
        // exact-name call would show "Failed: 102" beside its one matching check, and a fragment
        // call would place a policy-wide distribution beside a subject-scoped name list with
        // nothing in the payload distinguishing the two scopes. For a subject question the
        // matching_* enumeration IS the answer; the policy-wide distribution belongs to the
        // subject-less call shapes, where the query scope and the agg scope coincide.
        aggs: {
          ...(subject
            ? {}
            : {
                results: {
                  terms: { field: 'check.result', size: BREAKDOWN_BUCKET_CAP },
                },
              }),
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
      // 'check.rationale', not 'check.reason': the reason field exists in the wazuh-states-sca
      // mapping but is EMPTY in every live document (verified 2026-08-14) -- the populated
      // explanation text lives in check.rationale, so a Reason column keyed on check.reason
      // rendered an em-dash on every row that ever had this table.
      { field: 'check.rationale', label: 'Reason' },
    ],
    // Row expander: rationale/remediation + the raw rule text (where 5.0 folds the old
    // file/directory/command detail, per the matrix — the investigative payload of this tool).
    rowFields: ['check.rationale', 'check.remediation', 'check.rules'],
  },
  // Workstream D (SCA interpretation, coverage doc CV-054): `check.rationale` (WHY the check
  // exists/what it protects against) and `check.remediation` (WHAT to do about a failure) now
  // ride in the digest sample rows too, not just the row expander -- the model cannot lead an
  // interpreted answer with "why this matters" / "what to do" (prompts.ts's SCA synthesis
  // guidance) from a sample that never carried either field. `check.description` stays excluded
  // (same hundreds-of-words budget concern that originally excluded rationale/remediation too) --
  // it is the benchmark's own restatement of the check's title, not additional interpretive
  // content the synthesis guidance needs.
  //
  // Both fields are free CIS/benchmark prose that routinely runs long -- live data (a
  // `wazuh-states-sca` document pulled from `wazuh-aio-5`) has `check.rationale` at 604 chars and
  // `check.remediation` at 597, both already past `digest.ts`'s generic `MAX_FIELD_VALUE_LENGTH`
  // (500). Relying on that generic cap alone means every long rationale/remediation is capped
  // AT EXACTLY 500 chars -- the cap becomes the typical size, not a rare backstop -- which pushes
  // a 5-sample-row digest to ~5,890 chars, within `capDigest`'s pop-a-sample-row range of
  // `DIGEST_CHAR_CAP` (6,000) and, cumulated over `CONTEXT_CHAR_BUDGET`'s calibration sweep (5
  // single-agent digests), past it a round early (see chat.ts's `CONTEXT_CHAR_BUDGET` comment).
  // `sampleFieldMaxLength` below caps these two fields tighter (200 / 240) than
  // `MAX_FIELD_VALUE_LENGTH` WITHOUT lowering that shared default for every other tool -- 200
  // chars is enough for the rationale's first sentence (verified against the live document above:
  // the "why it matters" sentence is 186 chars), and the synthesis guidance only ever asks for a
  // paraphrase, not the full CIS text. Post-cap this digest runs ~616 chars/row, ~3,080 chars of
  // samples, ~3,400 total -- comfortably under `DIGEST_CHAR_CAP` with all 5 sample rows intact,
  // and the calibration sweep (5 x ~3,400) stays under `CONTEXT_CHAR_BUDGET` with headroom.
  digest: {
    sampleColumns: [
      'check.id',
      'check.name',
      'check.result',
      'check.rationale',
      'check.remediation',
    ],
    sampleFieldMaxLength: {
      'check.rationale': 200,
      'check.remediation': 240,
    },
  },
};

// BLOCKER FIX (CV-053/CV-052/CV-088 turn 3): a hand-written `resolveParams`, wrapping
// `resolveScaCheckParams` (param-resolution.ts), REPLACES the plain declarative
// `soleCandidateParams`-only resolution `registry.ts` would otherwise attach. `soleCandidateParams`
// above is still read (via `buildGenericResolveParams` inside `resolveScaCheckParams`) as the
// fallback path for every call that supplies no `check_id` -- unchanged behavior for those calls.
// Assigned after construction (rather than inline) because the hook needs a reference to this same
// tool definition (to reach its `soleCandidateParams`), which an object literal cannot supply to
// itself.
getScaChecksToolBase.resolveParams =
  resolveScaCheckParams(getScaChecksToolBase);

export const getScaChecksTool: ToolDefinition = getScaChecksToolBase;
