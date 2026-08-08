import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../../src/core/server';
import { ResolveParamsResult, ToolDefinition } from '../types';
import { resolveApiHostId } from '../api-host';
import {
  clampLimit,
  INVENTORY_CURRENT_STATE_NOTE,
  limitProperty,
  objectSchema,
  optionalStringParam,
  validateAgentId,
} from './common';

/**
 * The 5 kinds this tool implements tonight, out of the 13 real `wazuh-states-inventory-*`
 * surfaces (`plugins/main/common/constants.ts`'s `WAZUH_IT_HYGIENE_*`). Enum kept to exactly
 * these 5 rather than listing all 13 with the other 8 rejected at call time: a listed-but-
 * rejected enum value is a worse model experience than simply not offering it (the model wastes a
 * call/round-trip discovering the rejection instead of never considering it), and the smaller enum
 * is itself a few fewer schema tokens on every routed turn -- the same token-conscious reasoning
 * this whole tool exists for. The other 8 (hardware, interfaces, networks, protocols, users,
 * groups, services, browser-extensions) each need their own live-mapping verification pass before
 * they can be added the same way `hotfixes` was tonight -- see this file's own doc comment on
 * `INVENTORY_KIND_CONFIG` for what "verified" means in practice.
 */
const INVENTORY_KINDS = [
  'os',
  'packages',
  'ports',
  'processes',
  'hotfixes',
] as const;
type InventoryKind = (typeof INVENTORY_KINDS)[number];

interface InventoryKindConfig {
  /** The concrete `wazuh-states-inventory-*` index this kind reads. `os` is the one naming
   * exception carried over from get-agent-os.ts: it reads the `system` sub-index, not a literal
   * `os` one. */
  index: string;
  /** Outbound `_source` field list -- for `os`/`packages`/`ports`/`processes`, copied
   * byte-for-byte (contents AND order) from get-agent-os.ts/get-agent-packages.ts/
   * get-agent-ports.ts/get-agent-processes.ts, now folded into this one tool and deleted as
   * standalone files. Part of the outbound Indexer request contract for those four; see
   * get-agent-inventory.test.ts's regression assertions for the exact byte-for-byte match. */
  source: string[];
  /** `[defaultLimit, maxLimit]` for `clampLimit`, applied to the caller's `limit` param. Every
   * kind except `os` uses this (all four originally had their own `limitProperty`/`clampLimit`
   * call with these exact bounds). */
  limitRange?: [number, number];
  /** Fixed query `size`, bypassing the `limit` param entirely -- only `os` uses this, matching
   * get-agent-os.ts's original hardcoded `size: 5` (one agent has at most one current OS record;
   * the original tool never exposed a `limit` parameter at all). */
  fixedSize?: number;
}

/**
 * `hotfixes` is the one kind added beyond the 4 folded-in ones (issue 12, step 2's first
 * addition): it pairs with the vulnerability tools for patch-management questions and was
 * previously invisible to the assistant entirely (zero prior mentions of "hotfix" in this
 * plugin). Its `_source` list is deliberately just the one field this repo can actually confirm
 * live for `wazuh-states-inventory-hotfixes*`: `package.hotfix.name`, per `plugins/main`'s own
 * IT Hygiene hotfixes table (`public/components/overview/it-hygiene/packages/inventories/
 * hotfixes/table-columns.ts`) and sample-data generator (`server/lib/sample-data/dataset/
 * states-inventory-hotfixes/main.js`), both checked into this repo and already queried live by
 * that dashboard. No index template/mapping JSON for this index is checked in anywhere in this
 * repo (unlike `wazuh-states-vulnerabilities`'s, which get-vulnerability-by-cve.ts cites
 * directly) -- so rather than guess at plausible sibling fields (an install date, a KB URL) with
 * no checked-in evidence either way, this stays to the one field actually confirmed. The other 8
 * uncovered kinds each need this same standard of evidence before being added.
 */
const INVENTORY_KIND_CONFIG: Record<InventoryKind, InventoryKindConfig> = {
  os: {
    index: 'wazuh-states-inventory-system*',
    source: [
      'host.hostname',
      'host.os.name',
      'host.os.version',
      'host.os.platform',
      'host.os.full',
      'host.architecture',
    ],
    fixedSize: 5,
  },
  packages: {
    index: 'wazuh-states-inventory-packages*',
    source: [
      'package.name',
      'package.version',
      'package.architecture',
      'package.vendor',
    ],
    limitRange: [50, 500],
  },
  ports: {
    index: 'wazuh-states-inventory-ports*',
    source: [
      'source.ip',
      'source.port',
      'destination.ip',
      'destination.port',
      'network.transport',
      'interface.state',
      'process.name',
      'process.pid',
    ],
    limitRange: [50, 500],
  },
  processes: {
    index: 'wazuh-states-inventory-processes*',
    source: [
      'process.pid',
      'process.name',
      'process.state',
      'process.parent.pid',
      'process.command_line',
    ],
    limitRange: [50, 500],
  },
  hotfixes: {
    index: 'wazuh-states-inventory-hotfixes*',
    source: ['package.hotfix.name'],
    limitRange: [50, 500],
  },
};

