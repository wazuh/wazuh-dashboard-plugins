import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../src/core/server';
import {
  ResolvedToolParams,
  ResolveParamsResult,
  SoleCandidateParamSpec,
  ToolDefinition,
} from './types';
import { resolveApiHostId } from './api-host';
import { applySafetyValves, checkIndexAllowlist, lintDsl } from './guardrails';

/**
 * Generic sole-candidate parameter resolution (issue: "generic sole-candidate parameter
 * resolution"). Template: issue #8913's `resolveDeicticAgentParams`
 * (catalog/get-agent-inventory.ts) -- a live-verified system-prompt-only instruction to call a
 * lookup tool first when a question refers deictically ("this server", "my auditor wants proof of
 * SSH hardening") measured 0/5; the code hook that resolves the missing parameter server-side,
 * against a live source, works and is the template this file generalizes so every catalog tool
 * with a `soleCandidateParams` declaration (types.ts) gets the same behavior without writing its
 * own `resolveParams` hook.
 *
 * The contract (identical for every param, regardless of `source.kind`):
 * - the caller already supplied the param -> passthrough, unchanged, no lookup, no note.
 * - the lookup finds EXACTLY ONE candidate -> inject it into `params` and attach an
 *   `assumptionNote` naming what was assumed, so the model states the assumption instead of
 *   presenting the result as if the caller had named that value.
 * - the lookup finds ZERO or MORE THAN ONE candidate -> `ok: false` with up to
 *   `MAX_LISTED_CANDIDATES` named candidates, so the model can ask a narrower, informed follow-up
 *   instead of a bare "which agent?"/"which policy?".
 * - the lookup itself fails (Manager API unreachable, Indexer query rejected, ...) -> a plain
 *   bounded error, never a raw secondary failure layered on top of the original ambiguity.
 *
 * Params declared in `soleCandidateParams` resolve IN DECLARED ORDER, each against the (possibly
 * already-patched) `params` object the params before it left behind -- this is what lets a later
 * param `scopedBy` an earlier one (e.g. `get_sca_checks`'s `policy_id` narrows its own lookup to
 * whichever `agent_id` was supplied or just resolved).
 *
 * PRIVACY: the assumption notes this module returns embed raw identifier values (an agent's
 * hostname) in free text. Resolvers still have no `PrivacyContext` -- instead each resolved
 * outcome DECLARES the identifier values it interpolated (`noteEntities`), and `executor.ts`'s
 * `scrubAssumptionNote` pseudonymizes them at the single choke point every resolver's note passes
 * through, under privacy mode only. This replaced the earlier "post-hoc text scan will catch it"
 * assumption after a wire capture (privacy probe P3, 2026-08-14) proved it false: a bare
 * single-word hostname in the note reached the provider in the clear -- it is not address-shaped
 * (the shape scan's documented limitation) and was never minted (resolution exists precisely
 * because the caller never supplied the value), so both downstream scans missed it. The "which
 * one?" candidate lists in FAILED outcomes travel as tool-result error text, not as a digest
 * note, and remain covered by `chat.ts`'s `prescanAndMintToolContent` pass plus the same bare-name
 * limitation -- a residual documented in the privacy issue, not silently assumed away.
 */

/** How many named candidates a "which one?" error lists, for either lookup kind -- bounded so a
 * deployment with hundreds of active agents/policies doesn't blow the bounded tool-result error
 * budget. Mirrors `get-agent-inventory.ts`'s own `MAX_LISTED_AGENT_CANDIDATES` (kept as a
 * separate constant rather than imported: that file's constant is specific to its own,
 * byte-for-byte-preserved error wording, not this generic path's). */
const MAX_LISTED_CANDIDATES = 10;
/** Fetch size for either lookup -- one more than the cap above purely so a result of exactly
 * `MAX_LISTED_CANDIDATES + 1` candidates is still reported with an accurate "+N more" rather than
 * looking like an exact match for the cap. */
const LOOKUP_FETCH_SIZE = MAX_LISTED_CANDIDATES + 1;
/** Same pseudo-agent exclusion `get-agents.ts`'s own "no agent_ids filter" branch applies (its own
 * `q: 'id!=000'`), so a deployment with otherwise zero real active agents cannot silently resolve
 * to the manager's own pseudo-agent "000". */
const MANAGER_PSEUDO_AGENT_QUERY = 'id!=000';

