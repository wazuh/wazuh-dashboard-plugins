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
  MAX_AGG_SIZE,
  requiresBoundedTimeRange,
} from './guardrails';
import { buildDigest, buildTableSpec, capDigest, Digest } from './digest';
import { validateQueryFields } from './field-validation';
import { IndexerRequest, ManagerRequest, ToolDefinition } from './types';
import {
  applyFieldPolicy,
  extractAggFields,
  FieldPolicyEntry,
  Pseudonymizer,
} from './privacy';
import { resolveApiHostId } from './api-host';
import { findTimestampRange, widenToDefaultWindow } from './window-recount';
import {
  buildNearMissIncludePattern,
  extractRequestedAgentNames,
  findNearMissSiblings,
} from './entity-resolution';
import { rollUpTechniqueIdFilters } from './technique-rollup';
import {
  DEFAULT_TIME_RANGE_GTE,
  DEFAULT_TIME_RANGE_LTE,
} from './catalog/common';

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

/**
 * Narrowed-window zero-row disclosure (issue #8920 item 3 -- see window-recount.ts's header comment
 * for the class-level reasoning). Fires only when the tool call itself returned 0 rows: mutates
 * `digest.hint` in place, appending to whatever `buildZeroRowHint` (digest.ts) already set rather
 * than replacing it, so a 0-row/2+-filter result gets BOTH disclosures rather than one clobbering
 * the other. `body` is the EXECUTED (guardrail-clamped) body, not the tool's own params -- this is
 * what makes the guarantee a chokepoint one: every time-based typed tool AND the search_wazuh_data
 * escape hatch share this call site with no per-tool opt-in. Any failure (no widenable range, the
 * widened query itself failing a guardrail it shouldn't be able to, the second search erroring)
 * degrades silently -- a failed disclosure attempt must never turn an otherwise-successful tool
 * call into an error.
 */
async function appendWindowRecountHint(
  digest: Digest,
  body: Record<string, unknown>,
  index: string,
  context: RequestHandlerContext,
): Promise<void> {
  try {
    const widened = widenToDefaultWindow(body);
    if (!widened) {
      return;
    }
    const valved = applySafetyValves(widened);
    if (!valved.ok) {
      return;
    }
    const lint = lintDsl(valved.body, index);
    if (!lint.ok) {
      return;
    }
    const response = await context.core.opensearch.client.asCurrentUser.search({
      index,
      body: valved.body,
    });
    const totals = (
      response.body as
        | { hits?: { total?: { value?: number; relation?: string } } }
        | undefined
    )?.hits?.total;
    const total = totals?.value;
    if (typeof total !== 'number' || total <= 0) {
      return;
    }
    // applySafetyValves unconditionally clamps track_total_hits to MAX_TRACK_TOTAL_HITS (10000),
    // so on any window with more matches than that the recount reports value=10000 with
    // relation:'gte'. Stating that as an exact figure would be a fabricated count in the one
    // feature that exists to stop counts being misstated -- word it "at least N" instead.
    const totalDescription =
      totals?.relation === 'gte' ? `at least ${total}` : `${total}`;
    // lintDsl accepts gt/lt bounds too ("a lower bound (gte or gt) and an upper bound (lte or
    // lt)"), so read whichever bound shape the executed clause actually used. If neither bound
    // of a side is readable, emit NO hint rather than printing the default window as if it were
    // the queried one -- a self-contradictory sentence ("0 rows in now-90d..now; N rows in
    // now-90d..now") is worse than silence.
    const range = findTimestampRange(body);
    const lower = range?.gte ?? (range as { gt?: unknown } | undefined)?.gt;
    const upper = range?.lte ?? (range as { lt?: unknown } | undefined)?.lt;
    if (lower === undefined || upper === undefined) {
      return;
    }
    const hint =
      `0 rows in the queried window (${String(lower)} to ${String(upper)}); ` +
      `${totalDescription} rows match in the default window (${DEFAULT_TIME_RANGE_GTE} to ` +
      `${DEFAULT_TIME_RANGE_LTE}). State that the empty result is for the narrower window ` +
      'only -- never claim overall absence from it.';
    digest.hint = digest.hint ? `${digest.hint} ${hint}` : hint;
  } catch {
    // Recount failure degrades silently -- see this function's own header comment.
  }
}

