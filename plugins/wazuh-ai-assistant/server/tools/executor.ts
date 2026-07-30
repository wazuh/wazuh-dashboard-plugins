import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../src/core/server';
import { StreamEvent, TableSpec, ToolCall } from '../../common/types';
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
import { IndexerRequest, ManagerRequest, ToolDefinition } from './types';
import {
  applyFieldPolicy,
  applyProjectionPolicy,
  applyTablePolicy,
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
  aggFields?: Record<string, string | undefined>,
  // The escape hatch's deriveColumns can put ARBITRARY finding fields into
  // the digest, so its unlisted-field default must be fail-closed (anonymize) instead of the
  // curated typed tools' allow-by-omission — see privacy.ts's applyFieldPolicy.
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

/**
 * Applies the display half of the field policy to a `table` StreamEvent's spec (when `privacy` is
 * given): 'never' fields are dropped from its columns and rows. 'anonymize' fields keep their real
 * values on purpose — the table renders locally and never reaches the provider, and the pseudonym
 * map is reversible (see privacy.ts's module header). A no-op passthrough when `privacy` is
 * undefined, so privacy-off tables are byte-identical to before this existed.
 */
function finalizeTable(
  spec: TableSpec,
  privacy: PrivacyContext | undefined,
  toolName: string,
  aggFields?: Record<string, string | undefined>,
): TableSpec {
  if (!privacy) {
    return spec;
  }
  return applyTablePolicy(spec, privacy.fieldPolicy, toolName, aggFields);
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

/** Executes a validated, guardrail-passed Indexer search and builds its digest + table. */
async function executeIndexerRequest(
  toolName: string,
  indexerRequest: IndexerRequest,
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

  // Retrieval half of the 'never' action: strip never-send fields from the body's
  // projections BEFORE it is executed, so those values are never fetched from the indexer instead of
  // being fetched and dropped afterwards. Done here, on the already guardrail-clamped body, so the
  // executed body is the same one every downstream consumer sees — `deriveColumns`, `extractAggFields`
  // and the "Open in Discover" DSL all read `body` below. A no-op passthrough (same reference) when
  // privacy is off or the policy has no applicable 'never' entry.
  if (privacy) {
    body = applyProjectionPolicy(body, privacy.fieldPolicy, toolName);
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
    const aggFields = extractAggFields(body);
    const digest = buildDigest(toolName, result, def, body);
    const finalDigest = finalizeDigest(
      digest,
      privacy,
      toolName,
      aggFields,
      def.deriveColumns,
    );
    // "Open in Discover" support (common/types.ts's `TableSpec.discover` doc comment): only this
    // Indexer path has an index/DSL to attach — `body.query` is the guardrail-clamped clause that
    // actually ran, falling back to `match_all` for a query-less body (matches this same result set).
    const tableSpec = finalizeTable(
      buildTableSpec(result, def, body),
      privacy,
      toolName,
      aggFields,
    );
    tableSpec.discover = {
      index: indexerRequest.index,
      dsl: (body.query as Record<string, unknown>) ?? { match_all: {} },
    };
    return {
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
      tableEvent: {
        type: 'table',
        // Manager tools carry bare, tool-scoped field names ("name", "ip"), so the table pass needs
        // the same `toolName` scoping the digest pass uses. No `aggFields`: Manager responses have
        // no aggregation concept.
        spec: finalizeTable(buildTableSpec(result, def), privacy, toolName),
      },
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
  { ok: true; built: BuiltToolCall } | { ok: false; toolResultContent: string };

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
  const { request: builtRequest } = built.built;

  if (builtRequest.target === 'indexer') {
    return executeIndexerRequest(call.name, builtRequest, context, privacy);
  }
  return executeManagerRequest(
    call.name,
    builtRequest,
    context,
    request,
    privacy,
  );
}
