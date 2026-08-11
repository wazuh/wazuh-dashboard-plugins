import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../../src/core/server';
import { ResolveParamsResult, ToolDefinition } from '../types';
import {
  fetchActiveManagerAgents,
  ManagerAgentSummary,
} from '../param-resolution';
import {
  clampLimit,
  INVENTORY_CURRENT_STATE_NOTE,
  limitProperty,
  objectSchema,
  optionalStringParam,
  validateAgentId,
} from './common';
import { BREAKDOWN_BUCKET_CAP } from '../digest';

/**
 * The 5 kinds this tool implements tonight, out of the 13 real `wazuh-states-inventory-*`
 * surfaces (`plugins/main/common/constants.ts`'s `WAZUH_IT_HYGIENE_*`). Enum kept to exactly
 * these 5 rather than listing all 13 with the other 8 rejected at call time: a listed-but-
 * rejected enum value is a worse model experience than simply not offering it (the model wastes a
 * call/round-trip discovering the rejection instead of never considering it), and the smaller enum
 * is itself a few fewer schema tokens on every routed turn -- the same token-conscious reasoning
 * this whole tool exists for. The other 8 (hardware, interfaces, networks, protocols, users,
 * groups, services, browser-extensions) each need their own live-mapping verification pass before
 * they can be added the same way `hotfixes` was tonight -- see this file's own doc comment on
 * `INVENTORY_KIND_CONFIG` for what "verified" means in practice.
 */
export const INVENTORY_KINDS = [
  'os',
  'packages',
  'ports',
  'processes',
  'hotfixes',
] as const;
type InventoryKind = (typeof INVENTORY_KINDS)[number];

export interface InventoryKindConfig {
  /** The concrete `wazuh-states-inventory-*` index this kind reads. `os` is the one naming
   * exception carried over from get-agent-os.ts: it reads the `system` sub-index, not a literal
   * `os` one. */
  index: string;
  /** Outbound `_source` field list -- for `os`/`packages`/`ports`/`processes`, copied
   * byte-for-byte (contents AND order) from get-agent-os.ts/get-agent-packages.ts/
   * get-agent-ports.ts/get-agent-processes.ts, now folded into this one tool and deleted as
   * standalone files. Part of the outbound Indexer request contract for those four; see
   * get-agent-inventory.test.ts's regression assertions for the exact byte-for-byte match. */
  source: string[];
  /** `[defaultLimit, maxLimit]` for `clampLimit`, applied to the caller's `limit` param. Every
   * kind except `os` uses this (all four originally had their own `limitProperty`/`clampLimit`
   * call with these exact bounds). */
  limitRange?: [number, number];
  /** Fixed query `size`, bypassing the `limit` param entirely -- only `os` uses this, matching
   * get-agent-os.ts's original hardcoded `size: 5` (one agent has at most one current OS record;
   * the original tool never exposed a `limit` parameter at all). */
  fixedSize?: number;
  /**
   * Real `terms` aggregation(s) attached to `body.aggs` for a kind whose completeness question
   * ("how many ports are listening vs closed") needs a population-true categorical breakdown
   * (issue #8920 item 1: a plain hits search left a `limit`-truncated page silently narrated as
   * if it were the whole inventory). OpenSearch computes `aggregations` over the FULL matched set
   * regardless of `size`, so this stays correct even when `limit` truncates the returned rows;
   * digest.ts's `buildBreakdown` already reads any response's `aggregations` generically, so this
   * needs no digest change.
   *
   * A real aggregation requires an AGG_FIELD_ALLOWLIST entry AND live keyword-mapping evidence
   * for its field (a `terms` agg on a text-mapped field is a hard 400, turning a fidelity gap
   * into a broken tool for that kind — worse than the disclosure gap it fixes). Only `ports`
   * meets that bar today: this repo's own IT Hygiene dashboards already run terms aggregations
   * on `interface.state` (plugins/main/.../it-hygiene/dashboards/dashboard-panels.ts) and
   * aggregate `network.transport` in the services/traffic panels, which is live proof both are
   * aggregatable keywords. Kinds WITHOUT that evidence take the digest-level
   * `breakdownDimensions` fallback instead (see `digest` below): it groups the RETURNED rows via
   * getByPath, so it needs no mapping guarantee and can never hard-fail — page-scoped (with
   * `breakdownNote`) when the result is limit-truncated, exact otherwise. `processes` uses that
   * fallback for `process.state` (only a KQL filter exists in-repo, not an aggregation — no
   * keyword-mapping proof; promote to a real agg here once a live `terms` agg on
   * wazuh-states-inventory-processes is verified) and `packages` for
   * `package.architecture`/`package.vendor`. `os` (fixedSize: 5 — effectively the whole
   * population) and `hotfixes` (single free-text name field, no categorical dimension) carry
   * neither; the per-kind coverage test in get-agent-inventory.test.ts enumerates every kind
   * against exactly this map, so a 6th kind cannot ship without a breakdown or a written reason.
   */
  breakdownAggs?: Record<string, unknown>;
}

