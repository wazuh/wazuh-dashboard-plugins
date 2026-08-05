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
  digest: { sampleColumns: string[] };
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
   * Opt-in escape hatch (currently only `search_wazuh_data`): when true, `tableSpec.columns` and
   * `digest.sampleColumns` above are ignored (kept as `[]` for type validity — no per-tool schema
   * exists to declare them statically) and digest.ts derives columns per-response instead: from the
   * request's `_source` list, else a capped union of the sample rows' flattened dot-paths. Every
   * other catalog tool leaves this unset, so their static-column path in digest.ts is untouched.
   */
  deriveColumns?: boolean;
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
