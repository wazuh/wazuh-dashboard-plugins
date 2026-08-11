import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../src/core/server';
import { StreamEvent, ToolCall } from '../../common/types';
import { describeError } from '../../common/errors';
import { validate } from './schema-validator';
import { getToolDefinition } from './registry';
import {
  applySafetyValves,
  checkIndexAllowlist,
  clampManagerParams,
  lintDsl,
} from './guardrails';
import { buildDigest, buildTableSpec, capDigest, Digest } from './digest';
import { validateQueryFields } from './field-validation';
import { IndexerRequest, ManagerRequest, ToolDefinition } from './types';
import {
  AggFieldSpec,
  applyFieldPolicy,
  extractAggFields,
  FieldPolicyEntry,
  Pseudonymizer,
} from './privacy';
import { resolveApiHostId } from './api-host';

export interface ToolExecutionOutcome {
  /** JSON-serialized digest (or `{error}`) — becomes the `role:'tool'` message content. */
  toolResultContent: string;
  tableEvent?: Extract<StreamEvent, { type: 'table' }>;
}

/**
 * Privacy mode context, threaded in only when server/routes/chat.ts has resolved
 * privacy as enabled for this turn. `undefined` (the default, every existing call site) means
 * "privacy off" and reproduces today's behavior exactly — `buildDigest`'s output is serialized
 * as-is, with no policy pass in between.
 */
export interface PrivacyContext {
  pseudonymizer: Pseudonymizer;
  fieldPolicy: FieldPolicyEntry[];
}

/** Applies field policy to a digest (when `privacy` is given) immediately before it is
 * serialized, then re-runs the hard cap (pseudonym substitution can change the digest's
 * serialized length — see digest.ts's `capDigest` doc comment). A no-op passthrough when
 * `privacy` is undefined, so privacy-off output is byte-identical to before this existed. */
function finalizeDigest(
  digest: Digest,
  privacy: PrivacyContext | undefined,
  toolName: string,
  aggFields?: Record<string, AggFieldSpec | undefined>,
  // Issue #8917: this used to be the calling tool's `deriveColumns` flag, which conflated "needs
  // per-response column derivation" with "field surface is uncurated enough to fail closed by
  // default" — see `ToolDefinition.failClosedFieldPolicy`'s doc comment (types.ts) for why the two
  // are now separate. A tool whose fields can be ARBITRARY (search_wazuh_data,
  // find_document_by_field) or that folds several kinds' worth of fields into one digest
  // (get_agent_inventory) sets this so its unlisted-field default is fail-closed (anonymize)
  // instead of the curated typed tools' allow-by-omission — see privacy.ts's applyFieldPolicy.
  isEscapeHatch = false,
): Digest {
  if (!privacy) {
    return digest;
  }
  return capDigest(
    applyFieldPolicy(
      digest,
      privacy.fieldPolicy,
      privacy.pseudonymizer,
      aggFields,
      toolName,
      isEscapeHatch,
    ),
  );
}

function toolErrorContent(reason: string): string {
  return JSON.stringify({ error: reason });
}

/**
 * Sanitizes an error before it can reach the model: strips stack traces (first line only) and any
 * credentials embedded in a URL (`scheme://user:pass@host` -> `scheme://host`), and caps length.
 * Applied to every execution failure below — never forward a raw Error.message or stack.
 */
function sanitizeError(error: unknown): string {
  const raw = describeError(error);
  const firstLine = raw.split('\n')[0];
  const withoutCredentials = firstLine.replace(
    /(:\/\/)[^/\s@]+:[^/\s@]+@/g,
    '$1',
  );
  return withoutCredentials.length > 300
    ? `${withoutCredentials.slice(0, 300)}…`
    : withoutCredentials;
}

/** Wazuh's own default space (the one namespace present on 4.14-migrated content, and the only one
 * `AskUserQuestion`-confirmed choice for when a result's rows don't share a single space). */
const DEFAULT_SECURITY_ANALYTICS_SPACE = 'standard';

/**
 * Resolves the single `space` value to use for a `buildSecurityAnalyticsLink` deep link, from the
 * `space.name` field on each returned hit (Security Analytics content is namespaced across
 * draft/test/custom/standard, confirmed live). A tool call's rows can span more than one space --
 * there is no per-row link in this UI, only one per table -- so this only trusts a SINGLE distinct
 * value found across all hits; zero or multiple distinct values (no hits, or a genuinely mixed
 * result) falls back to `DEFAULT_SECURITY_ANALYTICS_SPACE` rather than guess which row's space the
 * link should represent (explicit product decision, not a heuristic first-row pick).
 */
