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
 * `GET /syscollector/{agent_id}/processes` was REMOVED in 5.0 (returns 404 on 5.0). Process
 * inventory now lives in the `wazuh-states-inventory-processes` Indexer index (mapping
 * verified against a live 5.0 stack). Renames: pid/name/state→process.*, ppid→process.parent.pid,
 * cmd→process.command_line.
 *
 * DELIBERATE CAPABILITY DROP: the 4.14 "User" column
 * (euser/ruser) is GONE — wazuh-states-inventory-processes has no process-owner field at all
 * (full live mapping checked), and a cross-index join into inventory-users would be unreliable
 * (that index tracks login sessions, not process ownership). Dropped rather than faked; if a
 * 5.0 GA build adds an owner field, restore the column then.
 */
export const getAgentProcessesTool: ToolDefinition = {
  spec: {
    name: 'get_agent_processes',
    description:
      'Lists running processes (PID, name, state, command line) for one agent (host/machine/' +
      'endpoint). Use for "what processes are running on agent X" questions. Note: process ' +
      `owner/user is not available in Wazuh 5.0 process inventory. ${INVENTORY_CURRENT_STATE_NOTE}`,
    parameters: objectSchema(
      {
        agent_id: {
          type: 'string',
          description: 'Numeric Wazuh agent ID, e.g. "003".',
        },
        limit: limitProperty(
          'Max number of processes to return (default 50, max 500).',
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
      index: 'wazuh-states-inventory-processes*',
      body: {
        query: { bool: { filter: [{ term: { 'wazuh.agent.id': agentId } }] } },
        _source: [
          'process.pid',
          'process.name',
          'process.state',
          'process.parent.pid',
          'process.command_line',
        ],
        sort: ['_doc'],
        size: limit,
      },
    };
  },
  tableSpec: {
    columns: [
      { field: 'process.pid', label: 'PID' },
      { field: 'process.name', label: 'Name' },
      { field: 'process.state', label: 'State' },
      { field: 'process.parent.pid', label: 'Parent PID' },
      { field: 'process.command_line', label: 'Command' },
    ],
  },
  digest: {
    sampleColumns: [
      'process.pid',
      'process.name',
      'process.state',
      'process.command_line',
    ],
  },
};
