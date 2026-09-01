import { Logger } from '../../../../src/core/server';
import { FIELD_CATALOG } from '../../common/field-catalog';
import { fieldsForFamily } from './catalog/get-field-values';

/**
 * Startup drift canary: the generated field catalog
 * (`common/field-catalog.ts`) and this catalog's own aggregation allowlist
 * (`guardrails.ts`'s `AGG_FIELD_ALLOWLIST`) are both STATIC, reviewed-at-commit-time snapshots of
 * what a live Wazuh Indexer maps. Neither can notice, on its own, the day a platform upgrade
 * renames or drops a field the tools still reference -- the failure mode is silent: a filter on a
 * renamed field returns zero rows forever, indistinguishable from "no matching data" (exactly the
 * class of bug that affects the ruleset tools too). This
 * module runs ONE bounded live `_mapping` check per process start (per family: the pattern's
 * `properties`, plus one index's `dynamic_templates` declarations -- see `checkFamily`) and logs a
 * warning for every catalog/allowlist field that is neither mapped nor declared, so that drift
 * shows up in the server log on the day it happens instead of months later in a QA report.
 *
 * Deliberately NOT a scheduled job: no timer, no interval, no retry loop. `runFieldDriftCanary`
 * fires once from `server/plugin.ts`'s `start()`, races against a fixed timeout, and swallows
 * every error at debug level -- the indexer may legitimately be unreachable at plugin-start time
 * (still provisioning, mid-upgrade, credentials not yet live), and a canary that could crash or
 * retry-loop the plugin would be a worse bug than the drift it exists to catch.
 */

/** Bounded per-process-start check, not a schedule: safe to leave this generous, since it can
 * never fire twice. */
const CANARY_TIMEOUT_MS = 10_000;

/** Cap on how many missing-field lines one family logs -- a real platform-side rename can affect
 * many fields at once (e.g. an entire renamed top-level group), and this canary must stay a
 * bounded, glanceable warning, never a log-flooding incident of its own. */
const MAX_MISSING_FIELDS_LOGGED_PER_FAMILY = 20;

/** The index families the catalog tools actually query, mapped to the `common/field-catalog.ts`
 * key that documents their known fields and the concrete index pattern to run `_mapping` against.
 * Deliberately a small, curated list -- NOT every family in `FIELD_CATALOG` (that catalog also
 * covers WCS families this product has no tool for yet, e.g. the FIM registry subsets, which
 * would only add startup-log noise with no actionable tool to fix). Keep in sync with
 * `server/tools/router.ts`'s `TOOL_CATEGORY` index targets and `get-field-values.ts`'s
 * `FIELD_LOCATIONS` if either changes which indices are actually queried.
 *
 * `fim.files`, `inventory.processes`, and `inventory.hotfixes` are excluded here because they have
 * no `get-field-values.ts` tool fields of their own -- `checkFamily` below has nothing to check for
 * a family with no tool-facing fields, so listing them would only add dead entries.
 */
/**
 * `allowlistFamily` is `get-field-values.ts`'s OWN family vocabulary ("findings"/"events"/"sca"/
 * ...) for that same index -- deliberately a separate label from the `common/field-catalog.ts`
 * `family` key on the same row, since the two modules' family vocabularies were built
 * independently and do not share spelling (e.g. "events.findings" here vs. "findings" there).
 * `fieldsForFamily(allowlistFamily)` resolves the fields tool PARAMS actually filter/aggregate on
 * -- `wazuh.*` fields such as `wazuh.rule.id`/`wazuh.agent.name` are never in `FIELD_CATALOG` at
 * all (that catalog only carries WCS/ECS paths), so without this second source those tool-facing
 * fields would never be live-checked. REQUIRED -- see `checkFamily`'s doc comment for why a family
 * with no tool-facing fields has nothing left to check.
 */
