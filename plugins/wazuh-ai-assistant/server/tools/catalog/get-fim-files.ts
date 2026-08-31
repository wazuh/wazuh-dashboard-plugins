import { ToolDefinition } from '../types';
import {
  aggNameForField,
  clampLimit,
  limitProperty,
  objectSchema,
  validateAgentId,
} from './common';
import { BREAKDOWN_BUCKET_CAP } from '../digest';

/**
 * Wazuh 5.0 replacement for the retired get_fim_events: 4.14's FIM tool read the syscheck
 * EVENT stream from wazuh-alerts-*
 * (added/modified/deleted + before/after hashes), which does not exist in 5.0. The confirmed 5.0
 * FIM surface is `wazuh-states-fim-files` — CURRENT monitored-file state (one doc per tracked
 * file: path, mtime, size, owner, hashes; mapping verified live). This tool is
 * therefore scoped to state questions ("what FIM-monitored files changed recently",
 * "what does FIM know about /etc/passwd") sorted by file.mtime desc. The change-EVENT stream
 * (who changed what, event type, before/after pairing) returns only if 5.0 findings prove to
 * carry FIM change records — deliberately NOT faked from state data until verified.
 */
export const getFimFilesTool: ToolDefinition = {
  spec: {
    name: 'get_fim_files',
    description:
      'Lists files tracked by File Integrity Monitoring (FIM) with their CURRENT state — path, ' +
      'last modification time, size, owner, hashes — most recently modified first. Use for ' +
      '"what monitored files changed recently" or "FIM state of file/path X" questions, ' +
      'including when the host is named rather than numbered ("what changed on web-server-01"): ' +
      'scope it with "agent_name" directly, no id lookup needed. Note: this is current state, ' +
      'not a change-event history, and it covers FILES only — Windows registry keys/values are a ' +
      'different surface (wazuh-states-fim-registry-*, reachable through search_wazuh_data).',
    parameters: objectSchema(
      {
        agent_id: {
          type: 'string',
          description:
            'Optional numeric Wazuh agent ID to scope to one agent, e.g. "003". Numeric ids only: ' +
            'an agent NAME here is rejected -- pass the name as "agent_name" instead, this tool ' +
            'resolves it itself. Leaving BOTH out searches every agent, not the named one.',
        },
        // This tool must accept an agent NAME, not only a numeric id: the ordinary FIM question
        // ("which files changed on agent <name>") names the host by name, and an id-only schema makes
        // the typed tool strictly more expensive than filtering `wazuh.agent.name` through the
        // `search_wazuh_data` escape hatch -- which is where the model goes, correctly, costing this
        // tool its whole `fim` family. No prompt clause preferring the typed tool holds against a real
        // cost difference; removing the difference is the fix. Same `agent_id`-wins precedence and the
        // same `match` clause get_agent_inventory's `resolveAgentFilter` uses, and `agent_name` is
        // already an entity-resolution.ts AGENT_NAME_PARAM_KEYS entry, so the pseudonymization path
        // every other agent-name-taking tool gets applies here with no extra wiring.
        agent_name: {
          type: 'string',
          description:
            'Optional agent NAME to scope to one agent, e.g. "web-server-01" -- use this whenever ' +
            'the user named the host rather than numbering it; there is no need to look its id up ' +
            'first. If both this and "agent_id" are given, "agent_id" wins.',
        },
        path_prefix: {
          type: 'string',
          description:
            'Optional file path prefix filter, e.g. "/etc" or "C:\\\\Windows".',
        },
        limit: limitProperty(
          'Max number of files to return (default 20, max 500).',
        ),
      },
      [],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const limit = clampLimit(params.limit, 20, 500);
    // `agent_id` is OPTIONAL here (this tool also answers un-scoped "what FIM files changed?"),
    // so it can't be validated unconditionally the way the agent-scoped inventory tools do. But
    // when it IS supplied it must go through the same `validateAgentId` check they use: agent ids
    // are stored zero-padded keywords ("001".."005"), so an unpadded "3" is not a not-found — it is
    // a silent EMPTY result that reads to the user as "this agent has no monitored files". Failing
    // loudly with the shared, actionable message is strictly better than lying quietly.
    const agentId =
      typeof params.agent_id === 'string' && params.agent_id.trim() !== ''
        ? validateAgentId(params.agent_id.trim())
        : undefined;
    // `agent_id` wins when both are supplied -- an exact Manager-API identifier beats the fuzzier
    // `match`, the same precedence and the same clause shape get_agent_inventory's
    // `resolveAgentFilter` uses. Read only when no id was given, so an id-scoped call builds a
    // byte-identical request to the one it built before this parameter existed.
    const agentName =
      !agentId &&
      typeof params.agent_name === 'string' &&
      params.agent_name.trim() !== ''
        ? params.agent_name.trim()
        : undefined;
    const pathPrefix =
      typeof params.path_prefix === 'string' && params.path_prefix.trim() !== ''
        ? params.path_prefix.trim()
        : undefined;
    return {
      target: 'indexer',
      index: 'wazuh-states-fim-files*',
      body: {
        query: {
          bool: {
            filter: [
              ...(agentId ? [{ term: { 'wazuh.agent.id': agentId } }] : []),
              ...(agentName
                ? [{ match: { 'wazuh.agent.name': agentName } }]
                : []),
              ...(pathPrefix ? [{ prefix: { 'file.path': pathPrefix } }] : []),
              ...(!agentId && !agentName && !pathPrefix
                ? [{ match_all: {} }]
                : []),
            ],
          },
        },
        _source: [
          'file.path',
          'file.mtime',
          'file.size',
          'file.owner',
          'file.group',
          'file.permissions',
          'file.hash.sha256',
          'wazuh.agent.name',
        ],
        sort: [{ 'file.mtime': { order: 'desc' } }],
        size: limit,
        // Population-true "which agents have monitored files" breakdown over the FULL matched
        // set: this tool sorts by file.mtime desc over thousands of FIM state docs against a
        // default limit of 20, so a page-scoped view of the agent list would misrepresent the
        // full population. wazuh.agent.name is on AGG_FIELD_ALLOWLIST and
        // wazuh-states-fim-files* is not a time-based index, so this passes checkAggs/lintDsl
        // unchanged — the population-true option is free here.
        aggs: {
          [aggNameForField('wazuh.agent.name')]: {
            terms: { field: 'wazuh.agent.name', size: BREAKDOWN_BUCKET_CAP },
          },
        },
      },
    };
  },
  tableSpec: {
    columns: [
      { field: 'wazuh.agent.name', label: 'Agent' },
      { field: 'file.path', label: 'Path' },
      { field: 'file.mtime', label: 'Modified' },
      { field: 'file.size', label: 'Size' },
      { field: 'file.owner', label: 'Owner' },
    ],
    rowFields: ['file.group', 'file.permissions', 'file.hash.sha256'],
  },
  // No synthetic breakdownDimensions: the REAL wazuh.agent.name aggregation above is
  // population-true by construction and takes priority in buildDigest, so a page-scoped
  // fallback here would never fire. The bucket keys are scrubbed the same way as any real
  // aggregation's (wazuh.agent.name has an anonymize/HOST policy entry in privacy.ts, resolved
  // via extractAggFields).
  digest: {
    sampleColumns: ['wazuh.agent.name', 'file.path', 'file.mtime', 'file.size'],
  },
};
