import { ToolSpec } from '../../common/types';

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
}
