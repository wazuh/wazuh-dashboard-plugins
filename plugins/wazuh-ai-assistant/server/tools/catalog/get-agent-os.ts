import { ToolDefinition } from '../types';
import {
  INVENTORY_CURRENT_STATE_NOTE,
  objectSchema,
  validateAgentId,
} from './common';

/**
 * Wazuh 5.0 rewrite: the 4.14 Manager endpoint
 * `GET /syscollector/{agent_id}/os` was REMOVED in 5.0 (returns 404 on 5.0). OS inventory now lives
 * in the `wazuh-states-inventory-system` Indexer index (one doc per agent; mapping verified against a live 5.0 stack). Field renames vs 4.14: hostname→host.hostname, os.*→host.os.*,
 * architecture→host.architecture (was a top-level sibling of os); the old scan.time has no
 * equivalent (state.modified_at is write-time) and is dropped. Bonus 5.0 fields worth showing:
 * host.os.full (pretty name) and the kernel release.
 */
export const getAgentOsTool: ToolDefinition = {
  spec: {
    name: 'get_agent_os',
    description:
      'Retrieves operating system details (name, version, platform, architecture) for one agent ' +
      '(host/machine/endpoint). Use for "what OS is agent X running" questions. ' +
      INVENTORY_CURRENT_STATE_NOTE,
    parameters: objectSchema(
      {
        agent_id: {
          type: 'string',
          description: 'Numeric Wazuh agent ID, e.g. "003".',
        },
      },
      ['agent_id'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const agentId = validateAgentId(params.agent_id);
    return {
      target: 'indexer',
      index: 'wazuh-states-inventory-system*',
      body: {
        query: { bool: { filter: [{ term: { 'wazuh.agent.id': agentId } }] } },
        _source: [
          'host.hostname',
          'host.os.name',
          'host.os.version',
          'host.os.platform',
          'host.os.full',
          'host.architecture',
        ],
        sort: ['_doc'],
        size: 5,
      },
    };
  },
  tableSpec: {
    columns: [
      { field: 'host.hostname', label: 'Hostname' },
      { field: 'host.os.name', label: 'OS' },
      { field: 'host.os.version', label: 'Version' },
      { field: 'host.os.platform', label: 'Platform' },
      { field: 'host.architecture', label: 'Architecture' },
    ],
    rowFields: ['host.os.full'],
  },
  digest: {
    sampleColumns: [
      'host.hostname',
      'host.os.name',
      'host.os.version',
      'host.architecture',
    ],
  },
};