/**
 * `hotfixes` is the one kind added beyond the 4 folded-in ones (issue 12, step 2's first
 * addition): it pairs with the vulnerability tools for patch-management questions and was
 * previously invisible to the assistant entirely (zero prior mentions of "hotfix" in this
 * plugin). Its `_source` list is deliberately just the one field this repo can actually confirm
 * live for `wazuh-states-inventory-hotfixes*`: `package.hotfix.name`, per `plugins/main`'s own
 * IT Hygiene hotfixes table (`public/components/overview/it-hygiene/packages/inventories/
 * hotfixes/table-columns.ts`) and sample-data generator (`server/lib/sample-data/dataset/
 * states-inventory-hotfixes/main.js`), both checked into this repo and already queried live by
 * that dashboard. No index template/mapping JSON for this index is checked in anywhere in this
 * repo (unlike `wazuh-states-vulnerabilities`'s, which get-vulnerability-by-cve.ts cites
 * directly) -- so rather than guess at plausible sibling fields (an install date, a KB URL) with
 * no checked-in evidence either way, this stays to the one field actually confirmed. The other 8
 * uncovered kinds each need this same standard of evidence before being added.
 */
// Exported for get-agent-inventory.test.ts's per-kind coverage loop only — a 6th kind added to
// this map is automatically held to "breakdownAggs, breakdownDimensions coverage, or a written
// reason" by that test, without the test hardcoding kind names.
export const INVENTORY_KIND_CONFIG: Record<InventoryKind, InventoryKindConfig> =
  {
    os: {
      index: 'wazuh-states-inventory-system*',
      source: [
        'host.hostname',
        'host.os.name',
        'host.os.version',
        'host.os.platform',
        'host.os.full',
        'host.architecture',
      ],
      fixedSize: 5,
    },
    packages: {
      index: 'wazuh-states-inventory-packages*',
      source: [
        'package.name',
        'package.version',
        'package.architecture',
        'package.vendor',
      ],
      limitRange: [50, 500],
    },
    ports: {
      index: 'wazuh-states-inventory-ports*',
      // Order (issue #8921's column-budget item): `deriveResultColumns` (digest.ts) takes this
      // `_source` list, byte-for-byte, as the derived column order -- and the client's
      // MAX_VISIBLE_COLUMNS budget (result-table.tsx) shows only the first 6 of them as visible
      // table columns. The issue's 5 highest-value fields lead (source.port, interface.state,
      // process.name, network.transport, destination.ip), followed by source.ip as the 6th visible
      // column; destination.port/process.pid are demoted -- NOT deleted, still queried and still in
      // the row expander -- to positions 7-8. destination.ip stays ahead of them: on an established
      // connection it carries the peer address, which is more often what a reader wants than the
      // local source.ip/the numeric process.pid.
      source: [
        'source.port',
        'interface.state',
        'process.name',
        'network.transport',
        'destination.ip',
        'source.ip',
        'destination.port',
        'process.pid',
      ],
      limitRange: [50, 500],
      breakdownAggs: {
        interface_state: {
          terms: { field: 'interface.state', size: BREAKDOWN_BUCKET_CAP },
        },
        network_transport: {
          terms: { field: 'network.transport', size: BREAKDOWN_BUCKET_CAP },
        },
      },
    },
    processes: {
      index: 'wazuh-states-inventory-processes*',
      source: [
        'process.pid',
        'process.name',
        'process.state',
        'process.parent.pid',
        'process.command_line',
      ],
      limitRange: [50, 500],
      // No breakdownAggs: process.state has no in-repo keyword-mapping evidence (see the
      // InventoryKindConfig doc comment) — covered by the digest-level breakdownDimensions
      // fallback instead.
    },
    hotfixes: {
      index: 'wazuh-states-inventory-hotfixes*',
      source: ['package.hotfix.name'],
      limitRange: [50, 500],
    },
  };

/** Validates `kind` against the 5 implemented values; throws a descriptive Error (turned into a
 * bounded tool_result error for the model to self-correct, same convention as every other
 * catalog `buildRequest` in this directory) for anything else -- including one of the other 8
 * real-but-unimplemented `wazuh-states-inventory-*` surfaces, which this tool's enum never offers
 * in the first place (see this file's header doc comment for why that is the better model
 * experience than listing-then-rejecting). */
