import { ToolSpec } from '../../common/types';
import { getToolDefinition, listToolDefinitions } from './registry';

/**
 * Two-stage tool router: a cheap stage-1 call picks 1-2 coarse
 * categories via one tiny synthetic tool (`route_question`); stage 2 (server/routes/chat.ts's
 * `orchestrate`) re-invokes the model with only those categories' real tools instead of the full
 * ~28-tool catalog every round. This file owns everything the router needs that isn't
 * orchestration control flow (that stays in chat.ts per the design's "adapters/route own the loop"
 * split): the category membership map, the stage-1 ToolSpec, its system prompt, and the stage-2
 * tool-list resolver.
 *
 * `ROUTER_ENABLED` is the kill switch: false reproduces today's behavior exactly (chat.ts's
 * orchestrate() falls back to `listToolSpecs()` for every turn, unconditionally) — a
 * trivially-auditable single-constant flip, per the product owner's explicit requirement.
 */
export const ROUTER_ENABLED = true;

export type RouterCategory =
  | 'agents'
  | 'findings'
  | 'vulnerabilities'
  | 'fim'
  | 'sca'
  | 'mitre'
  | 'inventory'
  | 'compliance'
  | 'security_analytics'
  | 'free_search'
  | 'general';

/**
 * The category map, keyed by TOOL NAME (not by category): each registry tool name maps to exactly
 * one `RouterCategory` by construction (a plain object literal cannot give one key two values), so
 * the "every tool belongs to exactly one category" invariant the product owner asked for is
 * structurally guaranteed here rather than merely checked. `assertRegistryConsistency()` below
 * still verifies the OTHER direction at module load — that every tool the registry actually
 * contains has an entry here at all — so a new catalog tool that forgets to add itself here fails
 * loudly at plugin start instead of silently never being routed to.
 *
 * `general` (no tools) and `free_search` (the escape hatch, `search_wazuh_data`) are not listed as
 * map values for any OTHER tool; `search_wazuh_data` is also always appended to stage 2's resolved
 * tool list regardless of routed category (see `resolveStage2Tools`), so its category membership
 * here is mostly documentary.
 */
const TOOL_CATEGORY: Record<string, RouterCategory> = {
  // agents
  get_agents: 'agents',

  // findings
  get_critical_findings: 'findings',
  search_findings_by_agent: 'findings',
  get_top_rules: 'findings',
  get_findings_by_time: 'findings',
  get_brute_force: 'findings',
  get_security_summary: 'findings',
  get_suspicious_powershell: 'findings',
  search_findings_by_rule_title: 'findings',
  search_findings_by_rule_tag: 'findings',
  search_findings_by_multiple_agents: 'findings',
  search_findings_by_os: 'findings',

  // vulnerabilities
  get_vulnerabilities: 'vulnerabilities',
  get_vulnerabilities_by_agent: 'vulnerabilities',
  get_vulnerability_by_cve: 'vulnerabilities',
  get_critical_vulnerabilities: 'vulnerabilities',

  // fim
  get_fim_files: 'fim',

  // sca
  get_sca_results: 'sca',
  get_sca_checks: 'sca',

  // mitre
  get_mitre_findings: 'mitre',
  get_mitre_summary: 'mitre',

  // inventory (syscollector)
  get_agent_os: 'inventory',
  get_agent_packages: 'inventory',
  get_agent_ports: 'inventory',
  get_agent_processes: 'inventory',

  // compliance
  get_compliance_alerts: 'compliance',
  get_compliance_summary: 'compliance',

  // security_analytics
  get_detection_rules: 'security_analytics',
  get_threat_intel_components: 'security_analytics',

  // free_search (escape hatch + generic ID lookup)
  find_document_by_field: 'free_search',
  search_wazuh_data: 'free_search',
};