export interface ManagerAgentSummary {
  id?: unknown;
  name?: unknown;
}

/**
 * Fetches the active-agent list from the Manager API (`GET /agents`), the same source and filters
 * `get-agents.ts`'s own tool reads. Shared by `get-agent-inventory.ts`'s own
 * `resolveDeicticAgentParams` (issue #8913, unchanged wording -- see that file) and this module's
 * generic `manager-agents` resolution, so both read exactly the same notion of "the agent",
 * neither a new one. Throws on any lookup failure (network, auth, malformed response) -- callers
 * are expected to wrap this in their own try/catch and degrade to a plain bounded error, same
 * convention as every other live-lookup call in this plugin.
 */
export async function fetchActiveManagerAgents(
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest,
  limit: number,
): Promise<{ agents: ManagerAgentSummary[]; totalActive: number }> {
  const apiHostID = await resolveApiHostId(context, request);
  const response = await context.wazuh_core.api.client.asCurrentUser.request(
    'GET',
    '/agents',
    {
      params: {
        status: 'active',
        q: MANAGER_PSEUDO_AGENT_QUERY,
        limit,
      },
    },
    { apiHostID },
  );
  const data = (
    response.data as
      | {
          data?: {
            affected_items?: unknown;
            total_affected_items?: unknown;
          };
        }
      | undefined
  )?.data;
  // Hoisted so `Array.isArray` narrows the value itself: narrowing an optional-chained
  // `data?.affected_items` does not carry back to `data`, so reading `data.affected_items` in the
  // true branch is an "object is possibly undefined" error.
  const affectedItems = data?.affected_items;
  const agents = Array.isArray(affectedItems)
    ? (affectedItems as ManagerAgentSummary[])
    : [];
  const totalActive =
    typeof data?.total_affected_items === 'number'
      ? data.total_affected_items
      : agents.length;
  return { agents, totalActive };
}

export type ManagerAgentsLookupResult =
  | { kind: 'single'; id: string; name: string }
  | { kind: 'none' }
  | {
      kind: 'many';
      candidates: Array<{ id: string; name: string }>;
      total: number;
    }
  | { kind: 'error' };

/**
 * Generic wrapper over `fetchActiveManagerAgents` that classifies the result into the four
 * contract outcomes this module's resolver needs, bounding the listed candidates at
 * `MAX_LISTED_CANDIDATES`. Any thrown error (lookup failure) degrades to `{kind: 'error'}` --
 * never rethrown -- so this can be called unconditionally from the resolution loop below.
 */
export async function lookupManagerAgentsCandidate(
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest,
): Promise<ManagerAgentsLookupResult> {
  try {
    const { agents, totalActive } = await fetchActiveManagerAgents(
      context,
      request,
      LOOKUP_FETCH_SIZE,
    );
    if (agents.length === 0) {
      return { kind: 'none' };
    }
    if (agents.length === 1 && typeof agents[0].id === 'string') {
      const id = agents[0].id;
      const name = typeof agents[0].name === 'string' ? agents[0].name : id;
      return { kind: 'single', id, name };
    }
    const candidates = agents
      .slice(0, MAX_LISTED_CANDIDATES)
      .filter(
        (agent): agent is { id: string; name?: unknown } =>
          typeof agent.id === 'string',
      )
      .map(agent => ({
        id: agent.id,
        name: typeof agent.name === 'string' ? agent.name : agent.id,
      }));
    // A non-string `id` on every fetched agent (malformed Manager response) would otherwise
    // reach here with an empty `candidates` list and render a malformed "Candidates: , and N
    // more." -- degrade to the same plain bounded error a lookup failure gets instead of naming
    // zero candidates.
    if (candidates.length === 0) {
      return { kind: 'error' };
    }
    return { kind: 'many', candidates, total: totalActive };
  } catch {
    return { kind: 'error' };
  }
}

export type IndexerTermsLookupResult =
  | { kind: 'single'; value: string }
  | { kind: 'none' }
  | { kind: 'many'; candidates: string[]; total: number }
  | { kind: 'error' };

