import { RequestHandlerContext } from '../../../../../src/core/server';
import { ResolveParamsResult, ToolDefinition } from '../types';
import { checkIndexAllowlist } from '../guardrails';
import { clampLimit, limitProperty, objectSchema } from './common';

// `.wazuh-content-manager-jobs` is a hardcoded literal, not
// model-controlled, so this is "free" defense-in-depth rather than a fix for a reachable attack --
// it keeps "every indexer read in this catalog goes through checkIndexAllowlist" a grep-able
// invariant instead of an invariant with a silent exception.
const CONTENT_MANAGER_JOBS_INDEX = '.wazuh-content-manager-jobs';
const CTI_CONSUMERS_INDEX = '.wazuh-cti-consumers';
/** The one `.wazuh-cti-consumers` doc that is not a feed: it only holds `last_checked_at`, the
 * last time the indexer asked CTI for new content. Kept out of the per-feed table and read on its
 * own. */
const CTI_GLOBAL_DOC_ID = 'cti:catalog:global';

/** Stable per-feed document ids on `.wazuh-cti-consumers` (live-verified 2026-08-19: `_id`s are
 * `cti:catalog:consumer:{ruleset,iocs,vulnerabilities}`) -- used instead of the `context`/`name`
 * fields because both of those are CONTENT-VERSION-PINNED (live values `"beta3-t1-ruleset-5"`,
 * `"public-ruleset-5"`, etc. -- TC-11's caution, coverage-validation-design.md) and would need
 * re-verifying on every content sync; the `_id` suffix is the feed's stable identity. */
const FEED_IDS: Record<string, string> = {
  ruleset: 'cti:catalog:consumer:ruleset',
  iocs: 'cti:catalog:consumer:iocs',
  vulnerabilities: 'cti:catalog:consumer:vulnerabilities',
};
const FEED_NAMES = Object.keys(FEED_IDS);

/**
 * CTI content freshness: resolves the earlier "can't diagnose sync freshness" gap.
 * `.wazuh-cti-consumers` (3 docs, live-verified 2026-08-19) holds each feed's
 * own `status`/`local_offset`/`remote_offset` -- `local_offset === remote_offset` means fully
 * synced, a gap between them means the feed is behind. Newer indexers (wazuh-indexer-plugins#1198)
 * add `updated_at` (last content update) and `pending_sync_phases` (sub-steps of the last sync that
 * failed and are retried next sync, even on a `ready` feed) per feed, plus a fourth, non-feed doc
 * `cti:catalog:global` carrying `last_checked_at`; that doc is excluded from the per-feed table and
 * summarized in the note instead. Older indexers simply lack these fields. Live values on
 * wazuh-aio-5: all three feeds (`ruleset` 663/663, `iocs` 308829/308829, `vulnerabilities`
 * 849527/849527) report `status: "ready"` with equal offsets -- currently in sync.
 *
 * Same one-request-per-tool-call architectural note as get-cve-intel.ts: the sync-cadence half
 * (`.wazuh-content-manager-jobs`, 2 docs -- "Catalog Sync Periodic Task" every 60 minutes,
 * "Telemetry Ping Periodic Task" daily, live-verified) is fetched inside `resolveParams` and
 * surfaced via `Digest.assumptionNote`, since it is a second index and only the per-feed status
 * table above needs the guardrail-checked primary request.
 *
 * All fields this tool reads (`name`, `context`, `resource`, `status`, `is_public`,
 * `local_offset`, `remote_offset`, `updated_at`, `pending_sync_phases`, `last_checked_at`,
 * `job_type`, `enabled`) have `privacy.ts` `FIELD_POLICY_DEFAULTS` 'allow' entries --
 * content-manager-service-written status/schedule metadata, never analyst/attacker-supplied.
 * `type` (a consumer-type enum, also present on both docs) is deliberately NOT read here,
 * matching that same file's own documented reason for leaving it unlisted.
 */
