import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../src/core/server';
import { ToolSpec } from '../../common/types';

/**
 * Outcome of an optional `ToolDefinition.resolveParams` hook (see that field's doc comment below;
 * added for issue #8913). Not itself a `ToolRequest` -- exactly one outbound request still
 * executes per tool call (`executor.ts`'s `executeToolCall`); this is the result of a live lookup
 * that happens BEFORE that request is built, used to patch/validate `params`.
 */
export interface ResolvedToolParams {
  /** Params to hand to `buildRequest`, including every original param unchanged plus whatever this
   * hook resolved (e.g. an inferred `agent_id`). */
  params: Record<string, unknown>;
  /** Surfaced to the model via `Digest.assumptionNote` (digest.ts) when a value was inferred
   * rather than supplied by the caller -- e.g. "no agent was specified; assumed the only active
   * agent". Omitted when nothing was inferred (every param the hook cared about was already
   * supplied), so a call that needed no resolution produces no note. */
  note?: string;
  /** Identifier values embedded in `note` that carry privacy weight (e.g. the resolved agent's
   * hostname), each tagged with its pseudonym kind. Under privacy mode `executor.ts` substitutes
   * each one in the note with `pseudonymizer.pseudonymize(value, kind)` BEFORE the note reaches
   * the digest — without this, a resolved hostname reaches the provider in the clear: it is a
   * bare single-word token, so neither the shape scan (not address-shaped; privacy.ts's
   * documented bare-hostname limitation) nor the known-entity scan (nothing minted it — the
   * whole point of resolution is that the caller never supplied the value) can catch it. Proven
   * on the wire 2026-08-14: the note carried the raw agent name while
   * `HOST_` appeared nowhere in the outbound body. Same treatment as the near-miss hint's
   * explicit HOST pseudonymization (executor.ts's appendEntityNearMissHint PRIVACY note) — a
   * resolver that names an identifier in prose must also declare it here. Omitted when the note
   * carries no identifier, or there is no note. */
  noteEntities?: Array<{
    value: string;
    kind: 'HOST' | 'IP' | 'USER' | 'URL' | 'VAL';
  }>;
}

export type ResolveParamsResult =
  | { ok: true; resolved: ResolvedToolParams }
  | {
      ok: false;
      reason: string;
      /**
       * Identifier values interpolated into `reason`, same contract as
       * `ResolvedToolParams.noteEntities`: an AMBIGUITY reason that enumerates candidate hostnames is as
       * much a wire-visible identifier disclosure as a resolved-value note is. `executor.ts`
       * pseudonymizes these before the reason becomes the tool error the provider sees. Optional -- a
       * resolver that names no identifiers omits it.
       */
      reasonEntities?: Array<{
        value: string;
        kind: 'HOST' | 'IP' | 'USER' | 'URL' | 'VAL';
      }>;
    };

/**
 * Declarative "this param resolves to whichever value is the sole live candidate" spec (the
 * generic form of issue #8913's `resolveDeicticAgentParams`; see `param-resolution.ts`'s header
 * comment for the measured prompt-vs-code result that motivates this). A tool lists one entry per
 * param it wants this treatment for in `ToolDefinition.soleCandidateParams`; `registry.ts`
 * attaches `param-resolution.ts`'s `buildGenericResolveParams` as that tool's `resolveParams` hook
 * automatically, UNLESS the tool already declares its own (get_agent_inventory keeps its
 * hand-written hook, byte-for-byte unchanged, rather than being re-declared through this).
 *
 * Two lookup sources:
 * - `manager-agents`: the active-agent list from the Manager API (`GET /agents`) -- the same
 *   source/filters `get-agents.ts` itself reads. For a param identifying one agent.
 * - `indexer-terms`: a bounded `terms` aggregation over one field of one Indexer index -- for a
 *   param whose sole-candidate universe is enumerable from the Indexer rather than the Manager
 *   API (e.g. `get_sca_checks`'s `policy_id`, enumerable via `policy.id` on `wazuh-states-sca*`).
 *   `scopedBy` narrows that aggregation to whatever value an EARLIER param in the same tool's
 *   `soleCandidateParams` array resolved to (or was already supplied as) -- params resolve in
 *   declared order specifically so this can read that value.
 *
 * `valueFrom` (only meaningful for `manager-agents`) picks which shape of the resolved agent is
 * injected: `'id'` (default) for a numeric Manager agent-id param, `'name'` for a free-text
 * agent-name param, `'id-or-name'` for a param whose schema already accepts either (the id is
 * injected -- exact and unambiguous, same precedent as `resolveAgentFilter`'s own agent_id-over-
 * agent_name preference in get-agent-inventory.ts).
 *
 * EXCLUSIONS BY DESIGN -- never give a param this treatment:
 * - an optional param whose OMISSION already has a well-defined, useful meaning of its own (e.g.
 *   `get_fim_files.agent_id`, `get_events_by_agent.agent_name`: omitted means "fleet-wide", not
 *   "unspecified and in need of resolution" -- auto-resolving it would silently narrow a
 *   deliberately fleet-wide question down to one guessed agent).
 * - a QUESTION-CONTENT param (e.g. `os_name`, `rule_tags`, `rule_titles`): these name what the
 *   caller is asking ABOUT, not which entity/scope the question is about -- there is no "sole
 *   live candidate" for an arbitrary rule tag the same way there is for "the only active agent",
 *   and auto-resolving one would silently substitute the caller's own search term.
 */
