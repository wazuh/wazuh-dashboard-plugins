import { Logger } from '../../../../src/core/server';
import { FIELD_CATALOG } from '../../common/field-catalog';
import { fieldsForFamily } from './catalog/get-field-values';

/**
 * Startup drift canary (workstream B, deliverable 3): the generated field catalog
 * (`common/field-catalog.ts`) and this catalog's own aggregation allowlist
 * (`guardrails.ts`'s `AGG_FIELD_ALLOWLIST`) are both STATIC, reviewed-at-commit-time snapshots of
 * what a live Wazuh Indexer maps. Neither can notice, on its own, the day a platform upgrade
 * renames or drops a field the tools still reference -- the failure mode is silent: a filter on a
 * renamed field returns zero rows forever, indistinguishable from "no matching data" (exactly the
 * class of bug `AI/plan/qa-rules-decoders-rootcause.md` catalogs for the ruleset tools). This
 * module runs ONE bounded live `_mapping` check per process start and logs a warning for every
 * catalog/allowlist field that is no longer mapped, so that drift shows up in the server log on
 * the day it happens instead of months later in a QA report.
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
 */
/**
 * `allowlistFamily` (when set) is `get-field-values.ts`'s OWN family vocabulary
 * ("findings"/"events"/"sca"/...) for that same index -- deliberately a separate label from the
 * `common/field-catalog.ts` `family` key on the same row, since the two modules' family
 * vocabularies were built independently and do not share spelling (e.g. "events.findings" here
 * vs. "findings" there). `fieldsForFamily(allowlistFamily)` is how part (b) of this canary's job
 * (checking the fields tool PARAMS actually filter/aggregate on, not just the WCS catalog's
 * fields) is resolved -- `wazuh.*` fields such as `wazuh.rule.id`/`wazuh.agent.name` are never in
 * `FIELD_CATALOG` at all (that catalog only carries WCS/ECS paths), so without this second source
 * those tool-facing fields would never be live-checked. Omitted for a family with no
 * `get-field-values.ts` fields of its own (`fim.files` has no AGG_FIELD_ALLOWLIST entry yet).
 */
const QUERIED_FAMILIES: ReadonlyArray<{
  family: string;
  index: string;
  allowlistFamily?: string;
}> = [
  { family: 'events.findings', index: 'wazuh-findings-v5*', allowlistFamily: 'findings' },
  { family: 'events.main', index: 'wazuh-events-v5*', allowlistFamily: 'events' },
  { family: 'sca', index: 'wazuh-states-sca*', allowlistFamily: 'sca' },
  {
    family: 'vulnerabilities',
    index: 'wazuh-states-vulnerabilities*',
    allowlistFamily: 'vulnerabilities',
  },
  { family: 'fim.files', index: 'wazuh-states-fim-files*' },
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
  { family: 'inventory.processes', index: 'wazuh-states-inventory-processes*' },
  { family: 'inventory.hotfixes', index: 'wazuh-states-inventory-hotfixes*' },
];

/** Minimal shape of the OpenSearch `_mapping` response this canary needs -- one entry per
 * concrete index behind the pattern, each with a (possibly absent, on a brand-new/empty pattern)
 * `mappings.properties` tree. Kept narrow and structural rather than importing a full client
 * response type, so a mock in tests needs no more than this shape. */
export interface MappingsResponseBody {
  [indexName: string]: {
    mappings?: {
      properties?: Record<string, unknown>;
    };
  };
}

/** The minimal client surface this canary calls -- `context.core.opensearch.client.asInternalUser`
 * (per-request) and `core.opensearch.client.asInternalUser` (CoreStart, used here) both satisfy
 * this shape, so the real call site needs no adapter and a test can pass a trivial stub. */
export interface MappingClient {
  indices: {
    getMapping(params: { index: string }): Promise<{ body: MappingsResponseBody }>;
  };
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
    const value = rawValue as { properties?: Record<string, unknown> } | undefined;
    if (value && typeof value === 'object' && value.properties) {
      for (const nested of flattenMappedFieldPaths(value.properties, path)) {
        paths.add(nested);
      }
    }
  }
  return paths;
}