/**
 * Bounded `terms` aggregation enumerator over an arbitrary Indexer field, the `indexer-terms`
 * counterpart to `lookupManagerAgentsCandidate` above -- for a param whose sole-candidate source
 * is an Indexer field rather than the Manager API's agent list (e.g. `get_sca_checks`'s
 * `policy_id`, scoped to one agent's `wazuh-states-sca*` documents). Same allowlist/safety-valve/
 * lint pipeline `executor.ts`'s own `executeIndexerRequest` applies to every real Indexer call:
 * `checkIndexAllowlist` first (so a future `soleCandidateParams` declaration can never probe an
 * off-allowlist index), then `applySafetyValves`, then `lintDsl`, all run on the SAME probe body a
 * real tool call would be guardrailed on, so this can never issue a request the catalog's own
 * tools would be rejected for. `size: 0` (no hits, aggregation only) and `LOOKUP_FETCH_SIZE`
 * (bounded, see this file's own constant doc comment) as the terms `size` -- well under
 * `MAX_AGG_SIZE`. `total` here is the number of DISTINCT candidate values actually observed within
 * that bounded fetch, not a true cardinality count (no `cardinality` agg is run) -- adequate for
 * an ambiguity disclosure, which only needs "more than one, here are up to N of them", not an
 * exact distinct count.
 *
 * `scopeFilter` is a plain `bool.filter` clause array (e.g. `[{term: {'wazuh.agent.id': '003'}}]`)
 * -- empty means unscoped (`match_all`). The caller (`buildGenericResolveParams` below) is
 * responsible for building it from a `scopedBy` declaration; this function has no opinion on
 * scoping, it only runs whatever filter it is given.
 */
export async function lookupIndexerTermsCandidate(
  context: RequestHandlerContext,
  index: string,
  field: string,
  scopeFilter: Record<string, unknown>[],
): Promise<IndexerTermsLookupResult> {
  try {
    const allowlistCheck = checkIndexAllowlist(index);
    if (!allowlistCheck.ok) {
      return { kind: 'error' };
    }
    const probeBody: Record<string, unknown> = {
      query: {
        bool: {
          filter: scopeFilter.length > 0 ? scopeFilter : [{ match_all: {} }],
        },
      },
      size: 0,
      aggs: {
        candidates: { terms: { field, size: LOOKUP_FETCH_SIZE } },
      },
    };
    const valved = applySafetyValves(probeBody);
    if (!valved.ok) {
      return { kind: 'error' };
    }
    const lint = lintDsl(valved.body, index);
    if (!lint.ok) {
      return { kind: 'error' };
    }
    const response = await context.core.opensearch.client.asCurrentUser.search({
      index,
      body: valved.body,
    });
    const buckets = (
      response.body as
        | { aggregations?: { candidates?: { buckets?: unknown } } }
        | undefined
    )?.aggregations?.candidates?.buckets;
    if (!Array.isArray(buckets)) {
      return { kind: 'error' };
    }
    const keys = buckets
      .map(bucket => (bucket as { key?: unknown })?.key)
      .filter((key): key is string => typeof key === 'string');
    if (keys.length === 0) {
      return { kind: 'none' };
    }
    if (keys.length === 1) {
      return { kind: 'single', value: keys[0] };
    }
    return {
      kind: 'many',
      candidates: keys.slice(0, MAX_LISTED_CANDIDATES),
      total: keys.length,
    };
  } catch {
    return { kind: 'error' };
  }
}

/** Plain bounded error shared by every unresolvable outcome (zero/many candidates, or a lookup
 * failure) that carries no candidate list of its own -- kept as one string so every generic
 * resolution failure that names no candidates reads identically, the same self-correction
 * convention `get-agent-inventory.ts`'s own `NO_AGENT_IDENTIFIER_ERROR` follows for its tool. */
function boundedErrorFor(param: string): string {
  return (
    `Parameter "${param}" was not supplied and could not be resolved automatically. Ask the ` +
    'user to specify it.'
  );
}

/** Picks the injected value's shape from a resolved Manager-agents candidate, per the
 * `soleCandidateParams` entry's `valueFrom` ('id' by default -- most agent-identifying params on
 * this catalog, e.g. `agent_id`, are numeric Manager IDs). */
function pickAgentValue(
  candidate: { id: string; name: string },
  valueFrom: 'id' | 'name' | 'id-or-name' | undefined,
): string {
  if (valueFrom === 'name') {
    return candidate.name;
  }
  // 'id-or-name' has no single canonical choice (the param accepts either) -- the id is the
  // exact, unambiguous one, same precedent as get-agent-inventory.ts's resolveAgentFilter
  // preferring agent_id over agent_name when both are available.
  return candidate.id;
}