/** Fixed menu order for both the enum on the wire and the routing prompt's category list. */
const CATEGORY_ORDER: RouterCategory[] = [
  'agents',
  'findings',
  'vulnerabilities',
  'fim',
  'sca',
  'mitre',
  'inventory',
  'compliance',
  'security_analytics',
  'free_search',
  'general',
];

/** One-line descriptions for the stage-1 routing prompt's category menu. Keep these short — every
 * character here is paid for on every turn (stage-1 token budget). */
const CATEGORY_DESCRIPTIONS: Record<RouterCategory, string> = {
  agents:
    'Agent listing by status (active, pending, never_connected, disconnected) and/or agent ID.',
  findings:
    'Finding search/summaries: critical findings, by agent/rule/rule-tag/OS/time, top rules, ' +
    'brute-force, suspicious PowerShell, general security summary.',
  vulnerabilities:
    'CVE/vulnerability data: by agent, by CVE ID, solved, or critical only.',
  fim: 'File Integrity Monitoring: current state of monitored files (path, mtime, owner, hashes).',
  sca: 'Security Configuration Assessment (SCA) policy results.',
  mitre:
    'MITRE ATT&CK technique/tactic findings and technique-frequency summaries.',
  inventory:
    'Syscollector inventory: agent OS, installed packages, open ports, running processes.',
  compliance:
    'Compliance findings/summaries for any of 10 frameworks (PCI DSS, HIPAA, GDPR, ISO 27001, ' +
    'NIS2, NIST 800-171/800-53, FedRAMP, CMMC, TSC).',
  security_analytics:
    'The detection ruleset and pipeline content itself — rules (name/level/status/technique) ' +
    'and components (decoders, integrations, policies, filters, KVDBs). Configuration, NOT ' +
    'findings that fired.',
  free_search:
    'Anything else about Wazuh finding/vulnerability/state data (last resort).',
  general:
    'No Wazuh data needed at all: greeting, meta-question, clarification, chit-chat.',
};

/**
 * Grouped the other way round (category -> tool names) for `resolveStage2Tools`. Derived from
 * `TOOL_CATEGORY` rather than hand-duplicated, so the two can never drift apart.
 */
function groupToolsByCategory(): Record<RouterCategory, string[]> {
  const grouped = Object.fromEntries(
    CATEGORY_ORDER.map(cat => [cat, [] as string[]]),
  ) as Record<RouterCategory, string[]>;
  for (const [toolName, category] of Object.entries(TOOL_CATEGORY)) {
    grouped[category].push(toolName);
  }
  return grouped;
}

const CATEGORY_TOOLS = groupToolsByCategory();

/**
 * Registry-consistency guard: every tool the registry actually contains must
 * have exactly one entry in `TOOL_CATEGORY` above. Runs at module load (i.e. at plugin start,
 * since server/routes/chat.ts imports this module which is loaded once when the route is
 * registered) so a future catalog tool that forgets to add itself to `TOOL_CATEGORY` fails loudly
 * immediately instead of silently being excluded from every routed category (and therefore
 * unreachable once the router is enabled).
 */
function assertRegistryConsistency(): void {
  const registryToolNames = listToolDefinitions().map(def => def.spec.name);
  const missing = registryToolNames.filter(
    name => TOOL_CATEGORY[name] === undefined,
  );
  if (missing.length > 0) {
    throw new Error(
      'wazuhAiAssistant router: the following registry tools have no router category assigned in ' +
        `server/tools/router.ts's TOOL_CATEGORY map: ${missing.join(
          ', ',
        )}. Add each to exactly ` +
        'one category before starting the plugin.',
    );
  }
  // The reverse check (a TOOL_CATEGORY entry naming a tool the registry no longer has) is a stale
  // mapping, not a routing hole, but still worth failing on loudly rather than routing to a name
  // resolveStage2Tools will silently drop (see its `getToolDefinition(name)` guard below).
  const registryToolNameSet = new Set(registryToolNames);
  const stale = Object.keys(TOOL_CATEGORY).filter(
    name => !registryToolNameSet.has(name),
  );
  if (stale.length > 0) {
    throw new Error(
      'wazuhAiAssistant router: TOOL_CATEGORY names tool(s) not present in the registry: ' +
        `${stale.join(
          ', ',
        )}. Remove them from server/tools/router.ts or fix the registry.`,
    );
  }
}