export function resolveSecurityAnalyticsSpace(hits: unknown): string {
  if (!Array.isArray(hits)) {
    return DEFAULT_SECURITY_ANALYTICS_SPACE;
  }
  const spaces = new Set<string>();
  for (const hit of hits) {
    const space = (hit as { _source?: { space?: { name?: unknown } } })?._source
      ?.space?.name;
    if (typeof space === 'string' && space.length > 0) {
      spaces.add(space);
    }
  }
  return spaces.size === 1 ? [...spaces][0] : DEFAULT_SECURITY_ANALYTICS_SPACE;
}

/** Executes a validated, guardrail-passed Indexer search and builds its digest + table. */
async function executeIndexerRequest(
  toolName: string,
  indexerRequest: IndexerRequest,
  params: Record<string, unknown>,
  context: RequestHandlerContext,
  privacy?: PrivacyContext,
): Promise<ToolExecutionOutcome> {
  const allowlistCheck = checkIndexAllowlist(indexerRequest.index);
  if (!allowlistCheck.ok) {
    return { toolResultContent: toolErrorContent(allowlistCheck.reason) };
  }

  // guardrails.ts's own MAX_TREE_DEPTH guard should already turn a pathological deeply-nested body
  // into a clean {ok:false} rejection before either function recurses. This try/catch is defense in
  // depth: applySafetyValves and lintDsl walk the tree recursively, and an uncaught exception from
  // either would become an unhandled rejection, contradicting executeToolCall's documented "never
  // throws" contract. Nothing from the guardrail stage may escape uncaught.
  let body: Record<string, unknown>;
  try {
    const valved = applySafetyValves(indexerRequest.body);
    if (!valved.ok) {
      return { toolResultContent: toolErrorContent(valved.reason) };
    }

    // The vulnerability-field-on-findings-index check in guardrails.ts's lintDsl has no per-tool
    // exemptions (the 4.14 get_solved_vulnerabilities carve-out was retired in the 5.0 port).
    const lintResult = lintDsl(valved.body, indexerRequest.index);
    if (!lintResult.ok) {
      return { toolResultContent: toolErrorContent(lintResult.reason) };
    }
    body = valved.body;
  } catch (error) {
    return {
      toolResultContent: toolErrorContent(
        `Query rejected: ${sanitizeError(error)}`,
      ),
    };
  }

  const def = getToolDefinition(toolName);
  if (!def) {
    // Guarded by the caller (unknown tool names are rejected before we get here); kept for safety.
    return {
      toolResultContent: toolErrorContent(`Unknown tool "${toolName}".`),
    };
  }

  // Escape-hatch-only field-existence check (see field-validation.ts / ToolDefinition's
  // `validateFieldNames` doc comment): runs AFTER the synchronous guardrails above (so a
  // structurally-rejected body never pays the `_field_caps` round trip) and BEFORE the request
  // actually reaches OpenSearch — a made-up field name becomes a bounded, self-correctable tool
  // error instead of a silent zero-row/zero-bucket result.
  if (def.validateFieldNames) {
    const fieldCheck = await validateQueryFields(
      context,
      indexerRequest.index,
      body,
    );
    if (!fieldCheck.ok) {
      return { toolResultContent: toolErrorContent(fieldCheck.reason) };
    }
  }

  try {
    const response = await context.core.opensearch.client.asCurrentUser.search({
      index: indexerRequest.index,
      body,
    });
    const result = response.body;
    // `body` (the guardrail-clamped executed body) is threaded through so `deriveColumns`
    // tools (the search_wazuh_data escape hatch) can read its `_source` list — see digest.ts.
    // Static-column tools ignore the extra argument entirely. It is ALSO the only place the
    // aggregation fields driving `breakdown` (if any) can be read from — see privacy.ts's
    // `extractAggFields` doc comment — so it is reused for that below when privacy is active.
    const digest = buildDigest(toolName, result, def, body);
    // A `breakdownDimensions`-opted-in tool's synthesized breakdown (digest.ts's
    // `buildSyntheticBreakdown`) tags each bucket `agg: <dimension field path>` — a map from each
    // dimension to a SCALAR `AggFieldSpec` naming that same field (a synthesized breakdown is
    // always one bucket key per dimension, never multi/composite — each dimension in
    // `breakdownDimensions` is independent) lets `applyFieldPolicy` below resolve those buckets'
    // field policy the exact same way it resolves a REAL aggregation's buckets, rather than
    // silently skipping the scrub because `extractAggFields(body)` (which only ever reads a REAL
    // `aggs` clause) has nothing to report for a tool — every one of these — that never sends one.
    // NOTE: every current `breakdownDimensions` tool (the 8 finding-hits tools in
    // catalog/common.ts) ALSO unconditionally attaches a real `aggs` clause
    // (`FINDING_BREAKDOWN_AGGS`), so `extractAggFields(body)` always resolves first in practice and
    // this fallback is not exercised today — kept as the documented, type-correct contract for any
    // future tool that opts into `breakdownDimensions` without a matching real `aggs` clause. A
    // bare `{dimension: dimension}` STRING identity map here does not satisfy
    // `Record<string, AggFieldSpec | undefined>` and is a type error the moment this fallback is
    // actually live.
    const aggFields: Record<string, AggFieldSpec | undefined> | undefined =
      extractAggFields(body) ??
      (def.digest.breakdownDimensions
        ? Object.fromEntries(
            def.digest.breakdownDimensions.map(
              (dimension): [string, AggFieldSpec] => [
                dimension,
                { kind: 'scalar', field: dimension },
              ],
            ),
          )
        : undefined);
    const finalDigest = finalizeDigest(
      digest,
      privacy,
      toolName,
      aggFields,
      // Issue #8917: was `def.deriveColumns` -- see `ToolDefinition.failClosedFieldPolicy`'s doc
      // comment (types.ts) for why this must be its own, explicitly-set flag instead.
      def.failClosedFieldPolicy,
    );
    // "Open in Discover" support (common/types.ts's `TableSpec.discover` doc comment): only this
    // Indexer path has an index/DSL to attach — `body.query` is the guardrail-clamped clause that
    // actually ran, falling back to `match_all` for a query-less body (matches this same result set).
    const tableSpec = buildTableSpec(result, def, body);
    tableSpec.discover = {
      index: indexerRequest.index,
      dsl: (body.query as Record<string, unknown>) ?? { match_all: {} },
    };
    if (def.buildSecurityAnalyticsLink) {
      const space = resolveSecurityAnalyticsSpace(
        (result as { hits?: { hits?: unknown } })?.hits?.hits,
      );
      const link = def.buildSecurityAnalyticsLink(params, space);
      if (link) {
        tableSpec.securityAnalyticsLink = link;
      }
    }
    return {
      // The `table` event built from `result` below is deliberately NOT run through field policy:
      // it renders locally in the browser and never reaches the model. That holds for EVERY action,
      // 'never' included — the policy's only boundary is the digest above, and the table shows the
      // analyst their own data in full (issue #8821; see privacy.ts's module header). The same is
      // true of the executed `body`: no action rewrites its projections, so the field is retrieved
      // and therefore displayable.
      toolResultContent: JSON.stringify(finalDigest),
      tableEvent: { type: 'table', spec: tableSpec },
    };
  } catch (error) {
    return {
      toolResultContent: toolErrorContent(
        `Indexer query failed: ${sanitizeError(error)}`,
      ),
    };
  }
}