/** Builds the `bool.filter` scope clause for an `indexer-terms` lookup's `scopedBy` declaration
 * from the (possibly already-resolved) params object -- `undefined` when the scoping param has no
 * usable value yet, in which case the caller treats this param as unresolvable this turn (it can
 * never be reached with an empty scope: an unscoped policy-id lookup across every agent would be a
 * different, unbounded question). */
function buildScopeFilter(
  scopedBy: { param: string; field: string } | undefined,
  params: Record<string, unknown>,
): Record<string, unknown>[] | undefined {
  if (!scopedBy) {
    return [];
  }
  const value = params[scopedBy.param];
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }
  return [{ term: { [scopedBy.field]: value } }];
}

export interface ScaCheckOwner {
  agentId: string;
  policyId: string;
}

export type ScaCheckOwnerLookupResult =
  | { kind: 'single'; owner: ScaCheckOwner }
  | { kind: 'none' }
  | { kind: 'many'; owners: ScaCheckOwner[]; total: number }
  | { kind: 'error' };

/**
 * BLOCKER FIX (CV-053/CV-052/CV-088 turn 3 -- 2026-08-19 adjudicated run, "more than one active
 * agent exists" false-premise refusal): `get_sca_checks` used to require `agent_id` to resolve
 * FIRST against the Manager's fleet-wide active-agent list (`lookupManagerAgentsCandidate` above)
 * even when the caller already named a specific `check_id` -- a value that, on its own, uniquely
 * identifies the SCA document (and therefore the owning agent+policy) the caller is asking about.
 * Verified live (adjudication note): `wazuh-states-sca` holds exactly ONE document for check
 * `28500`, yet the fleet-wide active-agent count the OLD path depended on was ambiguous, so the
 * call refused before ever looking at the one document that actually answers "which agent/policy".
 *
 * This is the "resolve from the question's own scope" fix the review calls for: given a
 * `check_id`, query `wazuh-states-sca*` DIRECTLY for `check.id: check_id` (unscoped by agent) and
 * read `wazuh.agent.id`/`policy.id` straight off the matching document(s) -- never touching the
 * fleet-wide agent list at all. A `check_id` inherently narrows the candidate space far more than
 * "every active agent", so this resolves to a single owner in the overwhelmingly common case (one
 * agent runs a given policy) even on a deployment where the fleet-wide list itself is ambiguous.
 *
 * Only when the SAME check_id genuinely belongs to more than one (agent, policy) pair does this
 * fall through to the "many" outcome -- and even then it is a bounded, NAMED enumeration (never a
 * bare refusal), listing the actual owning agents so the caller can pick one, per the product rule
 * that a false or unhelpfully broad premise must never end in a hard decline.
 */
export async function lookupScaCheckOwner(
  context: RequestHandlerContext,
  checkId: string,
): Promise<ScaCheckOwnerLookupResult> {
  const index = 'wazuh-states-sca*';
  try {
    const allowlistCheck = checkIndexAllowlist(index);
    if (!allowlistCheck.ok) {
      return { kind: 'error' };
    }
    const probeBody: Record<string, unknown> = {
      query: { bool: { filter: [{ term: { 'check.id': checkId } }] } },
      size: LOOKUP_FETCH_SIZE,
      _source: ['wazuh.agent.id', 'policy.id'],
    };
    const valved = applySafetyValves(probeBody);
    if (!valved.ok) {
      return { kind: 'error' };
    }
    const lint = lintDsl(valved.body, index);
    if (!lint.ok) {
      return { kind: 'error' };
    }
    const response = await context.core.opensearch.client.asCurrentUser.search({
      index,
      body: valved.body,
    });
    const hits = (
      response.body as
        | { hits?: { total?: unknown; hits?: unknown } }
        | undefined
    )?.hits;
    const rawHits = Array.isArray(hits?.hits) ? (hits!.hits as unknown[]) : [];
    const totalRaw = hits?.total as number | { value?: number } | undefined;
    const total =
      typeof totalRaw === 'number'
        ? totalRaw
        : typeof totalRaw?.value === 'number'
        ? totalRaw.value
        : rawHits.length;
    const seen = new Set<string>();
    const owners: ScaCheckOwner[] = [];
    for (const hit of rawHits) {
      const source = (hit as { _source?: Record<string, unknown> })?._source;
      const agentId = (
        source?.wazuh as { agent?: { id?: unknown } } | undefined
      )?.agent?.id;
      const policyId = (source?.policy as { id?: unknown } | undefined)?.id;
      if (typeof agentId === 'string' && typeof policyId === 'string') {
        const key = `${agentId} ${policyId}`;
        if (!seen.has(key)) {
          seen.add(key);
          owners.push({ agentId, policyId });
        }
      }
    }
    if (owners.length === 0) {
      return { kind: 'none' };
    }
    if (owners.length === 1) {
      return { kind: 'single', owner: owners[0] };
    }
    return {
      kind: 'many',
      owners: owners.slice(0, MAX_LISTED_CANDIDATES),
      total: Math.max(total, owners.length),
    };
  } catch {
    return { kind: 'error' };
  }
}