const QUERIED_FAMILIES: ReadonlyArray<{
  family: string;
  index: string;
  allowlistFamily: string;
}> = [
  {
    family: 'events.findings',
    index: 'wazuh-findings-v5*',
    allowlistFamily: 'findings',
  },
  {
    family: 'events.main',
    index: 'wazuh-events-v5*',
    allowlistFamily: 'events',
  },
  { family: 'sca', index: 'wazuh-states-sca*', allowlistFamily: 'sca' },
  {
    family: 'vulnerabilities',
    index: 'wazuh-states-vulnerabilities*',
    allowlistFamily: 'vulnerabilities',
  },
  {
    family: 'inventory.system',
    index: 'wazuh-states-inventory-system*',
    allowlistFamily: 'inventory_system',
  },
  {
    family: 'inventory.packages',
    index: 'wazuh-states-inventory-packages*',
    allowlistFamily: 'inventory_packages',
  },
  {
    family: 'inventory.ports',
    index: 'wazuh-states-inventory-ports*',
    allowlistFamily: 'inventory_ports',
  },
];

/** One `mappings.dynamic_templates` entry as OpenSearch returns it: a single-key object whose key
 * is the template NAME (e.g. `wcs_host_os_name`) and whose value carries the matching rules. Only
 * `path_match` is modelled -- it is the one rule that names a concrete field PATH, which is what
 * `buildDeclaredFieldMatcher` needs; the other rules (`match`, `match_mapping_type`, and their
 * negated forms) describe a field's name fragment or datatype, never a full path, so they can
 * never establish that a specific catalog path is declared. */
export interface DynamicTemplateEntry {
  [templateName: string]: {
    path_match?: string | string[];
  };
}

/** Minimal shape of the OpenSearch `_mapping` response this canary needs -- one entry per
 * concrete index behind the pattern, each with a (possibly absent, on a brand-new/empty pattern)
 * `mappings.properties` tree and the index's `mappings.dynamic_templates` list. Kept narrow and
 * structural rather than importing a full client response type, so a mock in tests needs no more
 * than this shape. */
export interface MappingsResponseBody {
  [indexName: string]: {
    mappings?: {
      properties?: Record<string, unknown>;
      dynamic_templates?: DynamicTemplateEntry[];
    };
  };
}

/** The minimal client surface this canary calls -- `context.core.opensearch.client.asInternalUser`
 * (per-request) and `core.opensearch.client.asInternalUser` (CoreStart, used here) both satisfy
 * this shape, so the real call site needs no adapter and a test can pass a trivial stub. */
export interface MappingClient {
  indices: {
    getMapping(params: {
      index: string;
      filter_path?: string;
    }): Promise<{ body: MappingsResponseBody }>;
  };
}

/** Without `filter_path`, `indices.getMapping` returns the FULL mapping response
 * (settings/aliases/other metadata this canary never reads) -- measured at 939 KB for one family
 * on a live 8-backing-index findings pattern. Requesting only the `mappings.properties` subtree
 * per index cuts that payload (and the `JSON.parse` cost) down to just what
 * `flattenMappedFieldPaths` actually walks, across all `QUERIED_FAMILIES` on every process start. */
const MAPPING_FILTER_PATH = '*.mappings.properties';

/** Second, narrower request: only the `path_match` rule of every `dynamic_templates` entry -- see
 * `checkFamily` for why the declared-but-not-yet-materialized fields matter and
 * `DYNAMIC_TEMPLATES_SOURCE_COUNT` for why this is asked of ONE index rather than the pattern.
 * Measured live on 5.0.0, one findings backing index: 311 KB for the whole `dynamic_templates`
 * list, 209 KB filtered down to `path_match` alone. The deeper-looking `*.mappings
 * .dynamic_templates.*.*.path_match` returns NOTHING -- `filter_path` already walks the array
 * transparently, so the single `*` after `dynamic_templates` is the template-name wildcard. */
const DYNAMIC_TEMPLATES_FILTER_PATH =
  '*.mappings.dynamic_templates.*.path_match';

/** How many of a family's concrete indices are asked for their `dynamic_templates` list.
 *
 * ONE, deliberately. Every backing index behind a family pattern is created from the same
 * composable index template, so their `dynamic_templates` lists are identical -- asking the
 * pattern would just return the same ~2,300-entry list once per backing index. Measured live on a
 * populated 5.0.0 cluster (8 backing indices), for `wazuh-findings-v5*`: 1.78 MB for the pattern
 * vs. 209 KB for a single index, per family, on every process start. The index picked is the
 * first in sorted order, so the same one is read on every restart and the check stays reproducible
 * rather than depending on the order the cluster happens to enumerate indices in.
 *
 * The cost of the shortcut: an index still backed by a SUPERSEDED template version (an upgrade
 * that has not rolled its data streams over yet) declares that older field set, which can hide a
 * genuine removal for one generation. That is the same direction this whole canary already errs
 * in -- toward silence rather than a false alarm -- and it is bounded by the next rollover. */
