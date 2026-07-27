import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  validateAgentId,
} from './common';

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
      '"what monitored files changed recently" or "FIM state of file/path X" questions. Note: ' +
      'this is current state, not a change-event history.',
    parameters: objectSchema(
      {
        agent_id: {
          type: 'string',
          description:
            'Optional numeric Wazuh agent ID to scope to one agent, e.g. "003".',
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
              ...(pathPrefix ? [{ prefix: { 'file.path': pathPrefix } }] : []),
              ...(!agentId && !pathPrefix ? [{ match_all: {} }] : []),
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
  digest: {
    sampleColumns: ['wazuh.agent.name', 'file.path', 'file.mtime', 'file.size'],
  },
};