function parseKind(value: unknown): InventoryKind {
  if (
    typeof value === 'string' &&
    (INVENTORY_KINDS as readonly string[]).includes(value)
  ) {
    return value as InventoryKind;
  }
  throw new Error(
    `Parameter "kind" must be one of: ${INVENTORY_KINDS.join(
      ', ',
    )}; got ${JSON.stringify(value)}.`,
  );
}

/** Shared by `resolveAgentFilter`'s own throw (a direct `buildRequest` call with neither
 * identifier, e.g. from a unit test) and `resolveDeicticAgentParams`'s failure paths below (issue
 * #8913) so the two can never drift into different wording for the same underlying situation.
 *
 * Deliberately does NOT name `get_agents` (follow-up audit fix, same class of bug this whole
 * file exists to fix): `resolveDeicticAgentParams`'s zero-active-agents and lookup-failure
 * branches return exactly this text as a LIVE tool_result error, at a point where get_agent_inventory
 * has already been called -- which only happens when stage-1 routing offered the 'inventory'
 * category. Nothing guarantees 'agents' (the category get_agents lives in) was ALSO routed that
 * turn, so telling the model to "call get_agents" here can name a tool it does not have, same
 * failure mode as the tool description/system prompt text this file was reworded to fix. Asking
 * the user is always a safe next step regardless of which tools this turn happens to have. */
const NO_AGENT_IDENTIFIER_ERROR =
  'Either "agent_id" (numeric Wazuh agent ID, e.g. "003") or "agent_name" (the agent\'s name) ' +
  'is required and could not be resolved automatically. Ask the user which agent/host they mean.';

/**
 * Per-kind primary name field the optional `filter` param (issue #8910) narrows on, keyed the same
 * as `INVENTORY_KIND_CONFIG`. Picked from that config's own `source` lists -- never a field invented
 * for this feature -- so every entry here is already a confirmed part of this tool's outbound
 * `_source`/query contract:
 * - `packages` -> `package.name` (the field the failing live question, "is openssl installed on
 *   agent X", is actually asking about).
 * - `hotfixes` -> `package.hotfix.name`, the one confirmed field for that kind (see
 *   `INVENTORY_KIND_CONFIG`'s own doc comment above).
 * - `processes` -> `process.name`; `process.command_line` is matched too (see
 *   `buildInventoryFilterClause` below) since "which process" questions are answered as often by a
 *   command-line fragment as by the bare process name.
 * - `os` matches `host.hostname` OR `host.os.name` -- the two fields that actually identify an OS
 *   record by name -- even though `kind="os"` already returns at most 5 rows (`fixedSize`): leaving
 *   `filter` silently ignored for exactly one of the five kinds would be a worse (surprising)
 *   contract than a uniform, if lower-value, one.
 * - `ports` has no single name field (see `buildInventoryFilterClause`'s own handling): a numeric
 *   filter matches `source.port`/`destination.port`AND prefers a listening `interface.state`
 *   (issue #8914 -- see `PORT_LISTENING_STATE_VALUES`'s doc comment below), a non-numeric one
 *   matches `process.name` (the process bound to the port), matching the issue's own worked
 *   example ("what process is on port 9200").
 */
const INVENTORY_FILTER_FIELDS: Partial<Record<InventoryKind, string[]>> = {
  os: ['host.hostname', 'host.os.name'],
  packages: ['package.name'],
  processes: ['process.name', 'process.command_line'],
  hotfixes: ['package.hotfix.name'],
};

/** Digits only, matching a Wazuh/syscollector port number (`source.port`/`destination.port` are
 * plain non-negative integers, never signed/floating) -- `parseInt` alone would accept "9200abc" as
 * 9200, which is not what a caller who typed that meant. */
const INTEGER_FILTER_RE = /^\d+$/;

/**
 * A caller-supplied `filter` is meant as a plain substring, not Lucene syntax -- stripping `*`/`?`
 * before this tool ever builds its own trailing wildcard keeps the outbound value guardrail-safe by
 * construction (guardrails.ts's `lintDsl` runs on every catalog tool's request with no per-tool
 * exemption, and rejects a "wildcard" clause whose value has a LEADING `*`/`?` -- a caller who typed
 * `filter: "*ssl"` would otherwise turn this tool's own `${value}*` into `"*ssl*"` and get a
 * confusing guardrail rejection instead of the match they asked for).
 */
function sanitizeFilterValue(value: string): string {
  return value.replace(/[*?]/g, '').trim();
}

/** Case-insensitive PREFIX match on a keyword field: `wildcard` with only a TRAILING `*` (never a
 * leading one -- see `sanitizeFilterValue`'s doc comment) and `case_insensitive: true`, the shape
 * this repo's `wazuh-states-*` fields are queried with elsewhere once analyzed matching isn't wanted
 * (see e.g. `common.ts`'s `findingArtifactFilterClauses`, which uses `term`/exact match for the same
 * reason: case_insensitive here trades exactness for a prefix substring UX, which the presence
 * questions this feature exists for need -- "is openssl installed" should still match if the actual
 * package name has different casing).
 */