/** Validates `kind` against the 5 implemented values; throws a descriptive Error (turned into a
 * bounded tool_result error for the model to self-correct, same convention as every other
 * catalog `buildRequest` in this directory) for anything else -- including one of the other 8
 * real-but-unimplemented `wazuh-states-inventory-*` surfaces, which this tool's enum never offers
 * in the first place (see this file's header doc comment for why that is the better model
 * experience than listing-then-rejecting). */
function parseKind(value: unknown): InventoryKind {
  if (
    typeof value === 'string' &&
    (INVENTORY_KINDS as readonly string[]).includes(value)
  ) {
    return value as InventoryKind;
  }
  throw new Error(
    `Parameter "kind" must be one of: ${INVENTORY_KINDS.join(
      ', ',
    )}; got ${JSON.stringify(value)}.`,
  );
}

/** Shared by `resolveAgentFilter`'s own throw (a direct `buildRequest` call with neither
 * identifier, e.g. from a unit test) and `resolveDeicticAgentParams`'s failure paths below (issue
 * #8913) so the two can never drift into different wording for the same underlying situation. */
const NO_AGENT_IDENTIFIER_ERROR =
  'Either "agent_id" (numeric Wazuh agent ID, e.g. "003") or "agent_name" (the agent\'s name) ' +
  'is required. If neither is known, call get_agents first to look it up.';

/**
 * Resolves the agent-identifying filter clause from `agent_id`/`agent_name` (issue #8873: a live
 * 40-question run invoked this tool 0/40 times, including on 3 questions statically targeting it,
 * because `agent_id` was strictly required and numeric while the target personas ask deictically
 * -- "this server", "the host" -- with no id the model can infer. Elsewhere in the SAME run the
 * model resolved an agent by calling `get_agents` first, unprompted, so the blocker was this
 * tool's schema, not model reluctance or routing).
 *
 * `agent_id` wins when both are supplied: it is an exact, unambiguous Manager-API identifier,
 * whereas `agent_name` resolves via a `match` clause (free-text, same precedent as
 * search-findings-by-agent.ts) that could in principle match more than one document -- given a
 * caller-supplied id, there is no reason to prefer the fuzzier path. Neither supplied throws a
 * descriptive Error naming both options, same self-correction convention as `validateAgentId`
 * and `parseKind` below (the orchestration loop turns a thrown Error into a bounded tool_result
 * the model reads and can retry from).
 *
 * In normal (non-test) operation this "neither supplied" branch is no longer actually reachable
 * for get_agent_inventory specifically: `resolveDeicticAgentParams` below always runs first (as
 * this tool's `resolveParams` hook) and either injects an `agent_id` or fails the call itself
 * before `buildRequest` -- see that function's doc comment for why (issue #8913). Left in place,
 * unchanged, as defense in depth and because a direct unit-level `buildRequest` call (this file's
 * own tests) bypasses `resolveParams` entirely.
 */
function resolveAgentFilter(
  params: Record<string, unknown>,
): Record<string, unknown> {
  if (params.agent_id !== undefined) {
    return { term: { 'wazuh.agent.id': validateAgentId(params.agent_id) } };
  }
  const agentName = optionalStringParam(params.agent_name);
  if (agentName && agentName.trim() !== '') {
    return { match: { 'wazuh.agent.name': agentName } };
  }
  throw new Error(NO_AGENT_IDENTIFIER_ERROR);
}

/** How many active-agent candidates `resolveDeicticAgentParams` lists in its "which agent?" error
 * when more than one is found -- bounded so a deployment with hundreds of active agents doesn't
 * blow the bounded tool-result error budget. The Manager API's own `total_affected_items` still
 * tells the model the true count even when the listed names are a prefix of it. */
const MAX_LISTED_AGENT_CANDIDATES = 10;
/** Fetch size for the active-agent lookup -- one more than the cap above purely so a result of
 * exactly `MAX_LISTED_AGENT_CANDIDATES + 1` active agents is still reported with an accurate
 * "+N more" rather than looking like an exact match for the cap. */
const AGENT_LOOKUP_LIMIT = MAX_LISTED_AGENT_CANDIDATES + 1;
/** Same pseudo-agent exclusion `get-agents.ts`'s own "no agent_ids filter" branch applies (its own
 * `q: 'id!=000'`), so a deployment with otherwise zero real active agents cannot silently resolve
 * to the manager's own pseudo-agent "000". */
