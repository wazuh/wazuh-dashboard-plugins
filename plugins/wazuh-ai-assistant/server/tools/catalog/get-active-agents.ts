import { ToolDefinition } from '../types';
import { clampLimit, limitProperty, objectSchema } from './common';

/**
 * Ported from GET_ACTIVE_AGENTS (`wazuh_query_mappings_202606151220.md`): manager
 * `GET /agents?status=active&q=id!=000&limit=N` — excludes the manager's own pseudo-agent 000.
 */
export const getActiveAgentsTool: ToolDefinition = {
  spec: {
    name: 'get_active_agents',
    description: 'Lists currently connected (active) Wazuh agents.',
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
      params: { status: 'active', q: 'id!=000', limit },
    };
  },
  tableSpec: {
    columns: [
      { field: 'id', label: 'ID' },
      { field: 'name', label: 'Agent' },
      { field: 'ip', label: 'IP' },
      { field: 'status', label: 'Status' },
      { field: 'os.name', label: 'OS' },
      { field: 'version', label: 'Version' },
    ],
  },
  digest: { sampleColumns: ['id', 'name', 'ip', 'status'] },
};