/**
 * Resolves one `soleCandidateParams` entry against the current (possibly already-patched)
 * `params`. Returns `{status: 'skip'}` when the param was already supplied (no lookup at all) so
 * the caller can leave `params`/`note` untouched, `{status: 'resolved', ...}` on a successful
 * single-candidate resolution, or `{status: 'failed', reason}` on every other outcome.
 *
 * The passthrough gate below (`typeof existing === 'string' && existing.trim() !== ''`) is
 * intentionally looser than `get-agent-inventory.ts`'s own `resolveDeicticAgentParams`, which
 * passes through on the weaker `params.agent_id !== undefined` and lets a caller-supplied empty
 * string reach its own "required and must be a non-empty string" bounded error. Here an empty
 * string instead falls through to live resolution, same as an omitted param -- a deliberate,
 * documented divergence, not an oversight: `schema-validator.ts` rejects any non-string value
 * before `resolveParams` ever runs, so this gate only ever sees a string or `undefined`, and
 * treating a blank string as "not supplied" is arguably the more useful behavior for a caller
 * that emits `''` instead of omitting the key.
 */
async function resolveOneParam(
  spec: SoleCandidateParamSpec,
  params: Record<string, unknown>,
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest,
): Promise<
  | { status: 'skip' }
  | {
      status: 'resolved';
      value: string;
      note: string;
      /** Identifier values interpolated into `note`, threaded up to
       * `ResolvedToolParams.noteEntities` (types.ts) so executor.ts pseudonymizes them under
       * privacy mode (capture probe P3, 2026-08-14: an undeclared resolved hostname reached
       * the provider in the clear). Empty for values that are not identifiers (a policy id). */
      noteEntities: Array<{
        value: string;
        kind: 'HOST' | 'IP' | 'USER' | 'URL' | 'VAL';
      }>;
    }
  | { status: 'failed'; reason: string }