function caseInsensitivePrefixClause(
  field: string,
  value: string,
): Record<string, unknown> {
  return {
    wildcard: { [field]: { value: `${value}*`, case_insensitive: true } },
  };
}

/** `bool.should`/`minimum_should_match: 1` wrapper for "match any of these name fields" -- used
 * whenever a kind's `INVENTORY_FILTER_FIELDS` entry lists more than one field (`os`, `processes`). A
 * single-field kind skips this wrapper entirely (see `buildInventoryFilterClause` below), so its
 * outbound clause is unchanged from a bare `caseInsensitivePrefixClause` call. */
function anyFieldMatches(
  fields: string[],
  value: string,
): Record<string, unknown> {
  if (fields.length === 1) {
    return caseInsensitivePrefixClause(fields[0], value);
  }
  return {
    bool: {
      should: fields.map(field => caseInsensitivePrefixClause(field, value)),
      minimum_should_match: 1,
    },
  };
}

/**
 * `interface.state` value(s) the syscollector ports schema uses for a bound/listening socket.
 *
 * Evidence (issue #8914, live query against a real wazuh-indexer deployment): a terms aggregation
 * over `interface.state` on `wazuh-states-inventory-ports*` (84 docs) returned exactly
 * `listening` (14), `established` (59), `time_wait` (6), `close_wait` (3) -- lowercase, full
 * English words, NOT the `LISTEN`/`ESTABLISHED` short forms this constant previously held. That
 * mismatch was a live wrong-answer bug: a case-sensitive `term: { 'interface.state': 'LISTEN' }`
 * never matches real `listening` documents, so `get_agent_inventory(kind='ports',
 * filter='9200')` silently returned zero rows against a live cluster (the "OR field absent"
 * fallback below never firing either, since real documents DO carry `interface.state`) and the
 * assistant confidently reported nothing listening on a port that was, live, bound by `java`.
 *
 * `plugins/main`'s own `states-inventory-ports` sample-data generator (`server/lib/sample-data/
 * dataset/states-inventory-ports/main.js`, `random.choice(['LISTEN', 'ESTABLISHED'])`) is
 * SYNTHETIC test fixture data, not a live-verified schema -- it does not match the real
 * wazuh-indexer vocabulary above and MUST NOT be treated as authoritative for this field's casing
 * or wording (this file's previous revision made exactly that mistake). Both `listening` (the
 * confirmed live value) and `listen` (in case an older/differently-provisioned indexer still
 * writes the sample-data generator's short form) are matched below, each case-insensitively, so
 * this survives casing differences in either vocabulary without having to guess which one a given
 * deployment actually writes.
 */
const PORT_LISTENING_STATE_VALUES = ['listening', 'listen'];

/** Case-insensitive exact-value match for one of `PORT_LISTENING_STATE_VALUES` -- `term` (not
 * `match`) with `case_insensitive: true`, the shape OpenSearch supports for an exact-but-cased-
 * agnostic match on a `keyword` field ("keyword field" per `_source` company in
 * `INVENTORY_KIND_CONFIG`'s `ports` entry; a prefix/wildcard match would be wrong here since a
 * substring like "listening" must not accidentally match some other unrelated state word). Kept as
 * its own helper so both values in `PORT_LISTENING_STATE_VALUES` build the identical clause shape. */
function listeningStateClause(value: string): Record<string, unknown> {
  return { term: { 'interface.state': { value, case_insensitive: true } } };
}