export interface SoleCandidateParamSpec {
  /** The param name on this tool's own JSON Schema (should be schema-OPTIONAL, not required --
   * see the catalog tools that declare this for the accompanying schema/description change). */
  param: string;
  source:
    | { kind: 'manager-agents' }
    | {
        kind: 'indexer-terms';
        index: string;
        field: string;
        /** Narrows the aggregation to documents whose `field` equals whatever value the named
         * earlier param resolved to (or was already supplied as). Omitted means unscoped. */
        scopedBy?: { param: string; field: string };
        /**
         * Entity kind of the values this field holds, declared so `param-resolution.ts` can hand them to
         * `ResolvedToolParams.noteEntities` / `reasonEntities` and `executor.ts`'s scrub chokepoint can
         * pseudonymize them under privacy mode. REQUIRED for any `indexer-terms` field whose values are
         * IDENTIFIERS (a hostname, an IP, a username): leaving one undeclared sends a real hostname to the
         * provider in the clear, in an assumption note or a candidate list, under privacy mode. Omit it
         * only when the values are catalog identifiers with nothing to declare (an SCA policy id).
         * `manager-agents` needs no equivalent -- that branch declares its own HOST entities
         * unconditionally.
         */
        noteEntityKind?: 'HOST' | 'IP' | 'USER' | 'URL' | 'VAL';
      };
  valueFrom?: 'id' | 'name' | 'id-or-name';
}

/**
 * A search executed against the Wazuh Indexer (`context.core.opensearch.client.asCurrentUser`).
 */
export interface IndexerRequest {
  target: 'indexer';
  index: string;
  /** Plain JS object built by a typed builder function — never string-interpolated JSON. */
  body: Record<string, unknown>;
}

/**
 * A call executed against the Wazuh Manager API (`context.wazuh_core.api.client.asCurrentUser`).
 */
export interface ManagerRequest {
  target: 'manager';
  method: string;
  path: string;
  /** Query params (GET) or body (POST/PUT/DELETE) — plain object, never string-interpolated. */
  params: Record<string, unknown>;
}

export type ToolRequest = IndexerRequest | ManagerRequest;

export interface ToolTableColumnSpec {
  /** Dot-path into a normalized result row (e.g. "wazuh.agent.name", "wazuh.rule.level"). */
  field: string;
  label: string;
  /** Marks this column for severity-badge rendering in the client's ResultTable. */
  severity?: boolean;
}

/**
 * Declarative definition of one catalog tool. One module per
 * tool under server/tools/catalog/, loaded into the registry at import time. `tier` is 'T1'
 * (read-only) for every tool by construction: mutating/destructive tools were removed by product
 * decision (what the catalog exposes is a catalog-distribution decision, not a runtime flag), so
 * the type deliberately admits no other value — a future mutating tool cannot be added without
 * consciously widening this type again.
 */