> {
  const existing = params[spec.param];
  if (typeof existing === 'string' && existing.trim() !== '') {
    return { status: 'skip' };
  }

  if (spec.source.kind === 'manager-agents') {
    const result = await lookupManagerAgentsCandidate(context, request);
    if (result.kind === 'single') {
      const value = pickAgentValue(result, spec.valueFrom);
      return {
        status: 'resolved',
        value,
        note:
          `No "${spec.param}" was given, so this call was resolved to the only active agent ` +
          `"${result.name}" (id ${result.id}). State this assumption to the user rather than ` +
          'presenting the result as if a specific agent had been named.',
        // The hostname the note interpolates; the bare id stays undeclared (wazuh.agent.id is a
        // reviewed 'allow' in the field policy).
        noteEntities: [{ value: result.name, kind: 'HOST' }],
      };
    }
    if (result.kind === 'none') {
      return {
        status: 'failed',
        reason:
          `${boundedErrorFor(
            spec.param,
          )} (No active agent was found to assume by default -- ` +
          'the intended agent may be pending/disconnected/never_connected.)',
      };
    }
    if (result.kind === 'many') {
      const named = result.candidates.map(
        candidate => `"${candidate.name}" (id ${candidate.id})`,
      );
      const remaining = result.total - named.length;
      return {
        status: 'failed',
        reason:
          `${boundedErrorFor(spec.param)} (${
            result.total
          } active agents exist, so which one ` +
          `is meant cannot be assumed. Candidates: ${named.join(', ')}` +
          `${remaining > 0 ? `, and ${remaining} more` : ''}.)`,
      };
    }
    return { status: 'failed', reason: boundedErrorFor(spec.param) };
  }

  // spec.source.kind === 'indexer-terms'
  const scopeFilter = buildScopeFilter(spec.source.scopedBy, params);
  if (scopeFilter === undefined) {
    // The param this lookup would scope by has no resolved value yet -- declared order (see this
    // file's header comment) means this should not normally happen, but degrading to a plain
    // bounded error is still correct (never an unscoped, unbounded lookup) rather than throwing.
    return { status: 'failed', reason: boundedErrorFor(spec.param) };
  }
  const result = await lookupIndexerTermsCandidate(
    context,
    spec.source.index,
    spec.source.field,
    scopeFilter,
  );
  if (result.kind === 'single') {
    return {
      status: 'resolved',
      value: result.value,
      note:
        `No "${spec.param}" was given, so this call was resolved to the only matching value, ` +
        `"${result.value}". State this assumption to the user rather than presenting the ` +
        'result as if that value had been named.',
      // A terms-source value is a catalog identifier (an SCA policy id), not a host/user/network
      // identifier -- nothing to declare. If a future spec resolves an identifier-bearing field
      // this way, it must declare it here or the P3 leak returns for that tool.
      noteEntities: [],
    };
  }
  if (result.kind === 'none') {
    return {
      status: 'failed',
      reason: `${boundedErrorFor(
        spec.param,
      )} (No matching value was found to assume by default.)`,
    };
  }
  if (result.kind === 'many') {
    // `result.total` is `keys.length` from a bounded terms-agg fetch (LOOKUP_FETCH_SIZE, see this
    // file's own constant doc comment) -- an observed floor, not a true cardinality. Unlike the
    // manager-agents branch above (whose `totalActive` comes from the Manager API's own exact
    // `total_affected_items`), naming an exact "N more" here would assert a remainder this lookup
    // cannot back: a 500-policy agent and an 11-policy agent both hit the same cap and would both
    // read "and 1 more". Hedge instead of asserting a count.
    const hasMore = result.total > result.candidates.length;
    return {
      status: 'failed',
      reason:
        `${boundedErrorFor(spec.param)} (At least ${
          result.total
        } distinct values exist, so ` +
        `which one is meant cannot be assumed. Candidates: ${result.candidates.join(
          ', ',
        )}` +
        `${hasMore ? ', and possibly more' : ''}.)`,
    };
  }
  return { status: 'failed', reason: boundedErrorFor(spec.param) };
}

/**
 * Builds a `ToolDefinition.resolveParams` hook from a tool's own `soleCandidateParams`
 * declaration (types.ts) -- the generic counterpart to `get-agent-inventory.ts`'s hand-written
 * `resolveDeicticAgentParams` (issue #8913), for every other catalog tool that needs the same
 * "resolve a deictic/omitted parameter against a live source" behavior without writing its own
 * hook. Attached automatically by `registry.ts` at load time for any tool that declares
 * `soleCandidateParams` and no hand-written `resolveParams` of its own.
 *
 * Resolves every declared param IN ORDER (see this file's header comment for why: a later param's
 * `scopedBy` reads whatever an earlier param resolved to, or was already supplied as), collecting
 * one assumption-note sentence per resolved param. The first param that fails to resolve
 * short-circuits the whole call -- same "one bounded error, no partial resolution" contract
 * `resolveDeicticAgentParams` itself follows.
 */
export function buildGenericResolveParams(
  def: ToolDefinition,
): NonNullable<ToolDefinition['resolveParams']> {
  const specs = def.soleCandidateParams ?? [];
  return async function resolveGeneric(
    params: Record<string, unknown>,
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
  ): Promise<ResolveParamsResult> {
    let nextParams = params;
    const notes: string[] = [];
    const noteEntities: NonNullable<ResolvedToolParams['noteEntities']> = [];
    for (const spec of specs) {
      // Deliberately sequential: each spec resolves against `nextParams` as folded in by every
      // PRIOR spec in this same loop (see the `nextParams = ...` fold below), so a later param's
      // resolution can legitimately depend on an earlier one's outcome. Running these concurrently
      // would resolve every spec against the original, un-folded `params` instead.
      // eslint-disable-next-line no-await-in-loop
      const outcome = await resolveOneParam(spec, nextParams, context, request);
      if (outcome.status === 'skip') {
        continue;
      }
      if (outcome.status === 'failed') {
        return { ok: false, reason: outcome.reason };
      }
      nextParams = { ...nextParams, [spec.param]: outcome.value };
      notes.push(outcome.note);
      noteEntities.push(...outcome.noteEntities);
    }
    return {
      ok: true,
      resolved: {
        params: nextParams,
        ...(notes.length > 0 ? { note: notes.join(' ') } : {}),
        ...(noteEntities.length > 0 ? { noteEntities } : {}),
      },
    };
  };
}