/** Live-checks one family: fetches its `_mapping`, unions every concrete index's flattened field
 * paths (a data-stream/alias pattern can back more than one backing index, and a field mapped on
 * ANY of them counts as present), and returns the catalog fields that are missing from that
 * union. Returns `[]` (never throws) when the pattern currently resolves to zero indices -- an
 * empty environment/family is not drift, it is simply nothing to check yet. */
async function checkFamily(
  client: MappingClient,
  family: string,
  index: string,
  allowlistFamily: string | undefined,
): Promise<string[]> {
  const catalogFields = FIELD_CATALOG[family] ?? [];
  const toolFilterFields = allowlistFamily ? fieldsForFamily(allowlistFamily) : [];
  const namesToCheck = new Set<string>([
    ...catalogFields.map(entry => entry.path),
    ...toolFilterFields,
  ]);
  if (namesToCheck.size === 0) {
    return [];
  }
  const response = await client.indices.getMapping({ index });
  const mapped = new Set<string>();
  for (const indexBody of Object.values(response.body ?? {})) {
    for (const path of flattenMappedFieldPaths(indexBody.mappings?.properties)) {
      mapped.add(path);
    }
  }
  if (mapped.size === 0) {
    // No backing index yet (pattern matched nothing) -- nothing to compare against, not drift.
    return [];
  }
  const missing: string[] = [];
  for (const path of namesToCheck) {
    if (!mapped.has(path)) {
      missing.push(path);
    }
  }
  return missing.sort();
}

/** Runs the bounded live check across every queried family and logs one warning line per missing
 * field (capped per family), plus a debug summary line when everything matched. Never throws --
 * every per-family failure (a down indexer, an auth error, a malformed response) is caught and
 * logged at DEBUG, individually, so one unreachable family does not stop the rest from being
 * checked. Exported separately from `runFieldDriftCanary` (the fire-and-forget, timeout-guarded
 * entry point) so a test can await this directly without racing a real timer.
 */
export async function checkFieldDrift(
  client: MappingClient,
  logger: Logger,
): Promise<void> {
  for (const { family, index, allowlistFamily } of QUERIED_FAMILIES) {
    let missing: string[];
    try {
      // eslint-disable-next-line no-await-in-loop -- a handful of small, independent _mapping
      // calls at process start; sequential keeps this canary's own load on the indexer bounded
      // and its log output ordered by family, which matters more here than shaving startup time.
      missing = await checkFamily(client, family, index, allowlistFamily);
    } catch (error) {
      logger.debug(
        `[field-drift] could not check "${family}" (${index}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      continue;
    }
    if (missing.length === 0) {
      logger.debug(`[field-drift] "${family}" (${index}): no drift detected.`);
      continue;
    }
    const shown = missing.slice(0, MAX_MISSING_FIELDS_LOGGED_PER_FAMILY);
    const remainder = missing.length - shown.length;
    for (const path of shown) {
      logger.warn(
        `[field-drift] "${family}" (${index}): known field "${path}" is no longer present in ` +
          'the live mapping -- a tool filtering or aggregating on it will silently return zero ' +
          'rows/buckets instead of erroring. Regenerate common/field-catalog.ts and review the ' +
          'affected tool(s) if this is a real platform-side rename, not a transient empty index.',
      );
    }
    if (remainder > 0) {
      logger.warn(
        `[field-drift] "${family}" (${index}): ${remainder} additional missing field(s) not shown ` +
          `(capped at ${MAX_MISSING_FIELDS_LOGGED_PER_FAMILY} per family).`,
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
export function runFieldDriftCanary(client: MappingClient, logger: Logger): void {
  const timeout = new Promise<void>(resolve => {
    setTimeout(resolve, CANARY_TIMEOUT_MS);
  });
  Promise.race([checkFieldDrift(client, logger), timeout]).catch(error => {
    logger.debug(
      `[field-drift] canary failed unexpectedly: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  });
}
