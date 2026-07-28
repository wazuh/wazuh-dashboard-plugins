import { ToolDefinition } from '../types';
import { clampLimit, limitProperty, objectSchema } from './common';

/**
 * Ported from GET_DISCONNECTED_AGENTS: manager
 * `GET /agents?status=disconnected&q=id!=000&limit=N`.
 */
export const getDisconnectedAgentsTool: ToolDefinition = {
  spec: {
    name: 'get_disconnected_agents',
    description: 'Lists Wazuh agents that are currently disconnected.',
    parameters: objectSchema({
      limit: limitProperty(
        'Max number of agents to return (default 20, max 500).',
      ),
    }),
  },
  target: 'manager',
  tier: 'T1',
  buildRequest(params) {
    const limit = clampLimit(params.limit, 20, 500);
    return {
      target: 'manager',
      method: 'GET',
      path: '/agents',
      params: { status: 'disconnected', q: 'id!=000', limit },
    };
  },
  tableSpec: {
    columns: [
      { field: 'id', label: 'ID' },
      { field: 'name', label: 'Agent' },
      { field: 'ip', label: 'IP' },
      { field: 'status', label: 'Status' },
      { field: 'os.name', label: 'OS' },
      { field: 'disconnection_time', label: 'Disconnected since' },
    ],
  },
  digest: { sampleColumns: ['id', 'name', 'ip', 'disconnection_time'] },
};
