import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  optionalStringParam,
  resolveTimeRange,
  timeRangeProperties,
} from './common';

/**
 * Typed tool over `wazuh-events-v5*` — the raw normalized event stream, matched or not. Every
 * other search-shaped tool in this catalog targets `wazuh-findings-v5*` (rule-matched detections
 * only); this is the mirror image, for "everything that happened on agent X" questions.
 *
 * `agent_name` is optional here, unlike the findings tools, so "everything in the last hour"
 * (no named agent) is directly expressible too.
 */
export const EVENTS_SCOPE_NOTE =
  'Covers ALL normalized events, matched or not (the raw event/telemetry stream) -- for ' +
  'rule-matched detections specifically, use the findings tools (get_findings_by_time, ' +
  'search_findings_by_agent, etc.) instead.';

export const getEventsByAgentTool: ToolDefinition = {
  spec: {
    name: 'get_events_by_agent',
    description:
      'Searches the raw normalized event stream, most recent first, optionally scoped to one ' +
      `named agent (host/machine/endpoint). ${EVENTS_SCOPE_NOTE} Use for "everything that ` +
      'happened on/in the last N hours" questions, or to check whether events exist at all when a ' +
      'findings-tool search returned 0 rows. Does NOT cover automated actions Wazuh itself took ' +
      '(active response, blocking, quarantine) -- no tool covers active-response actions, so say ' +
      'that plainly rather than treating a normalized event as evidence of one.',
    parameters: objectSchema({
      agent_name: {
        type: 'string',
        description:
          'Optional exact agent name to filter by. Omit to search across all agents.',
      },
      limit: limitProperty(
        'Max number of events to return (default 20, max 500).',
      ),
      ...timeRangeProperties(),
    }),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const agentName = optionalStringParam(params.agent_name);
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    const filter: Record<string, unknown>[] = [
      { range: { '@timestamp': { gte, lte } } },
    ];
    if (agentName) {
      filter.push({ match: { 'wazuh.agent.name': agentName } });
    }
    return {
      target: 'indexer',
      index: 'wazuh-events-v5*',
      body: {
        query: { bool: { filter } },
        sort: [{ '@timestamp': { order: 'desc' } }],
        size: limit,
      },
    };
  },
  tableSpec: {
    columns: [
      { field: '@timestamp', label: 'Time' },
      { field: 'wazuh.agent.name', label: 'Agent' },
      { field: 'event.category', label: 'Category' },
      { field: 'event.action', label: 'Action' },
      { field: 'event.outcome', label: 'Outcome' },
    ],
    rowFields: ['wazuh.agent.id', 'event.module'],
  },
  digest: {
    // The five columns above name that something happened and how it ended, never WHAT ran, so
    // an explanatory answer about an event has nothing to explain from and the final-round
    // instruction correctly forbids inventing it. `process.command_line` carries the substance;
    // `process.name` rides along because it is the one piece of process identity that survives
    // privacy mode (policy `allow`, privacy.ts) while `command_line` is pseudonymized
    // (`anonymize` -- the digest passes through `applyFieldPolicy` in executor.ts like every
    // other column). Length-bounded by `DIGEST_FIELD_MAX_LENGTH_DEFAULTS` (digest.ts).
    sampleColumns: [
      '@timestamp',
      'wazuh.agent.name',
      'event.category',
      'event.action',
      'event.outcome',
      'process.name',
      'process.command_line',
    ],
    // Synthetic fallback, not a real aggregation (issue #8920 item 1): this tool sorts by
    // @timestamp desc, so its 5-row `samples` slice is the newest events only -- "what kinds of
    // events happened" would otherwise be answered from a handful of the most recent rows.
    // `event.category`/`event.outcome` both already have `allow` policy entries in privacy.ts, so
    // no privacy-policy change is needed for this addition.
    breakdownDimensions: ['event.category', 'event.outcome'],
  },
};
