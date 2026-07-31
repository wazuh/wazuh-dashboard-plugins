import { ToolDefinition } from '../types';
import { clampLimit, limitProperty, objectSchema } from './common';

const AGENT_STATUSES = [
  'active',
  'pending',
  'never_connected',
  'disconnected',
] as const;

/** Wazuh agent IDs are zero-padded numeric strings, e.g. "000", "001", "0512" (3+ digits) — same
 * format `common.ts`'s `validateAgentId` enforces for a single-ID param. */
const AGENT_ID_RE = /^\d{3,}$/;

function parseAgentIds(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }
  const ids = value.filter(
    (id): id is string => typeof id === 'string' && AGENT_ID_RE.test(id),
  );
  if (ids.length === 0) {
    throw new Error(
      'Parameter "agent_ids" must be a non-empty array of numeric Wazuh agent IDs (e.g. "001").',
    );
  }
  return ids;
}

function parseStatuses(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }
  const statuses = value.filter(
    (status): status is string =>
      typeof status === 'string' &&
      (AGENT_STATUSES as readonly string[]).includes(status),
  );
  if (statuses.length === 0) {
    throw new Error(
      `Parameter "status" must be one or more of: ${AGENT_STATUSES.join(', ')}.`,
    );
  }
  return statuses;
}

/**
 * Replaces `get_active_agents`/`get_disconnected_agents` (retired): the manager API's `/agents`
 * `status` enum has 4 values (`active`, `pending`, `never_connected`, `disconnected` — confirmed
 * in `plugins/main/common/api-info/endpoints.json`), and the two retired tools only ever covered
 * `active`/`disconnected` — `pending` and `never_connected` agents were invisible to the model.
 * One generic tool instead: `status` (omit for every status) and `agent_ids` (mapped to the
 * manager API's `agents_list` param, comma-separated — NOT a `q` filter). No filters at all still
 * excludes the manager's own pseudo-agent "000", same as the two retired tools did.
 */
export const getAgentsTool: ToolDefinition = {
  spec: {
    name: 'get_agents',
    description:
      'Lists Wazuh agents, optionally filtered by status (active, pending, never_connected, ' +
      'disconnected) and/or by exact agent ID. Omit both filters to list every agent.',
    parameters: objectSchema({
      agent_ids: {
        type: 'array',
        description: 'Exact numeric Wazuh agent IDs to filter by, e.g. ["001", "002"].',
        items: { type: 'string' },
      },
      status: {
        type: 'array',
        description:
          'One or more agent statuses to filter by: active, pending, never_connected, ' +
          'disconnected. Omit for every status.',
        items: { type: 'string', enum: [...AGENT_STATUSES] },
      },
      limit: limitProperty(
        'Max number of agents to return (default 20, max 500).',
      ),
    }),
  },
  target: 'manager',
  tier: 'T1',
  buildRequest(params) {
    const agentIds = parseAgentIds(params.agent_ids);
    const statuses = parseStatuses(params.status);
    const limit = clampLimit(params.limit, 20, 500);
    const managerParams: Record<string, unknown> = { limit };
    if (agentIds) {
      managerParams.agents_list = agentIds.join(',');
    } else {
      // No agent_ids filter: exclude the manager's own pseudo-agent "000", same as the retired
      // get_active_agents/get_disconnected_agents tools did.
      managerParams.q = 'id!=000';
    }
    if (statuses) {
      managerParams.status = statuses.join(',');
    }
    return {
      target: 'manager',
      method: 'GET',
      path: '/agents',
      params: managerParams,
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
    // `disconnection_time` only applies to disconnected agents (absent/irrelevant for
    // active/pending/never_connected); a row-only field so it appears in the expander when
    // present instead of a blank visible column for every other status.
    rowFields: ['disconnection_time'],
  },
  digest: {
    sampleColumns: ['id', 'name', 'ip', 'status'],
  },
};