export interface ToolDefinition {
  spec: ToolSpec;
  target: 'indexer' | 'manager';
  tier: 'T1';
  /**
   * Builds the outbound request from validated params. Must construct the query as a plain JS
   * object via typed helper functions — never by interpolating values into a JSON string — so
   * the shape is injection-proof by construction. May throw a descriptive Error for parameter-level
   * problems the generic JSON Schema validator can't express (e.g. date-math format); the
   * orchestration loop turns that into a bounded tool_result error for the model to self-correct.
   */
  buildRequest(params: Record<string, unknown>): ToolRequest;
  /**
   * Opt-in async pre-`buildRequest` hook (currently only get_agent_inventory, issue #8913):
   * resolves/validates params against a live source (e.g. the Manager API's active-agent list)
   * BEFORE `buildRequest` runs, for a caller that omitted a param `buildRequest` alone has no way
   * to infer (it is purely synchronous and has no execution context). `executor.ts`'s
   * `executeToolCall` awaits this immediately after schema validation and before `buildRequest`;
   * an `{ok:false}` result short-circuits to a bounded tool-result error exactly like a
   * `buildRequest` throw, and `resolved.note` (when set) is surfaced to the model via
   * `Digest.assumptionNote`. `undefined` (every other tool) skips this step entirely — params flow
   * into `buildRequest` unchanged, byte-identical to before this hook existed. Deliberately
   * separate from `buildRequest` rather than making that async: every other catalog tool's
   * `buildRequest` stays a pure, synchronous, context-free function.
   */
  resolveParams?(
    params: Record<string, unknown>,
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
  ): Promise<ResolveParamsResult>;
  tableSpec: {
    columns: ToolTableColumnSpec[];
    /**
     * Optional dot-paths copied into each table ROW in addition to `columns`' fields — they do NOT add a visible column; they only
     * widen the row object `buildTableSpec` (digest.ts) builds, which is what the client's row
     * expander (`result-table.tsx`'s `JSON.stringify(row, ...)`) renders and what
     * `digest.sampleColumns` may additionally draw from. A field absent on a given row is simply
     * omitted (JSON-sparse), never written as `null`/`''`. `undefined` (every tool this doesn't
     * apply to) reproduces today's row shape exactly.
     */
    rowFields?: string[];
  };
  digest: {
    sampleColumns: string[];
    /**
     * Opt-in per-field truncation for sample columns whose source text is long free prose (e.g.
     * SCA's `check.rationale`/`check.remediation` — see `get-sca-checks.ts`). `digest.ts`'s
     * `truncateLongFieldValues` uses `sampleFieldMaxLength[key]` in place of the generic
     * `MAX_FIELD_VALUE_LENGTH` when a key is listed here, so a field that is routinely long can be
     * capped tighter than the shared default without lowering it for every other tool. Keys not
     * listed (or when this map itself is `undefined`, every tool but SCA) fall back to
     * `MAX_FIELD_VALUE_LENGTH` unchanged.
     */
    sampleFieldMaxLength?: Record<string, number>;
    /**
     * Opt-in (currently only the 8 finding-hits tools, via `catalog/common.ts`'s
     * `FINDING_BREAKDOWN_DIMENSIONS`): dot-paths digest.ts's `buildDigest` groups ALL returned
     * rows by (not just the `MAX_SAMPLES` slice) to synthesize a `breakdown` when the tool's own
     * result carries no real `aggregations` — i.e. the natural-language QUESTION is aggregative
     * ("which agents", "which rules") even though this tool only ever executes a plain hits
     * search. `undefined` (every other tool) reproduces today's breakdown-only-from-real-aggs
     * behavior exactly.
     *
     * Since #8870's fix, every one of these 8 tools ALSO attaches a real `terms` aggregation per
     * dimension to its own request (`catalog/common.ts`'s `FINDING_BREAKDOWN_AGGS` — OpenSearch
     * computes it over the full matched set regardless of `size`), so `buildBreakdown` normally
     * satisfies `breakdown` before this synthetic path is ever reached; this dot-path list remains
     * the fallback for whenever a real aggregation genuinely is not present, in which case
     * `buildDigest` labels the result as page-only (`Digest.breakdownNote`) rather than presenting
     * it as the population whenever `counts.truncated`.
     */
    breakdownDimensions?: string[];
  };
  /**
   * Opt-in hook for Security Analytics catalog tools (get_rules, get_threat_intel_components):
   * given the validated params and the `space` value executor.ts resolved from the executed
   * result's own `space.name` values, returns the "Open in Security Analytics" deep link for this
   * specific call (e.g. varying by `component_type` for get_threat_intel_components). `undefined`
   * (every non-Security-Analytics tool) means no such link is ever attached -- see common/types.ts's
   * `TableSpec.securityAnalyticsLink` doc comment.
   */
  buildSecurityAnalyticsLink?(
    params: Record<string, unknown>,
    space: string,
  ): { label: string; url: string } | undefined;
  /**
   * Opt-in per-kind/arbitrary-shape rendering (currently `search_wazuh_data`,
   * `find_document_by_field`, and `get_agent_inventory`): when true, `tableSpec.columns` and
   * `digest.sampleColumns` above are ignored (kept as `[]` for type validity — no per-tool schema
   * exists to declare them statically) and digest.ts derives columns per-response instead: from the
   * request's `_source` list, else a capped union of the sample rows' flattened dot-paths. Every
   * other catalog tool leaves this unset, so their static-column path in digest.ts is untouched.
   *
   * This flag is ONLY about how columns are computed for the table/digest shape — it says nothing
   * about how RISKY the tool's field surface is for privacy purposes. See `failClosedFieldPolicy`
   * below, which used to be silently derived from this one (issue #8917) and must be set
   * independently.
   */
  deriveColumns?: boolean;
  /**
   * Privacy-mode field-policy default for a field with NO `FIELD_POLICY_DEFAULTS` entry (issue
   * #8917): `true` fails closed (server/tools/privacy.ts's `applyFieldPolicy`, this file's
   * `isEscapeHatch` argument) pseudonymizes an unlisted string field, kind inferred from its name)
   * instead of the normal allow-by-omission default every other typed tool gets. `undefined`/
   * `false` (the default) reproduces today's allow-by-omission behavior.
   *
   * Deliberately a SEPARATE flag from `deriveColumns` above, not derived from it. Before #8917
   * this was `def.deriveColumns` itself, threaded straight into `applyFieldPolicy`'s
   * `isEscapeHatch` argument at executor.ts's call site — which conflated two unrelated
   * questions: "does this tool need per-response column derivation" and "can this tool's fields
   * be an arbitrary, uncurated set that must fail closed by default". `get_agent_inventory` needs
   * `deriveColumns: true` purely because one `ToolDefinition` cannot declare a single static
   * column list that is correct for its 5 different `kind`s — but each kind's field list is
   * itself small, fixed, and fully reviewed (`INVENTORY_KIND_CONFIG` in
   * catalog/get-agent-inventory.ts), unlike `search_wazuh_data`'s genuinely arbitrary
   * caller-supplied DSL. Both still set this to `true` today (every field either tool can surface
   * needs an explicit, reviewed `FIELD_POLICY_DEFAULTS` entry or it fails closed) — the point of
   * splitting the flag is that a FUTURE `deriveColumns` tool with a truly bounded/curated field
   * set is no longer forced into fail-closed just by needing per-kind column derivation, and a
   * future risky tool that does NOT need column derivation can still opt into fail-closed. Set
   * explicitly per tool; never inferred.
   */
  failClosedFieldPolicy?: boolean;
  /**
   * Opt-in (currently only `search_wazuh_data`): when true, executor.ts's `executeIndexerRequest`
   * validates every field name it can extract from the executed body against the target index
   * pattern's live mapping (server/tools/field-validation.ts) before the request reaches
   * OpenSearch, throwing a bounded, self-correctable tool error for an invented field name instead
   * of letting OpenSearch silently return zero matches/buckets. Gated per-tool rather than global:
   * a typed catalog tool builds its field paths from `common/wazuh-fields.ts` constants, so it
   * cannot guess one wrong, and would pay a `_field_caps` round trip on every call for no benefit.
   */
  validateFieldNames?: boolean;
  /**
   * Declarative sole-candidate resolution (see `SoleCandidateParamSpec`'s doc comment above for
   * the full contract and the exclusions-by-design list). When set and this tool declares no
   * hand-written `resolveParams` of its own, `registry.ts` attaches
   * `param-resolution.ts`'s `buildGenericResolveParams(this)` as `resolveParams` at load time --
   * every param listed here resolves against a live source before `buildRequest` runs, in
   * declared order. `undefined` (every tool that doesn't need this) is unaffected either way.
   */
  soleCandidateParams?: SoleCandidateParamSpec[];
  /**
   * Cost-budget class for chat.ts's tool-round COST budget (workstream C, the fixed-3-round ->
   * cost-unit redesign; see chat.ts's `BASE_BUDGET_UNITS` doc comment for the calibration this
   * scale is measured against). A deliberately explicit, per-tool, testable classification instead
   * of guessing a cost from request shape at call time:
   *   1 = aggregation-only request -- a top-level `size: 0` body whose ONLY output is
   *       aggregation buckets, no hit documents (e.g. get_top_rules, get_top_agents,
   *       get_security_summary, get_mitre_summary, get_compliance_summary, get_sca_results,
   *       get_field_values -- every one of these builds its Indexer request with `size: 0`).
   *       Cheapest class: bounded bucket counts, no per-hit fetch cost.
   *   2 = DEFAULT (used whenever this field is omitted) -- a filtered/typed hits search: every
   *       ordinary catalog tool that returns actual matched documents (get_agents,
   *       get_critical_findings, search_findings_by_agent, get_vulnerabilities*, get_fim_files,
   *       get_sca_checks, get_agent_inventory, get_rules, ... -- the broad middle of the catalog).
   *   3 = escape-hatch / free DSL (search_wazuh_data ONLY) -- unconstrained caller-authored query
   *       shape, the heaviest and least-bounded request this catalog can issue.
   * `undefined` on every tool that doesn't set it explicitly resolves to 2 via
   * registry.ts's `getToolCostClass` -- adding a brand-new tool with no opinion on this field costs
   * the ordinary default, never silently free (1) or silently the escape-hatch weight (3).
   *
   * Deliberately NOT read from `ToolSpec` (common/types.ts): this is server-side orchestration
   * bookkeeping the model is never shown, not part of the wire tool schema every adapter forwards
   * to the provider.
   */
  costClass?: 1 | 2 | 3;
}