export const getCtiStatusTool: ToolDefinition = {
  spec: {
    name: 'get_cti_status',
    description:
      'Reports whether the threat-intel (CTI) content feeds -- ruleset, IOC/indicator feed, and ' +
      'vulnerability feed -- are up to date, plus how often they sync. Always name the specific ' +
      'feed(s) and state whether local_offset equals remote_offset (in sync) or is behind (lagging), ' +
      'never a generic "yes it\'s fine" -- that comparison is reconstructible directly from the ' +
      'returned local_offset/remote_offset fields, so state it explicitly rather than guessing. ' +
      'When present, updated_at is when a feed last received content, pending_sync_phases lists ' +
      'steps of its last sync that failed and will be retried (a feed can be in sync yet still ' +
      'have pending steps -- say so), and the note gives when the indexer last checked CTI for ' +
      'updates.',
    parameters: objectSchema({
      feed: {
        type: 'string',
        description:
          'Filter to one specific feed. Omit to see the status of all three.',
        enum: FEED_NAMES,
      },
      limit: limitProperty(
        'Max number of feeds to return (default 10, max 10).',
      ),
    }),
  },
  target: 'indexer',
  tier: 'T1',
  async resolveParams(
    params: Record<string, unknown>,
    context: RequestHandlerContext,
  ): Promise<ResolveParamsResult> {
    const [scheduleNote, lastCheckNote] = await Promise.all([
      describeSyncSchedule(context),
      describeLastCheck(context),
    ]);
    return {
      ok: true,
      resolved: { params, note: `${scheduleNote} ${lastCheckNote}` },
    };
  },
  buildRequest(params) {
    const feed = typeof params.feed === 'string' ? params.feed : undefined;
    const limit = clampLimit(params.limit, 10, 10);
    const query =
      feed && FEED_IDS[feed]
        ? { ids: { values: [FEED_IDS[feed]] } }
        : { bool: { must_not: [{ ids: { values: [CTI_GLOBAL_DOC_ID] } }] } };
    return {
      target: 'indexer',
      index: CTI_CONSUMERS_INDEX,
      body: {
        query,
        _source: [
          'name',
          'context',
          'resource',
          'status',
          'is_public',
          'local_offset',
          'remote_offset',
          'updated_at',
          'pending_sync_phases',
        ],
        sort: ['_doc'],
        size: limit,
      },
    };
  },
  tableSpec: {
    columns: [
      { field: 'name', label: 'Feed' },
      { field: 'status', label: 'Status' },
      { field: 'local_offset', label: 'Local offset' },
      { field: 'remote_offset', label: 'Remote offset' },
      { field: 'updated_at', label: 'Last updated' },
    ],
    rowFields: ['context', 'resource', 'is_public', 'pending_sync_phases'],
  },
  digest: {
    sampleColumns: [
      'name',
      'status',
      'local_offset',
      'remote_offset',
      'updated_at',
      'pending_sync_phases',
      'context',
      'resource',
      'is_public',
    ],
  },
};

type SearchHits = {
  hits?: { hits?: Array<{ _source?: Record<string, unknown> }> };
};

/** "Sync schedule: ..." from `.wazuh-content-manager-jobs`. Never throws: a failed lookup must not
 * block or taint the per-feed status table this tool's own request already answers (same
 * honest-degrade posture as get-cve-intel.ts). */
async function describeSyncSchedule(
  context: RequestHandlerContext,
): Promise<string> {
  if (!checkIndexAllowlist(CONTENT_MANAGER_JOBS_INDEX).ok) {
    // Should be unreachable (the index is a hardcoded literal above), but never issue a search
    // this catalog's own boundary would reject -- degrade honestly instead.
    return 'Sync schedule: could not be checked (index not allowlisted).';
  }
  try {
    const response = await context.core.opensearch.client.asCurrentUser.search({
      index: CONTENT_MANAGER_JOBS_INDEX,
      body: {
        query: { match_all: {} },
        _source: ['name', 'job_type', 'schedule', 'enabled'],
        size: 10,
      },
    });
    const hits = (response.body as SearchHits).hits?.hits ?? [];
    const jobs = hits
      .map(hit => describeJob(hit._source))
      .filter((text): text is string => text !== undefined);
    return jobs.length > 0
      ? `Sync schedule: ${jobs.join('; ')}.`
      : 'Sync schedule: no schedule metadata found.';
  } catch {
    return 'Sync schedule: could not be checked (the schedule lookup failed).';
  }
}

/** "Last check for updates: ..." from the `cti:catalog:global` doc. Never throws, same as above;
 * an indexer that predates the field says so instead of inventing a time. */
async function describeLastCheck(
  context: RequestHandlerContext,
): Promise<string> {
  if (!checkIndexAllowlist(CTI_CONSUMERS_INDEX).ok) {
    return 'Last check for updates: could not be checked (index not allowlisted).';
  }
  try {
    const response = await context.core.opensearch.client.asCurrentUser.search({
      index: CTI_CONSUMERS_INDEX,
      body: {
        query: { ids: { values: [CTI_GLOBAL_DOC_ID] } },
        _source: ['last_checked_at'],
        size: 1,
      },
    });
    const lastCheckedAt = (response.body as SearchHits).hits?.hits?.[0]?._source
      ?.last_checked_at;
    return typeof lastCheckedAt === 'string' && lastCheckedAt
      ? `Last check for updates: ${lastCheckedAt}.`
      : 'Last check for updates: not reported by this indexer.';
  } catch {
    return 'Last check for updates: could not be checked (the lookup failed).';
  }
}

/** Renders one `.wazuh-content-manager-jobs` doc's schedule as a short clause, e.g. "Catalog Sync
 * Periodic Task every 60 Minutes (enabled)". Returns `undefined` (never a fabricated placeholder)
 * for a doc missing the fields it needs. */
function describeJob(
  source: Record<string, unknown> | undefined,
): string | undefined {
  if (!source) {
    return undefined;
  }
  const name = typeof source.name === 'string' ? source.name : undefined;
  const schedule = source.schedule as
    | { interval?: { period?: unknown; unit?: unknown } }
    | undefined;
  const period = schedule?.interval?.period;
  const unit = schedule?.interval?.unit;
  if (!name || period === undefined || typeof unit !== 'string') {
    return undefined;
  }
  const enabled = source.enabled === true ? 'enabled' : 'disabled';
  return `${name} every ${period} ${unit} (${enabled})`;
}