/**
 * Resolves the optional `filter` param (issue #8910) to zero or one extra `bool.filter` clause,
 * appended by `buildRequest` after the agent clause. Returns `undefined` for an omitted/blank
 * filter (existing callers with no `filter` supplied get exactly the same request body as before
 * this existed) or the sanitized value collapses to '' after `sanitizeFilterValue` strips it.
 *
 * `ports` is the one kind with no single name field in `INVENTORY_FILTER_FIELDS` (its `_source` has
 * `source.port`/`destination.port` instead of one name field) -- handled here directly rather than
 * added to that map: a filter that parses as a plain non-negative integer (`INTEGER_FILTER_RE`)
 * matches either port field by NUMERIC equality (`term`, not a string match -- these fields are
 * `long`, never `keyword`), since neither `source`/`destination` alone is "the" port a caller means
 * by "port 9200". A non-numeric filter ("which process is on port X" asked the other way, "what's
 * using nginx's port") falls back to the same `process.name` prefix match `processes` uses.
 *
 * Issue #8910: a numeric filter matched EITHER side of the socket with no state narrowing, so
 * "what's listening on port 9200" returned every connection touching 9200 (both the listener AND
 * every established peer connection through it) instead of just the listener(s). Issue #8914
 * narrows this: the outer clause is `bool.filter` on the port match (unchanged, still both sides --
 * a `source.port`/`destination.port` OR, since a caller-supplied port can legitimately be either
 * side of a real socket) AND (via a nested `bool.should`/`minimum_should_match: 1`) either
 * `interface.state` case-insensitively matches one of `PORT_LISTENING_STATE_VALUES` OR the
 * `interface.state` field is absent from that document. The "OR absent" arm is the graceful
 * fallback the issue asks for: `interface.state` is NOT made a hard requirement (a `must`/`filter`
 * on a listening-state term alone would silently return zero rows for any document that happens to
 * lack the field -- e.g. an older/partial doc from before the field existed), so a deployment where
 * some or all `ports` documents never carry `interface.state` still gets its port-only match back
 * exactly as before this fix, one document at a time, rather than the whole query going empty. A
 * document that DOES carry `interface.state` and holds a non-listening value (e.g. `established`)
 * is excluded -- that is the actual narrowing this issue exists for. See
 * `PORT_LISTENING_STATE_VALUES`'s doc comment for why the match is a case-insensitive `term` (not
 * an exact-cased one) against two known spellings, not just the live-confirmed `listening` value
 * alone.
 */
function buildInventoryFilterClause(
  kind: InventoryKind,
  params: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const raw = optionalStringParam(params.filter);
  if (!raw) {
    return undefined;
  }
  const value = sanitizeFilterValue(raw);
  if (value === '') {
    return undefined;
  }
  if (kind === 'ports') {
    if (INTEGER_FILTER_RE.test(value)) {
      const port = Number.parseInt(value, 10);
      const portMatch = {
        bool: {
          should: [
            { term: { 'source.port': port } },
            { term: { 'destination.port': port } },
          ],
          minimum_should_match: 1,
        },
      };
      return {
        bool: {
          filter: [portMatch],
          should: [
            ...PORT_LISTENING_STATE_VALUES.map(listeningStateClause),
            { bool: { must_not: { exists: { field: 'interface.state' } } } },
          ],
          minimum_should_match: 1,
        },
      };
    }
    return caseInsensitivePrefixClause('process.name', value);
  }
  const fields = INVENTORY_FILTER_FIELDS[kind];
  return fields ? anyFieldMatches(fields, value) : undefined;
}

/**
 * Resolves the agent-identifying filter clause from `agent_id`/`agent_name` (issue #8873: a live
 * 40-question run invoked this tool 0/40 times, including on 3 questions statically targeting it,
 * because `agent_id` was strictly required and numeric while the target personas ask deictically
 * -- "this server", "the host" -- with no id the model can infer. Elsewhere in the SAME run the
 * model resolved an agent by calling `get_agents` first, unprompted, so the blocker was this
 * tool's schema, not model reluctance or routing).
 *
 * `agent_id` wins when both are supplied: it is an exact, unambiguous Manager-API identifier,
 * whereas `agent_name` resolves via a `match` clause (free-text, same precedent as
 * search-findings-by-agent.ts) that could in principle match more than one document -- given a
 * caller-supplied id, there is no reason to prefer the fuzzier path. Neither supplied throws a
 * descriptive Error naming both options, same self-correction convention as `validateAgentId`
 * and `parseKind` below (the orchestration loop turns a thrown Error into a bounded tool_result
 * the model reads and can retry from).
 *
 * In normal (non-test) operation this "neither supplied" branch is no longer actually reachable
 * for get_agent_inventory specifically: `resolveDeicticAgentParams` below always runs first (as
 * this tool's `resolveParams` hook) and either injects an `agent_id` or fails the call itself
 * before `buildRequest` -- see that function's doc comment for why (issue #8913). Left in place,
 * unchanged, as defense in depth and because a direct unit-level `buildRequest` call (this file's
 * own tests) bypasses `resolveParams` entirely.
 */
function resolveAgentFilter(
  params: Record<string, unknown>,
): Record<string, unknown> {
  if (params.agent_id !== undefined) {
    return { term: { 'wazuh.agent.id': validateAgentId(params.agent_id) } };
  }
  const agentName = optionalStringParam(params.agent_name);
  if (agentName && agentName.trim() !== '') {
    return { match: { 'wazuh.agent.name': agentName } };
  }
  throw new Error(NO_AGENT_IDENTIFIER_ERROR);
}

/** How many active-agent candidates `resolveDeicticAgentParams` lists in its "which agent?" error
 * when more than one is found -- bounded so a deployment with hundreds of active agents doesn't
 * blow the bounded tool-result error budget. The Manager API's own `total_affected_items` still
 * tells the model the true count even when the listed names are a prefix of it. */