const MANAGER_PSEUDO_AGENT_QUERY = 'id!=000';

interface ManagerAgentSummary {
  id?: unknown;
  name?: unknown;
}

/**
 * `ToolDefinition.resolveParams` hook (issue #8913): resolves a deictic agent reference ("this
 * server", "the host") server-side instead of relying on the model to comply with the system
 * prompt's instruction to call `get_agents` first. That instruction is real and still correct
 * guidance (kept, unchanged) -- but a live-verified N=5 run of the issue's own worked example
 * ("What software does this box have installed?") found the model followed it 0/5 times (4/5
 * asked the user to name an agent instead of looking one up; 1/5 called `search_wazuh_data` and
 * found nothing). Prompt compliance alone cannot be guaranteed, so this makes correctness
 * independent of it.
 *
 * Only runs when NEITHER `agent_id` NOR `agent_name` was supplied -- a call that supplies either
 * returns `params` unchanged (`ok: true`, no note), so `resolveAgentFilter`'s existing validation
 * for an explicitly-identified call is completely untouched by this hook, and this branch can
 * never weaken it.
 *
 * Queries the SAME source `get_agents` reads (`GET /agents`, Manager API) with the SAME "active"
 * status filter and pseudo-agent exclusion `catalog/get-agents.ts` itself applies -- not a new or
 * different notion of "the agent" than what the model would have found by calling `get_agents`.
 *
 * - Exactly one active agent: proceeds with it (`agent_id` injected into the returned params) and
 *   attaches a `note` naming which agent was assumed -- surfaced to the model via
 *   `Digest.assumptionNote` (digest.ts/executor.ts), so the assumption is visible and the model is
 *   expected to STATE it, not silently act on it as if the user had named that agent.
 * - Zero or more than one active agent: returns the existing "which agent?" error text
 *   (`NO_AGENT_IDENTIFIER_ERROR`), extended with the candidate list when there is more than one,
 *   so the model can ask a narrower, informed follow-up instead of a bare "which agent do you
 *   mean".
 * - The lookup call itself failing (Manager API unreachable, auth failure, ...) falls back to the
 *   same plain `NO_AGENT_IDENTIFIER_ERROR` rather than surfacing a raw lookup failure -- the model
 *   still gets a bounded, actionable message instead of a confusing secondary error layered on top
 *   of the original ambiguity.
 */
async function resolveDeicticAgentParams(
  params: Record<string, unknown>,
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest,
): Promise<ResolveParamsResult> {
  if (params.agent_id !== undefined) {
    return { ok: true, resolved: { params } };
  }
  const agentName = optionalStringParam(params.agent_name);
  if (agentName && agentName.trim() !== '') {
    return { ok: true, resolved: { params } };
  }

  let agents: ManagerAgentSummary[];
  let totalActive: number;
  try {
    const apiHostID = await resolveApiHostId(context, request);
    const response = await context.wazuh_core.api.client.asCurrentUser.request(
      'GET',
      '/agents',
      {
        params: {
          status: 'active',
          q: MANAGER_PSEUDO_AGENT_QUERY,
          limit: AGENT_LOOKUP_LIMIT,
        },
      },
      { apiHostID },
    );
    const data = (
      response.data as
        | {
            data?: {
              affected_items?: unknown;
              total_affected_items?: unknown;
            };
          }
        | undefined
    )?.data;
    agents = Array.isArray(data?.affected_items)
      ? (data.affected_items as ManagerAgentSummary[])
      : [];
    totalActive =
      typeof data?.total_affected_items === 'number'
        ? data.total_affected_items
        : agents.length;
  } catch {
    return { ok: false, reason: NO_AGENT_IDENTIFIER_ERROR };
  }

  if (agents.length === 0) {
    return {
      ok: false,
      reason:
        `${NO_AGENT_IDENTIFIER_ERROR} (No active agent was found to assume by default -- the ` +
        'intended agent may be pending/disconnected/never_connected; call get_agents to find it.)',
    };
  }

  if (agents.length === 1 && typeof agents[0].id === 'string') {
    const resolvedId = agents[0].id;
    const resolvedName =
      typeof agents[0].name === 'string' ? agents[0].name : resolvedId;
    return {
      ok: true,
      resolved: {
        params: { ...params, agent_id: resolvedId },
        note:
          'No "agent_id"/"agent_name" was given, so this call was resolved to the only active ' +
          `agent, "${resolvedName}" (id ${resolvedId}). State this assumption to the user rather ` +
          'than presenting the result as if a specific agent had been named.',
      },
    };
  }

  const candidates = agents.slice(0, MAX_LISTED_AGENT_CANDIDATES).map(agent =>
    typeof agent.name === 'string' && typeof agent.id === 'string'
      ? `"${agent.name}" (id ${agent.id})`
      : `id ${String(agent.id)}`,
  );
  const remaining = totalActive - candidates.length;
  return {
    ok: false,
    reason:
      `${NO_AGENT_IDENTIFIER_ERROR} (${totalActive} active agents exist, so which one is meant ` +
      `cannot be assumed. Candidates: ${candidates.join(', ')}` +
      `${remaining > 0 ? `, and ${remaining} more` : ''}.)`,
  };
}