/** Executes a validated Manager API call and builds its digest + table. */
async function executeManagerRequest(
  toolName: string,
  managerRequest: ManagerRequest,
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest,
  privacy?: PrivacyContext,
): Promise<ToolExecutionOutcome> {
  const def = getToolDefinition(toolName);
  if (!def) {
    return {
      toolResultContent: toolErrorContent(`Unknown tool "${toolName}".`),
    };
  }

  const clampedParams = clampManagerParams(managerRequest.params);

  try {
    const apiHostID = await resolveApiHostId(context, request);
    // wazuh-core's request builder destructures its `data` argument as {body, params, headers}:
    // only `data.params` reaches the query string, and anything else would be sent as a GET body
    // the Manager API ignores (verified in server-api-client.ts::_buildRequestOptions against
    // v4.14.6, re-confirmed unchanged in the 5.0.0-beta3 reference (wdp-5)).
    const data =
      managerRequest.method === 'GET'
        ? { params: clampedParams }
        : { body: clampedParams };
    const response = await context.wazuh_core.api.client.asCurrentUser.request(
      managerRequest.method,
      managerRequest.path,
      data,
      { apiHostID },
    );
    const result = response.data;
    // Manager API list responses have no aggregation concept, so there is no `aggField` to pass.
    const digest = buildDigest(toolName, result, def);
    const finalDigest = finalizeDigest(digest, privacy, toolName);
    return {
      toolResultContent: JSON.stringify(finalDigest),
      tableEvent: { type: 'table', spec: buildTableSpec(result, def) },
    };
  } catch (error) {
    return {
      toolResultContent: toolErrorContent(mapManagerError(error)),
    };
  }
}

