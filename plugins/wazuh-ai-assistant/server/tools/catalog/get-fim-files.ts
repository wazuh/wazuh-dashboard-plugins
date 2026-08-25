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
      'including when the host is named rather than numbered ("what changed on win-ws-014"): ' +
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
        // EXPLAIN-WAVE PHASE 5 -- root cause of the EV2-FIM-001 escape-hatch drift in eval run
        // 20260825-193632 (tool_selection 1.00 -> 0.00, params 1.00 -> 0.00, and the whole `fim`
        // family drop). The question -- "which files changed on agent win-ws-014 according to file
        // integrity monitoring?" -- names the agent by NAME, and until now this tool accepted only
        // a numeric id. The baseline reached it anyway, but only by burning THREE rounds
        // (get_field_values -> search_wazuh_data -> get_fim_files "002"); phase 4 then added a
        // schema line telling the model to "resolve that name to its id first and pass the id",
        // which priced that detour explicitly and pushed the model to the escape hatch instead,
        // where `wazuh.agent.name` can simply be filtered in one call. The answer stayed correct
        // and got FASTER, so no prompt clause telling the model to prefer the named tool was ever
        // going to hold against that -- the honest fix is to remove the reason: the typed tool now
        // takes the identifier the user actually said. Same `agent_id`-wins precedence and the same
        // `match` clause get_agent_inventory's `resolveAgentFilter` uses, and `agent_name` is
        // already an entity-resolution.ts AGENT_NAME_PARAM_KEYS entry, so the pseudonymization
        // path that every other agent-name-taking tool gets applies here with no extra wiring.
        agent_name: {
          type: 'string',
          description:
            'Optional agent NAME to scope to one agent, e.g. "win-ws-014" -- use this whenever ' +
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
        // set (issue #8920 item 1): this tool sorts by file.mtime desc over thousands of FIM
        // state docs against a default limit of 20, so a page-scoped view of the agent list is
        // exactly the sample-narrated-as-population defect. wazuh.agent.name is on
        // AGG_FIELD_ALLOWLIST and wazuh-states-fim-files* is not a time-based index, so this
        // passes checkAggs/lintDsl unchanged — the population-true option is free here.
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
