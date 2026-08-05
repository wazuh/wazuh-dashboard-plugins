import { ToolDefinition } from '../types';
import {
  clampLimit,
  INVENTORY_CURRENT_STATE_NOTE,
  limitProperty,
  objectSchema,
  validateAgentId,
} from './common';

/**
 * Wazuh 5.0 rewrite: the 4.14 Manager endpoint
 * `GET /syscollector/{agent_id}/packages` was REMOVED in 5.0 (returns 404 on 5.0). Package inventory
 * now lives in the `wazuh-states-inventory-packages` Indexer index (one doc per package; mapping
 * verified against a live 5.0 stack). Straight renames: name/version/architecture/vendor → package.*.
 */
export const getAgentPackagesTool: ToolDefinition = {
  spec: {
    name: 'get_agent_packages',
    description:
      'Lists installed software packages (name, version, architecture, vendor) for one agent ' +
      '(host/machine/endpoint). Use for "what software/packages are installed on agent X" ' +
      `questions. ${INVENTORY_CURRENT_STATE_NOTE}`,
    parameters: objectSchema(
      {
        agent_id: {
          type: 'string',
          description: 'Numeric Wazuh agent ID, e.g. "003".',
        },
        limit: limitProperty(
          'Max number of packages to return (default 50, max 500).',
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
      index: 'wazuh-states-inventory-packages*',
      body: {
        query: { bool: { filter: [{ term: { 'wazuh.agent.id': agentId } }] } },
        _source: [
          'package.name',
          'package.version',
          'package.architecture',
          'package.vendor',
        ],
        sort: ['_doc'],
        size: limit,
      },
    };
  },
  tableSpec: {
    columns: [
      { field: 'package.name', label: 'Package' },
      { field: 'package.version', label: 'Version' },
      { field: 'package.architecture', label: 'Architecture' },
      { field: 'package.vendor', label: 'Vendor' },
    ],
  },
  digest: {
    sampleColumns: [
      'package.name',
      'package.version',
      'package.architecture',
      'package.vendor',
    ],
  },
};