const DYNAMIC_TEMPLATES_SOURCE_COUNT = 1;

/** Turns one `path_match` rule into a matcher. OpenSearch matches `path_match` with simple glob
 * semantics -- `*` is the only metacharacter -- so every other regexp-special character is
 * escaped and `*` alone becomes `.*`, anchored at both ends. */
function pathMatchToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, character =>
    character === '*' ? '.*' : `\\${character}`,
  );
  return new RegExp(`^${escaped}$`);
}

/** Builds "is this field path DECLARED by a dynamic template?" from one index's
 * `dynamic_templates` list.
 *
 * This is the whole point of the second request: on Wazuh 5.0.0 the events/findings templates are
 * `"dynamic": "strict_allow_templates"` and declare each WCS field as its own exact-`path_match`
 * template (2,345 of them on findings, 2,299 on events) rather than as a `properties` entry. A
 * leaf therefore only appears under `mappings.properties` once a document carrying it has been
 * indexed -- so on a deployment with no agents, or on any index category that has simply not seen
 * that field yet, `properties` legitimately lacks it while the mapping still fully declares it.
 * Reading `properties` alone reports those as drift (the false positives this matcher removes),
 * and it stays a real check: under `strict_allow_templates` a field in neither `properties` nor
 * `dynamic_templates` cannot be indexed at all, so a genuinely dropped or renamed field is still
 * missing from BOTH sources and still warns.
 *
 * Returns a predicate rather than a Set because `path_match` may contain a glob; an index with no
 * `dynamic_templates` at all (every `wazuh-states-*` index today) yields a predicate that is
 * always false, leaving that family's check exactly as it was. */
export function buildDeclaredFieldMatcher(
  entries: readonly DynamicTemplateEntry[] | undefined,
): (path: string) => boolean {
  const exactPaths = new Set<string>();
  const globs: RegExp[] = [];
  for (const entry of entries ?? []) {
    for (const definition of Object.values(entry ?? {})) {
      const pathMatch = definition?.path_match;
      if (!pathMatch) {
        continue;
      }
      for (const rule of Array.isArray(pathMatch) ? pathMatch : [pathMatch]) {
        if (rule.includes('*')) {
          globs.push(pathMatchToRegExp(rule));
        } else {
          exactPaths.add(rule);
        }
      }
    }
  }
  if (exactPaths.size === 0 && globs.length === 0) {
    return () => false;
  }
  return path => exactPaths.has(path) || globs.some(glob => glob.test(path));
}

/** Fetches `DYNAMIC_TEMPLATES_SOURCE_COUNT` index's dynamic templates and returns the matcher for
 * them. Any failure PROPAGATES to `checkFieldDrift`'s per-family catch, which skips the family
 * with a DEBUG line: without the declared-field side, this canary cannot tell a not-yet-
 * materialized field from a removed one, and guessing would mean re-emitting exactly the false
 * warnings this request exists to suppress. Skipping one startup's check for one family is the
 * cheaper failure -- the same trade-off the properties request already makes. */
async function fetchDeclaredFieldMatcher(
  client: MappingClient,
  indexNames: string[],
): Promise<(path: string) => boolean> {
  const sources = [...indexNames]
    .sort()
    .slice(0, DYNAMIC_TEMPLATES_SOURCE_COUNT);
  const entries: DynamicTemplateEntry[] = [];
  for (const source of sources) {
    // At most DYNAMIC_TEMPLATES_SOURCE_COUNT (currently one) request; the loop exists so the
    // constant, not the code shape, decides how many indices are consulted.
    // eslint-disable-next-line no-await-in-loop
    const response = await client.indices.getMapping({
      index: source,
      filter_path: DYNAMIC_TEMPLATES_FILTER_PATH,
    });
    for (const indexBody of Object.values(response.body ?? {})) {
      entries.push(...(indexBody.mappings?.dynamic_templates ?? []));
    }
  }
  return buildDeclaredFieldMatcher(entries);
}