/**
 * BLOCKER FIX (CV-053/CV-052/CV-088 turn 3): `get_sca_checks`-specific `resolveParams`, wrapping
 * `buildGenericResolveParams` rather than replacing it. When the caller supplies a `check_id` AND
 * is missing `agent_id` and/or `policy_id`, resolves BOTH from the check's own document
 * (`lookupScaCheckOwner` above) instead of falling through to the fleet-wide, potentially-ambiguous
 * `manager-agents` lookup -- the "resolve from the question's own scope" fix (a check id already
 * identifies its document, so there is no need to ask "which agent" at all). Every other call shape
 * (no `check_id`, or `agent_id`/`policy_id` already both supplied) is UNCHANGED: it falls straight
 * through to `buildGenericResolveParams`, byte-identical to this tool's behavior before check_id
 * existed.
 *
 * On an ambiguous check_id (the same id genuinely belongs to more than one agent+policy pair --
 * rare, since a check id is scoped to one policy's benchmark), this still never hard-refuses: it
 * returns a bounded, NAMED enumeration of the owning (agent, policy) pairs so the caller can narrow
 * with a real follow-up, the same "list, don't just decline" contract every other sole-candidate
 * outcome in this module already follows.
 */
export function resolveScaCheckParams(
  def: ToolDefinition,
): NonNullable<ToolDefinition['resolveParams']> {
  const genericResolve = buildGenericResolveParams(def);
  return async function resolveScaChecks(
    params: Record<string, unknown>,
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
  ): Promise<ResolveParamsResult> {
    const checkId = params.check_id;
    const agentSupplied =
      typeof params.agent_id === 'string' && params.agent_id.trim() !== '';
    const policySupplied =
      typeof params.policy_id === 'string' && params.policy_id.trim() !== '';
    if (
      typeof checkId !== 'string' ||
      checkId.trim() === '' ||
      (agentSupplied && policySupplied)
    ) {
      return genericResolve(params, context, request);
    }

    const result = await lookupScaCheckOwner(context, checkId.trim());
    if (result.kind === 'single') {
      const nextParams = {
        ...params,
        ...(agentSupplied ? {} : { agent_id: result.owner.agentId }),
        ...(policySupplied ? {} : { policy_id: result.owner.policyId }),
      };
      return {
        ok: true,
        resolved: {
          params: nextParams,
          note:
            `No agent/policy was given, so check_id "${checkId.trim()}" was resolved to its ` +
            `owning agent (id ${result.owner.agentId}) and policy (id ${result.owner.policyId}) ` +
            'directly from the matching check document. State this assumption to the user rather ' +
            'than presenting the result as if the agent/policy had been named.',
        },
      };
    }
    if (result.kind === 'none') {
      return {
        ok: false,
        reason:
          `No SCA check with id "${checkId.trim()}" was found. Ask the user ` +
          'to confirm the check id.',
      };
    }
    if (result.kind === 'many') {
      const named = result.owners.map(
        owner => `agent ${owner.agentId} (policy ${owner.policyId})`,
      );
      const remaining = result.total - named.length;
      return {
        ok: false,
        reason:
          `Check id "${checkId.trim()}" belongs to more than one agent/policy pair (${
            result.total
          } found), so which one is meant cannot be assumed. Candidates: ${named.join(
            ', ',
          )}` +
          `${
            remaining > 0 ? `, and ${remaining} more` : ''
          }. Ask the user which one they mean.`,
      };
    }
    // Lookup failure (kind 'error'): degrade to the ordinary fleet-wide resolution rather than a
    // raw secondary failure layered on top of the original ambiguity -- same convention every other
    // resolver in this module follows.
    return genericResolve(params, context, request);
  };
}
