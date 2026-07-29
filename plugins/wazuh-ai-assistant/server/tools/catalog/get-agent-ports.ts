import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  validateAgentId,
} from './common';

/**
 * Wazuh 5.0 rewrite: the 4.14 Manager endpoint
 * `GET /syscollector/{agent_id}/ports` was REMOVED in 5.0 (returns 404 on 5.0). Port inventory now
 * lives in the `wazuh-states-inventory-ports` Indexer index (mapping verified against a live 5.0 stack).
 * ECS renames vs 4.14: local.ip/port→source.ip/port, remote.ip/port→destination.ip/port,
 * protocol→network.transport, state→interface.state, process/pid→process.name/process.pid.
 */
export const getAgentPortsTool: ToolDefinition = {
  spec: {
    name: 'get_agent_ports',
    description:
      'Lists open network ports (local IP/port, protocol, owning process) for one agent. Use ' +
      'for "what ports are open on agent X" questions.',
    parameters: objectSchema(
      {
        agent_id: {
          type: 'string',
          description: 'Numeric Wazuh agent ID, e.g. "003".',
        },
        limit: limitProperty(
          'Max number of ports to return (default 50, max 500).',
        ),
      },
      ['agent_id'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const agentId = validateAgentId(params.agent_id);
    const limit = clampLimit(params.limit, 50, 500);
    return {
      target: 'indexer',
      index: 'wazuh-states-inventory-ports*',
      body: {
        query: { bool: { filter: [{ term: { 'wazuh.agent.id': agentId } }] } },
        _source: [
          'source.ip',
          'source.port',
          'destination.ip',
          'destination.port',
          'network.transport',
          'interface.state',
          'process.name',
          'process.pid',
        ],
        sort: ['_doc'],
        size: limit,
      },
    };
  },
  tableSpec: {
    columns: [
      { field: 'source.ip', label: 'Local IP' },
      { field: 'source.port', label: 'Port' },
      { field: 'destination.ip', label: 'Remote IP' },
      { field: 'destination.port', label: 'Remote Port' },
      { field: 'network.transport', label: 'Protocol' },
      { field: 'interface.state', label: 'State' },
      { field: 'process.name', label: 'Process' },
      { field: 'process.pid', label: 'PID' },
    ],
  },
  digest: {
    sampleColumns: [
      'source.ip',
      'source.port',
      'destination.ip',
      'destination.port',
      'network.transport',
      'process.name',
    ],
  },
};