/**
 * No-silent-entity-substitution disclosure (issue #8920 item 6 -- see entity-resolution.ts's header
 * comment for the class-level reasoning). Fires whenever the validated params named at least one
 * agent (`agent_name`/`agent_names`), REGARDLESS of whether the tool call itself returned rows --
 * unlike `appendWindowRecountHint` above, a near-miss with data is exactly as worth disclosing as a
 * near-miss with none (see entity-resolution.ts's `findNearMissSiblings` doc comment). Issues ONE
 * extra bounded search against the SAME index: a `size:0` terms aggregation over
 * `wazuh.agent.name`, restricted by an `include` pattern derived from the requested names (see
 * buildNearMissIncludePattern -- this is what keeps the probe correct on fleets larger than the
 * agg size), issued ALWAYS rangeless -- never scoped to the executed body's `@timestamp` range,
 * even when the body has one. Agent-name EXISTENCE is not time-scoped: a conversation narrowed to
 * "the last 24 hours" (see window-recount.ts) can leave a sibling's only document outside that
 * window, and a range-scoped probe would then find zero buckets and silently drop the disclosure
 * while the answer still reports the wrong host's data. A rangeless probe on a states index (no
 * event-time axis; lintDsl requires no bound there) is the same shape, one case earlier -- this
 * extends that precedent to every index. Any failure degrades silently, same as the recount above.
 *
 * PRIVACY: each agent name embedded in the hint text (both the requested name and its siblings) is
 * run through `privacy.pseudonymizer.pseudonymize(name, 'HOST')` before interpolation when privacy
 * mode is active. This is NOT redundant with `applyFieldPolicy` or the outbound `prescanAndMint`
 * text scrub: `applyFieldPolicy` only ever touches `samples`/`breakdown`/`message`, never `hint`
 * (digest.ts's `Digest.hint` is intentionally left untouched by that pass -- see privacy.ts's
 * `applyFieldPolicy` doc comment), and `prescanAndMint`'s later whole-text scrub in chat.ts
 * deliberately never matches a BARE single-word hostname (privacy.ts:562-566's documented
 * limitation) -- which is exactly the shape an agent name usually has. Without this explicit
 * pseudonymization step, a hostname minted here would reach the provider in the clear under privacy
 * mode.
 */
/** Bounds for the near-miss disclosure (see appendEntityNearMissHint): how many requested names
 * are probed, how many near-miss sentences are emitted, and how many siblings each sentence
 * names. Together with capDigest's hint-length cap these keep an unbounded `agent_names` array
 * (no maxItems in its schema) from inflating the hint until it evicts the digest's actual data. */
const MAX_NEAR_MISS_NAMES = 5;
const MAX_NEAR_MISS_SENTENCES = 3;
const MAX_NEAR_MISS_SIBLINGS = 3;

/** Matches a dotted MITRE sub-technique id ("T1059.001") as a breakdown bucket key. */
const SUB_TECHNIQUE_KEY_RE = /^T\d+\.\d+$/;

/**
 * Sub-technique split disclosure, the aggregation-side companion of technique-rollup.ts (issue
 * #8920 item 2): any digest whose breakdown buckets technique ids per EXACT id (get_mitre_summary,
 * get_mitre_findings' technique_ids agg, an escape-hatch terms agg on the same field) presents
 * "T1059: 3" and "T1059.001: 9" as two unrelated rows -- nothing tells the model a parent bucket
 * does NOT include its children, so technique-level totals get under-reported from the parent
 * bucket alone. Appending the rule as data (a hint) whenever a sub-technique-shaped key is
 * present makes the semantics mechanical for every current and future tool whose breakdown
 * carries technique ids -- no per-tool wiring, and a no-op for every other digest. Static text:
 * carries no indexed values, so it needs no privacy handling.
 */