/** Flattens one index's `mappings.properties` tree into the set of dot-path field names it maps --
 * the same shape `common/field-catalog.ts`'s `path` entries use. Recurses into nested
 * `properties` (object/nested fields); does NOT descend into multi-field `fields` sub-maps (a
 * multi-field is an alternate ANALYZER for the same logical field, not a distinct WCS field, so
 * treating it as one would manufacture false "missing" reports for e.g. a `.keyword` sub-field
 * that was never a catalog entry in the first place). */
export function flattenMappedFieldPaths(
  properties: Record<string, unknown> | undefined,
  prefix = '',
): Set<string> {
  const paths = new Set<string>();
  if (!properties) {
    return paths;
  }
  for (const [key, rawValue] of Object.entries(properties)) {
    const path = prefix ? `${prefix}.${key}` : key;
    paths.add(path);
    const value = rawValue as
      | { properties?: Record<string, unknown> }
      | undefined;
    if (value && typeof value === 'object' && value.properties) {
      for (const nested of flattenMappedFieldPaths(value.properties, path)) {
        paths.add(nested);
      }
    }
  }
  return paths;
}

/** Result of one family's live check: `toolMissing` are `get-field-values.ts`-facing fields
 * (something a tool can actually filter/aggregate on) that are no longer mapped -- these are real,
 * actionable drift and are logged at WARN. `catalogMissing` are WCS-catalog-only fields (schema
 * fields no tool queries) that are no longer mapped -- see `checkFamily`'s doc comment for why
 * these are informational only. */
interface FamilyDriftResult {
  toolMissing: string[];
  catalogMissing: string[];
}

/** Live-checks one family: fetches its `_mapping`, unions every concrete index's flattened field
 * paths (a data-stream/alias pattern can back more than one backing index, and a field mapped on
 * ANY of them counts as present), and returns which known fields are missing from that union,
 * split into the two buckets `FamilyDriftResult` documents. Returns `{[], []}` (never throws) when
 * the pattern currently resolves to zero indices -- an empty environment/family is not drift, it
 * is simply nothing to check yet.
 *
 * A field is "present" if it is materialized under `mappings.properties` on any backing index OR
 * declared by a `dynamic_templates` `path_match` -- see `buildDeclaredFieldMatcher` for why the
 * second source is required (on 5.0.0's `strict_allow_templates` events/findings templates almost
 * every field is declared that way and only materializes once a document carries it, so
 * `properties` alone reports every tool-facing field of an unpopulated deployment as drift).
 *
 * WCS is the schema, not what the live index TEMPLATE actually maps -- measured live,
 * `events.main` alone has 2,121 WCS fields the template never maps, none of which any tool
 * touches. Treating those as drift would produce ~2,100 false "drift" warnings on a perfectly
 * healthy system every startup (a canary that cries wolf on day one gets muted, costing the real
 * signal it exists for). The catalog side is still checked, for visibility, but only ever at
 * DEBUG.
 */
async function checkFamily(
  client: MappingClient,
  family: string,
  index: string,
  allowlistFamily: string,
): Promise<FamilyDriftResult> {
  const catalogFields = FIELD_CATALOG[family] ?? [];
  const toolFilterFields = fieldsForFamily(allowlistFamily);
  const namesToCheck = new Set<string>([...catalogFields, ...toolFilterFields]);
  if (namesToCheck.size === 0) {
    return { toolMissing: [], catalogMissing: [] };
  }
  const response = await client.indices.getMapping({
    index,
    filter_path: MAPPING_FILTER_PATH,
  });
  const mapped = new Set<string>();
  for (const indexBody of Object.values(response.body ?? {})) {
    for (const path of flattenMappedFieldPaths(
      indexBody.mappings?.properties,
    )) {
      mapped.add(path);
    }
  }
  if (mapped.size === 0) {
    // No backing index yet (pattern matched nothing) -- nothing to compare against, not drift.
    return { toolMissing: [], catalogMissing: [] };
  }
  const isDeclared = await fetchDeclaredFieldMatcher(
    client,
    Object.keys(response.body ?? {}),
  );
  const isPresent = (path: string): boolean =>
    mapped.has(path) || isDeclared(path);
  const toolFilterFieldSet = new Set(toolFilterFields);
  const toolMissing = toolFilterFields.filter(path => !isPresent(path)).sort();
  const catalogMissing = catalogFields
    .filter(path => !toolFilterFieldSet.has(path) && !isPresent(path))
    .sort();
  return { toolMissing, catalogMissing };
}