const MAX_LISTED_AGENT_CANDIDATES = 10;
/** Fetch size for the active-agent lookup -- one more than the cap above purely so a result of
 * exactly `MAX_LISTED_AGENT_CANDIDATES + 1` active agents is still reported with an accurate
 * "+N more" rather than looking like an exact match for the cap. */
const AGENT_LOOKUP_LIMIT = MAX_LISTED_AGENT_CANDIDATES + 1;

/**
 * `ToolDefinition.resolveParams` hook (issue #8913): resolves a deictic agent reference ("this
 * server", "the host") server-side instead of relying on the model to call `get_agents` first --
 * the system prompt used to instruct exactly that, but a live-verified N=5 run of the issue's own
 * worked example ("What software does this box have installed?") found the model followed it 0/5
 * times (4/5 asked the user to name an agent instead of looking one up; 1/5 called
 * `search_wazuh_data` and found nothing) -- a live diagnostic later traced this to `get_agents`
 * (its own 'agents' category) not even being offered alongside a lone 'inventory' route, so the
 * model could not have obeyed that instruction regardless of compliance. The system prompt's
 * get_agent_inventory-specific instruction (prompts.ts) was rewritten accordingly to say "call
 * this tool directly" instead of "call get_agents first". This hook is what makes that reworded
 * instruction actually correct rather than just differently wrong: prompt compliance alone can
 * never be guaranteed, so resolution happens here, server-side, independent of it.
 *
 * Only runs when NEITHER `agent_id` NOR `agent_name` was supplied -- a call that supplies either
 * returns `params` unchanged (`ok: true`, no note), so `resolveAgentFilter`'s existing validation
 * for an explicitly-identified call is completely untouched by this hook, and this branch can
 * never weaken it.
 *
 * Queries the SAME source `get_agents` reads (`GET /agents`, Manager API) with the SAME "active"
 * status filter and pseudo-agent exclusion `catalog/get-agents.ts` itself applies -- not a new or
 * different notion of "the agent" than what the model would have found by calling `get_agents`.
 *
 * - Exactly one active agent: proceeds with it (`agent_id` injected into the returned params) and
 *   attaches a `note` naming which agent was assumed -- surfaced to the model via
 *   `Digest.assumptionNote` (digest.ts/executor.ts), so the assumption is visible and the model is
 *   expected to STATE it, not silently act on it as if the user had named that agent.
 * - Zero or more than one active agent: returns the existing "which agent?" error text
 *   (`NO_AGENT_IDENTIFIER_ERROR`), extended with the candidate list when there is more than one,
 *   so the model can ask a narrower, informed follow-up instead of a bare "which agent do you
 *   mean".
 * - The lookup call itself failing (Manager API unreachable, auth failure, ...) falls back to the
 *   same plain `NO_AGENT_IDENTIFIER_ERROR` rather than surfacing a raw lookup failure -- the model
 *   still gets a bounded, actionable message instead of a confusing secondary error layered on top
 *   of the original ambiguity.
 */
async function resolveDeicticAgentParams(
  params: Record<string, unknown>,
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest,
): Promise<ResolveParamsResult> {
  if (params.agent_id !== undefined) {
    return { ok: true, resolved: { params } };
  }
  const agentName = optionalStringParam(params.agent_name);
  if (agentName && agentName.trim() !== '') {
    return { ok: true, resolved: { params } };
  }

  // The actual live-lookup call is shared with param-resolution.ts's generic resolver (both read
  // the SAME source/filters `get-agents.ts` itself reads) -- see that module's
  // `fetchActiveManagerAgents` doc comment. Everything below this line (classification, wording,
  // candidate bounding) stays exactly as it was before that extraction: this tool's own
  // NO_AGENT_IDENTIFIER_ERROR text and note format are intentionally NOT unified with the generic
  // resolver's (see that constant's own doc comment for why), so this function's observable
  // behavior — and every test in get-agent-inventory.test.ts pinning it — is unchanged.
  let agents: ManagerAgentSummary[];
  let totalActive: number;
  try {
    ({ agents, totalActive } = await fetchActiveManagerAgents(
      context,
      request,
      AGENT_LOOKUP_LIMIT,
    ));
  } catch {
    return { ok: false, reason: NO_AGENT_IDENTIFIER_ERROR };
  }

  if (agents.length === 0) {
    return {
      ok: false,
      reason:
        `${NO_AGENT_IDENTIFIER_ERROR} (No active agent was found to assume by default -- the ` +
        'intended agent may be pending/disconnected/never_connected.)',
    };
  }

  if (agents.length === 1 && typeof agents[0].id === 'string') {
    const resolvedId = agents[0].id;
    const resolvedName =
      typeof agents[0].name === 'string' ? agents[0].name : resolvedId;
    return {
      ok: true,
      resolved: {
        params: { ...params, agent_id: resolvedId },
        note:
          'No "agent_id"/"agent_name" was given, so this call was resolved to the only active ' +
          `agent, "${resolvedName}" (id ${resolvedId}). State this assumption to the user rather ` +
          'than presenting the result as if a specific agent had been named.',
      },
    };
  }

  const candidates = agents
    .slice(0, MAX_LISTED_AGENT_CANDIDATES)
    .map(agent =>
      typeof agent.name === 'string' && typeof agent.id === 'string'
        ? `"${agent.name}" (id ${agent.id})`
        : `id ${String(agent.id)}`,
    );
  const remaining = totalActive - candidates.length;
  return {
    ok: false,
    reason:
      `${NO_AGENT_IDENTIFIER_ERROR} (${totalActive} active agents exist, so which one is meant ` +
      `cannot be assumed. Candidates: ${candidates.join(', ')}` +
      `${remaining > 0 ? `, and ${remaining} more` : ''}.)`,
  };
}

