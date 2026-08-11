import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../src/core/server';
import {
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
 * PRIVACY DECISION, made explicit rather than left implicit: the assumption notes and "which one?"
 * candidate lists this module returns embed raw agent names (and, for `indexer-terms`, raw field
 * values) in free text, with no pseudonymization at construction. `executor.ts` awaits
 * `def.resolveParams(params, context, request)` -- it does not pass its `PrivacyContext` in, so
 * this generic hook structurally cannot call `privacy.pseudonymizer.pseudonymize(...)` the way
 * `executor.ts`'s own `appendEntityNearMissHint` does (issue #8920) before a name reaches free
 * text. This is exact parity with #8913's hand-written `resolveDeicticAgentParams`, which has the
 * same gap today -- so this change does not introduce a new hole, but it does widen the SAME gap
 * from one tool/one name to five tools and up to `MAX_LISTED_CANDIDATES` names per failed call.
 * The net that still applies is `chat.ts`'s best-effort post-hoc `prescanAndMintToolContent` /
 * `applyToText` pass over the final tool-result text. Threading `PrivacyContext` into
 * `resolveParams` so this module (and #8913's hook) can pseudonymize at construction, matching
 * #8920's convention, is tracked as follow-up rather than done here: it is an `executor.ts` change,
 * which this task was explicitly scoped to avoid.
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
  const agents = Array.isArray(data?.affected_items)
    ? (data.affected_items as ManagerAgentSummary[])
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
  | { status: 'resolved'; value: string; note: string }
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
    for (const spec of specs) {
      const outcome = await resolveOneParam(spec, nextParams, context, request);
      if (outcome.status === 'skip') {
        continue;
      }
      if (outcome.status === 'failed') {
        return { ok: false, reason: outcome.reason };
      }
      nextParams = { ...nextParams, [spec.param]: outcome.value };
      notes.push(outcome.note);
    }
    return {
      ok: true,
      resolved: {
        params: nextParams,
        ...(notes.length > 0 ? { note: notes.join(' ') } : {}),
      },
    };
  };
}