/** Logs up to `MAX_MISSING_FIELDS_LOGGED_PER_FAMILY` missing-field lines (plus a remainder line)
 * at the given level, prefixed identically either way -- shared by the WARN (tool-facing) and
 * DEBUG (catalog-only) paths below so the two only differ in level and wording, not structure. */
function logMissing(
  logger: Logger,
  level: 'warn' | 'debug',
  family: string,
  index: string,
  missing: string[],
  detail: string,
): void {
  const shown = missing.slice(0, MAX_MISSING_FIELDS_LOGGED_PER_FAMILY);
  const remainder = missing.length - shown.length;
  for (const path of shown) {
    logger[level](
      `[field-drift] "${family}" (${index}): ${detail} "${path}" is no longer present in the ` +
        'live mapping.',
    );
  }
  if (remainder > 0) {
    logger[level](
      `[field-drift] "${family}" (${index}): ${remainder} additional missing field(s) not shown ` +
        `(capped at ${MAX_MISSING_FIELDS_LOGGED_PER_FAMILY} per family).`,
    );
  }
}

/** Runs the bounded live check across every queried family and logs one WARN line per missing
 * TOOL-FACING field (capped per family), one DEBUG line per missing catalog-only
 * field, plus a DEBUG summary line when everything matched. Never throws -- every per-family
 * failure (a down indexer, an auth error, a malformed response) is caught and logged at DEBUG,
 * individually, so one unreachable family does not stop the rest from being checked. Exported
 * separately from `runFieldDriftCanary` (the fire-and-forget, timeout-guarded entry point) so a
 * test can await this directly without racing a real timer.
 */
export async function checkFieldDrift(
  client: MappingClient,
  logger: Logger,
): Promise<void> {
  for (const { family, index, allowlistFamily } of QUERIED_FAMILIES) {
    let result: FamilyDriftResult;
    try {
      // A handful of small, independent _mapping calls at process start; sequential keeps this
      // canary's own load on the indexer bounded and its log output ordered by family, which
      // matters more here than shaving startup time.
      // eslint-disable-next-line no-await-in-loop
      result = await checkFamily(client, family, index, allowlistFamily);
    } catch (error) {
      logger.debug(
        `[field-drift] could not check "${family}" (${index}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      continue;
    }
    if (result.toolMissing.length === 0 && result.catalogMissing.length === 0) {
      logger.debug(`[field-drift] "${family}" (${index}): no drift detected.`);
      continue;
    }
    if (result.toolMissing.length > 0) {
      logMissing(
        logger,
        'warn',
        family,
        index,
        result.toolMissing,
        'tool-facing field',
      );
    }
    if (result.catalogMissing.length > 0) {
      // Informational only: a WCS-catalog field with no tool that queries it --
      // no filter/aggregation can silently break, so this never rises above DEBUG.
      logMissing(
        logger,
        'debug',
        family,
        index,
        result.catalogMissing,
        'catalog-only field',
      );
    }
  }
}

/**
 * Fire-and-forget entry point for `server/plugin.ts`'s `start()`. Races `checkFieldDrift` against
 * `CANARY_TIMEOUT_MS` and swallows EVERY outcome (success, failure, or timeout) at DEBUG -- this
 * function itself never rejects and its returned promise is intentionally left unawaited by the
 * caller (a canary blocking plugin start defeats its own "fire and forget" premise). Runs exactly
 * once per process lifetime: no interval, no retry, no re-arm.
 */
export function runFieldDriftCanary(
  client: MappingClient,
  logger: Logger,
): void {
  const timeout = new Promise<void>(resolve => {
    const handle = setTimeout(resolve, CANARY_TIMEOUT_MS);
    // Without `.unref()`, this timer keeps the process alive for the full
    // `CANARY_TIMEOUT_MS` after startup even when `checkFieldDrift` wins the race well before
    // then -- harmless on the long-lived OSD server, but free to fix and avoids holding a handle
    // Node has no other reason to keep around.
    handle.unref?.();
  });
  Promise.race([checkFieldDrift(client, logger), timeout]).catch(error => {
    logger.debug(
      `[field-drift] canary failed unexpectedly: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  });
}
