import { RequestHandlerContext } from '../../../../../src/core/server';
import { ResolveParamsResult, ToolDefinition } from '../types';
import { checkIndexAllowlist } from '../guardrails';
import { clampLimit, limitProperty, objectSchema } from './common';

// A-2 hardening (AI/plan/a1b-review.md): `.wazuh-content-manager-jobs` is a hardcoded literal, not
// model-controlled, so this is "free" defense-in-depth rather than a fix for a reachable attack --
// it keeps "every indexer read in this catalog goes through checkIndexAllowlist" a grep-able
// invariant instead of an invariant with a silent exception.
const CONTENT_MANAGER_JOBS_INDEX = '.wazuh-content-manager-jobs';

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
 * CTI content freshness (coverage doc MS-6/MS-7/CV-078, retiers CV-050's "can't diagnose sync
 * freshness" framing). `.wazuh-cti-consumers` (3 docs, live-verified 2026-08-19) holds each feed's
 * own `status`/`local_offset`/`remote_offset` -- `local_offset === remote_offset` means fully
 * synced, a gap between them means the feed is behind. Live values on wazuh-aio-5: all three feeds
 * (`ruleset` 663/663, `iocs` 308829/308829, `vulnerabilities` 849527/849527) report
 * `status: "ready"` with equal offsets -- currently in sync.
 *
 * Same one-request-per-tool-call architectural note as get-cve-intel.ts: the sync-cadence half
 * (`.wazuh-content-manager-jobs`, 2 docs -- "Catalog Sync Periodic Task" every 60 minutes,
 * "Telemetry Ping Periodic Task" daily, live-verified) is fetched inside `resolveParams` and
 * surfaced via `Digest.assumptionNote`, since it is a second index and only the per-feed status
 * table above needs the guardrail-checked primary request.
 *
 * All fields this tool reads (`name`, `context`, `resource`, `status`, `is_public`,
 * `local_offset`, `remote_offset`, `job_type`, `enabled`) already have `privacy.ts`
 * `FIELD_POLICY_DEFAULTS` 'allow' entries from workstream A1a -- content-manager-service-written
 * status/schedule metadata, never analyst/attacker-supplied. `type` (a consumer-type enum, also
 * present on both docs) is deliberately NOT read here, matching that same file's own documented
 * reason for leaving it unlisted.
 */
export const getCtiStatusTool: ToolDefinition = {
  spec: {
    name: 'get_cti_status',
    description:
      'Reports whether the threat-intel (CTI) content feeds -- ruleset, IOC/indicator feed, and ' +
      'vulnerability feed -- are up to date, plus how often they sync. Always name the specific ' +
      'feed(s) and state whether local_offset equals remote_offset (in sync) or is behind (lagging), ' +
      'never a generic "yes it\'s fine" -- that comparison is reconstructible directly from the ' +
      'returned local_offset/remote_offset fields, so state it explicitly rather than guessing.',
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
    let note: string;
    const allowlistCheck = checkIndexAllowlist(CONTENT_MANAGER_JOBS_INDEX);
    if (!allowlistCheck.ok) {
      // Should be unreachable (the index is a hardcoded literal above), but never issue a search
      // this catalog's own boundary would reject -- degrade honestly instead.
      return {
        ok: true,
        resolved: {
          params,
          note: 'Sync schedule: could not be checked (index not allowlisted).',
        },
      };
    }
    try {
      const response =
        await context.core.opensearch.client.asCurrentUser.search({
          index: CONTENT_MANAGER_JOBS_INDEX,
          body: {
            query: { match_all: {} },
            _source: ['name', 'job_type', 'schedule', 'enabled'],
            size: 10,
          },
        });
      const hits =
        (
          response.body as {
            hits?: { hits?: Array<{ _source?: Record<string, unknown> }> };
          }
        ).hits?.hits ?? [];
      const jobs = hits
        .map(hit => describeJob(hit._source))
        .filter((text): text is string => text !== undefined);
      note =
        jobs.length > 0
          ? `Sync schedule: ${jobs.join('; ')}.`
          : 'Sync schedule: no schedule metadata found.';
    } catch {
      // Same honest-degrade posture as get-cve-intel.ts: a schedule-lookup failure must not
      // block or taint the per-feed status table this tool's own request already answers.
      note =
        'Sync schedule: could not be checked (the schedule lookup failed).';
    }
    return { ok: true, resolved: { params, note } };
  },
  buildRequest(params) {
    const feed = typeof params.feed === 'string' ? params.feed : undefined;
    const limit = clampLimit(params.limit, 10, 10);
    const query =
      feed && FEED_IDS[feed]
        ? { ids: { values: [FEED_IDS[feed]] } }
        : { match_all: {} };
    return {
      target: 'indexer',
      index: '.wazuh-cti-consumers',
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
    ],
    rowFields: ['context', 'resource', 'is_public'],
  },
  digest: {
    sampleColumns: [
      'name',
      'status',
      'local_offset',
      'remote_offset',
      'context',
      'resource',
      'is_public',
    ],
  },
};

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