/**
 * Turns a Manager-request failure into a tool-result message the model can act on correctly.
 * A 401/403 almost always means the dashboard session's `wz-token` cookie is missing or expired
 * (verified against a live stack: an OSD session with no `/api/login` step makes every Manager tool
 * return 401, which the model otherwise paraphrases as "wrong credentials" and retries pointlessly).
 * We surface a specific, actionable, terminal message instead — telling the user to reload/re-login
 * and telling the model plainly that retrying will not help — and make clear nothing was changed.
 * Any other failure keeps the generic sanitized form.
 */
function mapManagerError(error: unknown): string {
  const detail = sanitizeError(error);
  if (/\b(401|403|unauthor|forbidden|token)\b/i.test(detail)) {
    return (
      'Wazuh Manager authentication failed (the dashboard session token is missing or expired). ' +
      'Nothing was changed. Tell the user to reload the page and sign in again; do not retry this ' +
      `tool — it will keep failing until the session is refreshed. (detail: ${detail})`
    );
  }
  return `Manager request failed: ${detail}`;
}

export interface BuiltToolCall {
  def: ToolDefinition;
  /** Schema-validated (coerced/defaulted) params — the same shape `def.buildRequest` consumed. */
  params: Record<string, unknown>;
  request: IndexerRequest | ManagerRequest;
}

export type BuildValidatedRequestResult =
  | { ok: true; built: BuiltToolCall }
  | { ok: false; toolResultContent: string };

/**
 * Validates a model-issued tool call's arguments and builds its outbound request, WITHOUT
 * executing anything. Kept separate from `executeToolCall` below so validation/build failures
 * resolve to a bounded tool-result error the model can self-correct from.
 */
export function buildValidatedRequest(
  call: ToolCall,
): BuildValidatedRequestResult {
  const def = getToolDefinition(call.name);
  if (!def) {
    return {
      ok: false,
      toolResultContent: toolErrorContent(`Unknown tool "${call.name}".`),
    };
  }

  const validation = validate(call.arguments, def.spec.parameters);
  if (!validation.ok) {
    return {
      ok: false,
      toolResultContent: toolErrorContent(
        `Invalid arguments: ${validation.errors.join('; ')}`,
      ),
    };
  }

  let builtRequest: IndexerRequest | ManagerRequest;
  try {
    builtRequest = def.buildRequest(validation.value);
  } catch (error) {
    return {
      ok: false,
      toolResultContent: toolErrorContent(sanitizeError(error)),
    };
  }

  return {
    ok: true,
    built: { def, params: validation.value, request: builtRequest },
  };
}

/**
 * Validates, guardrails, and executes one model-issued tool call end to end. Never throws: every
 * failure mode (unknown tool, schema validation, guardrail rejection, execution error) resolves to
 * a `toolErrorContent` string so the orchestration loop can always append a `role:'tool'` message
 * and continue — bounded self-correction, never a crashed turn. The catalog is read-only by
 * construction (types.ts's `tier: 'T1'`), so there is no confirmation/tier gate here.
 */
export function executeToolCall(
  call: ToolCall,
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest,
  privacy?: PrivacyContext,
): Promise<ToolExecutionOutcome> {
  const built = buildValidatedRequest(call);
  if (!built.ok) {
    return Promise.resolve({ toolResultContent: built.toolResultContent });
  }
  const { request: builtRequest, params } = built.built;

  if (builtRequest.target === 'indexer') {
    return executeIndexerRequest(
      call.name,
      builtRequest,
      params,
      context,
      privacy,
    );
  }
  return executeManagerRequest(
    call.name,
    builtRequest,
    context,
    request,
    privacy,
  );
}