/**
 * Replaces `get_agent_os`/`get_agent_packages`/`get_agent_ports`/`get_agent_processes` (issue:
 * "Consolidate agent inventory into one tool") with one tool taking `agent_id`/`agent_name` +
 * `kind` + `limit` (the `agent_id`-only original schema was later found, live, to make deictic
 * questions -- "what's installed on this server" -- uncallable; see `resolveAgentFilter`'s doc
 * comment and issue #8873).
 * Drops the inventory category's schema count from 4 to 1 on every routed turn while raising
 * coverage from 4 of the 13 real `wazuh-states-inventory-*` surfaces to 5 (adds `hotfixes`).
 *
 * `tableSpec.columns`/`digest.sampleColumns` are intentionally empty with `deriveColumns: true`
 * (the mechanism `search_wazuh_data` already uses for the same reason -- see
 * server/tools/types.ts's `deriveColumns` doc comment): a single `ToolDefinition` cannot declare
 * a STATIC table shape that is also correct for 5 different `kind` values with 5 different field
 * sets, and `digest.ts`'s `deriveResultColumns` already reads the executed request's own
 * `_source` list as its first priority -- which this tool always sets per-kind (see
 * `INVENTORY_KIND_CONFIG` above) -- so the rendered table's columns are still exactly each kind's
 * field list, in that order, just labeled by the field's last dot-path segment instead of the
 * four original tools' hand-picked labels ("host.os.name" -> "Name" rather than "OS"). That label
 * difference is the one visible deviation from a byte-for-byte port; the underlying data (fields,
 * order, values) is unchanged, which is what get-agent-inventory.test.ts's regression assertions
 * check.
 */