/**
 * Replaces `get_agent_os`/`get_agent_packages`/`get_agent_ports`/`get_agent_processes` (issue:
 * "Consolidate agent inventory into one tool") with one tool taking `agent_id`/`agent_name` +
 * `kind` + `limit` (the `agent_id`-only original schema was later found, live, to make deictic
 * questions -- "what's installed on this server" -- uncallable; see `resolveAgentFilter`'s doc
 * comment and issue #8873).
 * Drops the inventory category's schema count from 4 to 1 on every routed turn while raising
 * coverage from 4 of the 13 real `wazuh-states-inventory-*` surfaces to 5 (adds `hotfixes`).
 *
 * `tableSpec.columns`/`digest.sampleColumns` are intentionally empty with `deriveColumns: true`
 * (the mechanism `search_wazuh_data` already uses for the same reason -- see
 * server/tools/types.ts's `deriveColumns` doc comment): a single `ToolDefinition` cannot declare
 * a STATIC table shape that is also correct for 5 different `kind` values with 5 different field
 * sets, and `digest.ts`'s `deriveResultColumns` already reads the executed request's own
 * `_source` list as its first priority -- which this tool always sets per-kind (see
 * `INVENTORY_KIND_CONFIG` above) -- so the rendered table's columns are still exactly each kind's
 * field list, in that order, just labeled by the field's last dot-path segment instead of the
 * four original tools' hand-picked labels ("host.os.name" -> "Name" rather than "OS"). That label
 * difference is the one visible deviation from a byte-for-byte port; the underlying data (fields,
 * order, values) is unchanged, which is what get-agent-inventory.test.ts's regression assertions
 * check.
 */
export const getAgentInventoryTool: ToolDefinition = {
  spec: {
    name: 'get_agent_inventory',
    description:
      'Retrieves one kind of syscollector inventory data for one agent (host/machine/endpoint): ' +
      '"os" (operating system details), "packages" (installed software), "ports" (open network ' +
      'ports), "processes" (running processes), or "hotfixes" (installed Windows hotfixes/KBs -- ' +
      'pairs with the vulnerability tools for patch-management questions, e.g. "which of these ' +
      'critical vulnerabilities already have a hotfix available"). Identify the agent by ' +
      '"agent_id" (numeric) OR "agent_name" -- if the question refers to "this server"/"the ' +
      'host" without naming or numbering it, and no agent id or name is otherwise known from the ' +
      `conversation, call get_agents first to look one up. ${INVENTORY_CURRENT_STATE_NOTE}`,
    parameters: objectSchema(
      {
        agent_id: {
          type: 'string',
          description:
            'Numeric Wazuh agent ID, e.g. "003". Either this or agent_name is required.',
        },
        agent_name: {
          type: 'string',
          description:
            'Agent name, e.g. "web-prod-01" -- use this when the id is not known. Either this ' +
            'or agent_id is required; if both are given, agent_id wins.',
        },
        kind: {
          type: 'string',
          description:
            'Which inventory surface to read: os, packages, ports, processes, or hotfixes.',
          enum: [...INVENTORY_KINDS],
        },
        limit: limitProperty(
          'Max number of rows to return (default 50, max 500). Ignored for kind="os": one agent ' +
            'has at most one current OS record, so this always returns at most 5 rows regardless.',
        ),
      },
      ['kind'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const agentFilter = resolveAgentFilter(params);
    const kind = parseKind(params.kind);
    const config = INVENTORY_KIND_CONFIG[kind];
    const size =
      config.fixedSize ??
      clampLimit(
        params.limit,
        config.limitRange?.[0] ?? 50,
        config.limitRange?.[1] ?? 500,
      );
    return {
      target: 'indexer',
      index: config.index,
      body: {
        query: {
          bool: { filter: [agentFilter] },
        },
        _source: config.source,
        sort: ['_doc'],
        size,
      },
    };
  },
  tableSpec: { columns: [] },
  digest: { sampleColumns: [] },
  deriveColumns: true,
  resolveParams: resolveDeicticAgentParams,
};