assertRegistryConsistency();

/**
 * Stage-1's single synthetic tool. Internal only: server/routes/chat.ts's orchestration loop must
 * never emit this as an SSE `tool_call` event and must never route it through `executeToolCall`
 * — it exists purely to force a structured pick out of the model via normal
 * tool-calling, reusing the exact same wire mechanics (and provider adapters) as every other tool
 * instead of inventing a second calling convention.
 */
export const ROUTE_QUESTION_TOOL: ToolSpec = {
  name: 'route_question',
  description:
    'Pick the 1-2 categories of Wazuh data needed to answer the user. Internal routing step only.',
  parameters: {
    type: 'object',
    properties: {
      categories: {
        type: 'array',
        description: 'One or two category names, most relevant first.',
        items: { type: 'string', enum: CATEGORY_ORDER },
        minItems: 1,
        maxItems: 2,
      },
    },
    required: ['categories'],
  },
};

/**
 * Stage-1 system prompt: role line + current time + compact category menu +
 * instruction to pick 1-2. Deliberately terse — no tool descriptions, no examples — since every
 * token here plus `ROUTE_QUESTION_TOOL`'s schema is paid for on every turn regardless of which
 * provider answers.
 *
 */
export function buildRoutingPrompt(nowIso: string): string {
  const menu = CATEGORY_ORDER.map(
    cat => `- ${cat}: ${CATEGORY_DESCRIPTIONS[cat]}`,
  ).join('\n');
  return [
    'You are the routing pre-step for the Wazuh AI Assistant. Do not answer the user yet.',
    `The current UTC time is ${nowIso}.`,
    "Pick the 1-2 categories of Wazuh data most likely needed to answer the user's last message, " +
      'then call route_question with them, most relevant first. If no Wazuh data is needed at ' +
      'all (greeting, meta-question, clarification, chit-chat), pick "general" alone.',
    'Categories:',
    menu,
    'Call route_question now.',
  ].join('\n');
}

/**
 * Stage-2 tool-list resolver: union of the routed categories' tools, plus
 * `search_wazuh_data` always appended (deduped) as the safety-valve escape hatch — UNLESS the
 * model routed to `general` alone, in which case this returns `undefined` so chat.ts's orchestrate
 * loop skips tools entirely for the turn (today's plain-text-only behavior, options with `tools`
 * undefined).
 *
 * `categories` is expected to already be schema-validated (schema-validator.ts against
 * `ROUTE_QUESTION_TOOL.parameters`, done by the caller in chat.ts) so every entry is one of
 * `CATEGORY_ORDER`; this function still defensively drops anything unrecognized rather than
 * trusting that invariant blindly.
 */
export function resolveStage2Tools(
  categories: string[],
): ToolSpec[] | undefined {
  const valid = categories.filter((cat): cat is RouterCategory =>
    (CATEGORY_ORDER as string[]).includes(cat),
  );

  if (valid.length === 1 && valid[0] === 'general') {
    return undefined;
  }

  const toolNames = new Set<string>();
  for (const category of valid) {
    for (const toolName of CATEGORY_TOOLS[category]) {
      toolNames.add(toolName);
    }
  }
  // Always-on escape hatch, deduped via the Set regardless of whether
  // `free_search` was itself one of the routed categories.
  toolNames.add('search_wazuh_data');

  const specs: ToolSpec[] = [];
  for (const name of toolNames) {
    const def = getToolDefinition(name);
    if (!def) {
      continue;
    }
    specs.push(def.spec);
  }
  return specs;
}