export const getAgentInventoryTool: ToolDefinition = {
  spec: {
    name: 'get_agent_inventory',
    description:
      'Retrieves one kind of syscollector inventory data for one agent (host/machine/endpoint): ' +
      '"os" (operating system details), "packages" (installed software), "ports" (open network ' +
      'ports), "processes" (running processes), or "hotfixes" (installed Windows hotfixes/KBs -- ' +
      'pairs with the vulnerability tools for patch-management questions, e.g. "which of these ' +
      'critical vulnerabilities already have a hotfix available"). Identify the agent by ' +
      '"agent_id" (numeric) OR "agent_name" if either is already known. If the question refers ' +
      'to "this server"/"the host"/"this box" without naming or numbering it, and no agent id ' +
      'or name is otherwise known from the conversation, call THIS TOOL DIRECTLY with BOTH ' +
      'omitted -- do not call get_agents first. It resolves to the only active agent ' +
      'automatically (stating that assumption is your job, from the note this call returns), or ' +
      'reports the active-agent candidates for you to ask about if there is more than one. ' +
      `${INVENTORY_CURRENT_STATE_NOTE} To ` +
      'check whether one specific package/port/process is present (e.g. "is openssl installed on ' +
      'this host?", "what is listening on port 9200?"), pass "filter" instead of scanning the ' +
      'returned rows yourself -- results are truncated well before every row is returned (see ' +
      '"limit" below), so a specific entry can be absent from the sample even when it exists.',
    parameters: objectSchema(
      {
        agent_id: {
          type: 'string',
          description:
            'Numeric Wazuh agent ID, e.g. "003". Optional: omit this AND agent_name for a ' +
            'deictic host reference ("this box"/"this server") with no known id or name -- the ' +
            'call resolves to the only active agent automatically.',
        },
        agent_name: {
          type: 'string',
          description:
            'Agent name, e.g. "web-prod-01" -- use this when the id is not known but the name ' +
            'is. Optional: omit this AND agent_id for a deictic host reference with neither ' +
            'known -- the call resolves to the only active agent automatically. If both are ' +
            'given, agent_id wins.',
        },
        kind: {
          type: 'string',
          description:
            'Which inventory surface to read: os, packages, ports, processes, or hotfixes.',
          enum: [...INVENTORY_KINDS],
        },
        limit: limitProperty(
          'Max number of rows to return (default 50, max 500). Ignored for kind="os": one agent ' +
            'has at most one current OS record, so this always returns at most 5 rows regardless. ' +
            'A large inventory (e.g. hundreds of packages) can exceed this before every row is ' +
            'returned -- prefer "filter" over raising this for a targeted lookup.',
        ),
        filter: {
          type: 'string',
          description:
            "Narrows results to rows matching this value on the kind's primary name field, " +
            'case-insensitive: package name for "packages", hotfix id for "hotfixes", process ' +
            'name/command line for "processes", hostname/OS name for "os". For "ports", a numeric ' +
            'value matches that port number (source or destination) and prefers the LISTENING ' +
            'socket(s) when a row carries the "interface.state" field ("what is listening on port ' +
            '9200?" -- rows without that field are still returned, unnarrowed, so the port-only ' +
            'match never goes silently empty); a non-numeric value matches the process name bound ' +
            "to the port. Optional -- omit to return the kind's unfiltered rows (existing " +
            'behavior, subject to "limit").',
        },
      },
      ['kind'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const agentFilter = resolveAgentFilter(params);
    const kind = parseKind(params.kind);
    const config = INVENTORY_KIND_CONFIG[kind];
    const size =
      config.fixedSize ??
      clampLimit(
        params.limit,
        config.limitRange?.[0] ?? 50,
        config.limitRange?.[1] ?? 500,
      );
    const inventoryFilter = buildInventoryFilterClause(kind, params);
    const filter = inventoryFilter
      ? [agentFilter, inventoryFilter]
      : [agentFilter];
    return {
      target: 'indexer',
      index: config.index,
      body: {
        query: {
          bool: { filter },
        },
        _source: config.source,
        sort: ['_doc'],
        size,
        ...(config.breakdownAggs ? { aggs: config.breakdownAggs } : {}),
      },
    };
  },
  tableSpec: { columns: [] },
  digest: {
    sampleColumns: [],
    // Digest-level fallback for the kinds with no real breakdown aggregation (see
    // InventoryKindConfig.breakdownAggs' doc comment for the per-kind split and why): groups the
    // RETURNED rows via getByPath, so a dimension simply produces no buckets for kinds whose rows
    // don't carry it — one tool-level list covers `packages` (architecture/vendor: textbook
    // closed-set dimensions on a kind whose real hosts carry 500-2000 docs against a default
    // limit of 50, the most truncation-prone kind in this tool) and `processes` (process.state)
    // at zero cost to the other kinds. All three fields have their own EXPLICIT
    // FIELD_POLICY_DEFAULTS entry (package.architecture and process.state 'allow'; package.vendor
    // 'anonymize' -- a vendor/distributor string routinely embeds a maintainer email address, see
    // privacy.ts's comment on that entry for why 'allow' is wrong for it specifically). That is a
    // deliberate correction from an earlier version of this comment, which called `package.vendor`
    // a "known-safe structural field" -- that phrase describes ONLY
    // field-policy-coverage.test.ts's `KNOWN_SAFE_STRUCTURAL_FIELDS`, a test-only allowlist for
    // "this field needs no entry under the ALLOW-by-omission default". This tool sets
    // `deriveColumns: true`, which flips that default to FAIL-CLOSED anonymize (see this file's
    // `deriveColumns` doc comment and privacy.ts's `isEscapeHatch`) -- so "needs no policy entry"
    // and "is safe to send to the provider" are OPPOSITES here, not synonyms, and a field's mere
    // presence in that structural-shape allowlist proves neither. executor.ts's identity-map path
    // scrubs synthetic breakdown keys through the same applyFieldPolicy pass as a real
    // aggregation's, so each dimension above needs, and now has, its own reviewed entry.
    breakdownDimensions: [
      'package.architecture',
      'package.vendor',
      'process.state',
    ],
  },
  deriveColumns: true,
  resolveParams: resolveDeicticAgentParams,
  // Issue #8917: explicit, not inherited from `deriveColumns` above (see
  // `ToolDefinition.failClosedFieldPolicy`'s doc comment, types.ts). This tool's 5 kinds each
  // read a small, fixed, reviewed `_source` list (`INVENTORY_KIND_CONFIG` above) rather than a
  // genuinely arbitrary caller-supplied field set -- but every one of those fields still needs
  // its own explicit `FIELD_POLICY_DEFAULTS` entry (privacy.ts) before it is safe to relax this,
  // so it stays `true` today, same as before this flag existed.
  failClosedFieldPolicy: true,
};