function appendSubTechniqueSplitHint(digest: Digest): void {
  const keys = digest.breakdown?.map(bucket => bucket.key) ?? [];
  if (!keys.some(key => SUB_TECHNIQUE_KEY_RE.test(key))) {
    return;
  }
  const hint =
    'Technique counts are per EXACT id: a parent technique bucket (e.g. T1059) does NOT ' +
    'include its sub-techniques (T1059.001, ...). Sum parent and sub-technique buckets for ' +
    'technique-level totals.';
  digest.hint = digest.hint ? `${digest.hint} ${hint}` : hint;
}

async function appendEntityNearMissHint(
  digest: Digest,
  params: Record<string, unknown>,
  index: string,
  context: RequestHandlerContext,
  privacy: PrivacyContext | undefined,
): Promise<void> {
  const requestedNames = extractRequestedAgentNames(params).slice(
    0,
    MAX_NEAR_MISS_NAMES,
  );
  if (requestedNames.length === 0) {
    return;
  }
  try {
    const includePattern = buildNearMissIncludePattern(requestedNames);
    if (!includePattern) {
      return;
    }
    // Deliberately NEVER copies the executed body's own @timestamp range (contrast
    // appendWindowRecountHint above, which intentionally widens within the same time axis).
    // Agent-name existence has no time axis: a sibling can have exactly one document, ingested
    // outside whatever window the current turn inherited, and this probe must still find it.
    //
    // It cannot be rangeless either, though: `lintDsl` REQUIRES a both-sides-bounded @timestamp
    // range on the events/findings families and rejects the body otherwise — and the `!lint.ok`
    // early return below swallows that rejection silently, so a rangeless probe made the whole
    // disclosure vanish rather than error. So: the WIDEST window the guardrails allow (their span
    // cap is 90 days) on a time-based index, and genuinely rangeless on `wazuh-states-*`, which is
    // exempt because a state snapshot has no event-time axis at all.
    //
    // Residual, and it is the guardrails' ceiling rather than a choice here: a sibling whose only
    // document is older than the 90-day cap is still invisible to this probe — the same bound every
    // findings query in the product carries.
    const probeFilter: Record<string, unknown>[] = requiresBoundedTimeRange(
      index,
    )
      ? [
          {
            range: {
              '@timestamp': {
                gte: DEFAULT_TIME_RANGE_GTE,
                lte: DEFAULT_TIME_RANGE_LTE,
              },
            },
          },
        ]
      : [{ match_all: {} }];
    const probeBody: Record<string, unknown> = {
      query: {
        bool: {
          filter: probeFilter,
        },
      },
      size: 0,
      aggs: {
        agent_names: {
          // `include` (a Lucene regexp derived from the requested names' normalized forms --
          // see buildNearMissIncludePattern) is what makes this POPULATION-INDEPENDENT: a plain
          // top-N terms agg only surfaces the N busiest agents, so a quiet sibling (the reported
          // wazuh-aio-05 has ONE finding) never appears on any fleet larger than the agg size.
          // With the include filter, only normalization-candidate names come back at all, so
          // MAX_AGG_SIZE bounds nothing real.
          terms: {
            field: 'wazuh.agent.name',
            size: MAX_AGG_SIZE,
            include: includePattern,
          },
        },
      },
      track_total_hits: false,
    };
    const valved = applySafetyValves(probeBody);
    if (!valved.ok) {
      return;
    }
    const lint = lintDsl(valved.body, index);
    if (!lint.ok) {
      return;
    }
    const response = await context.core.opensearch.client.asCurrentUser.search({
      index,
      body: valved.body,
    });
    const buckets = (
      response.body as
        | {
            aggregations?: { agent_names?: { buckets?: unknown } };
          }
        | undefined
    )?.aggregations?.agent_names?.buckets;
    if (!Array.isArray(buckets)) {
      return;
    }
    const indexedNames = buckets
      .map(bucket => (bucket as { key?: unknown })?.key)
      .filter((key): key is string => typeof key === 'string');
    const nearMisses = findNearMissSiblings(requestedNames, indexedNames);
    if (nearMisses.length === 0) {
      return;
    }
    const display = (name: string): string =>
      privacy ? privacy.pseudonymizer.pseudonymize(name, 'HOST') : name;
    // Bounded on both axes (names above, siblings/sentences here): agent_names declares no
    // maxItems, so an unbounded hint could evict every sample row from the digest and still
    // bust the char cap -- capDigest's hint-length cap is the backstop, this is the shaper.
    const sentences = nearMisses
      .slice(0, MAX_NEAR_MISS_SENTENCES)
      .map(
        ({ requested, siblings }) =>
          `The agent-name filter "${display(
            requested,
          )}" also nearly matches distinct ` +
          `agent(s) with data: ${siblings
            .slice(0, MAX_NEAR_MISS_SIBLINGS)
            .map(display)
            .join(
              ', ',
            )}. If the user named one of those, re-run with that exact name -- ` +
          'never silently substitute one host for another.',
      );
    digest.hint = digest.hint
      ? `${digest.hint} ${sentences.join(' ')}`
      : sentences.join(' ');
  } catch {
    // Extra-query failure degrades silently -- see this function's own header comment.
  }
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

    // Issue #8920 item 2, applied at the CHOKEPOINT rather than per tool: a bare parent
    // technique-id `term` filter (typed tool or hand-written escape-hatch DSL alike) is rolled
    // up to include its sub-techniques before execution -- see technique-rollup.ts for the
    // shape, the case normalization, and the safety argument. Runs BEFORE lintDsl so the body
    // that is linted is byte-identical to the body that executes.
    const rolled = rollUpTechniqueIdFilters(valved.body);

    // The vulnerability-field-on-findings-index check in guardrails.ts's lintDsl has no per-tool
    // exemptions (the 4.14 get_solved_vulnerabilities carve-out was retired in the 5.0 port).
    const lintResult = lintDsl(rolled, indexerRequest.index);
    if (!lintResult.ok) {
      return { toolResultContent: toolErrorContent(lintResult.reason) };
    }
    body = rolled;
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
    // Issue #8920 items 3 and 6: both slot in HERE, between `buildDigest` and `finalizeDigest`,
    // and both extend `Digest.hint` by concatenation rather than a new field -- deliberately no
    // change to digest.ts's `Digest` interface (avoids colliding with sibling in-flight edits to
    // that file). Mutating `digest` before it is handed to `finalizeDigest` means whatever they
    // append is still subject to the same downstream pipeline (capDigest's length cap, the
    // outbound prescan/text-scrub in chat.ts) as any other digest content.
    if (digest.counts.returned === 0) {
      await appendWindowRecountHint(
        digest,
        body,
        indexerRequest.index,
        context,
      );
    }
    await appendEntityNearMissHint(
      digest,
      params,
      indexerRequest.index,
      context,
      privacy,
    );
    appendSubTechniqueSplitHint(digest);
    // `buildDigest` already ran `capDigest` once, BEFORE either hint above could have grown
    // `digest.hint` further -- re-running it here (privacy-off included, not only the
    // `finalizeDigest` privacy-on path below) is what keeps the "bounded ~1-2k token digest"
    // guarantee (digest.ts's `DIGEST_CHAR_CAP`) true even after these two appends, instead of
    // silently letting a hint-inflated digest slip past the cap whenever privacy mode is off.
    capDigest(digest);
    // A `breakdownDimensions`-opted-in tool's synthesized breakdown (digest.ts's
    // `buildSyntheticBreakdown`) tags each bucket `agg: <dimension field path>` — an IDENTITY map
    // (dimension -> itself) lets `applyFieldPolicy` below resolve those buckets' field policy the
    // exact same way it resolves a REAL aggregation's buckets, rather than silently skipping the
    // scrub because `extractAggFields(body)` (which only ever reads a REAL `aggs` clause) has
    // nothing to report for a tool — every one of these — that never sends one.
    const aggFields =
      extractAggFields(body) ??
      (def.digest.breakdownDimensions
        ? Object.fromEntries(
            def.digest.breakdownDimensions.map(dimension => [
              dimension,
              dimension,
            ]),
          )
        : undefined);
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
