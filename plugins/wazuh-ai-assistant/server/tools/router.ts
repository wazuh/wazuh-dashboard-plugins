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
 * `general` (minimal recovery set, not "no tools" — see `resolveStage2Tools`) and `free_search`
 * (the escape hatch, `search_wazuh_data`) are not listed as map values for any OTHER tool;
 * `search_wazuh_data` is also always appended to stage 2's resolved tool list regardless of routed
 * category (see `resolveStage2Tools`), so its category membership here is mostly documentary.
 */
const TOOL_CATEGORY: Record<string, RouterCategory> = {
  // agents
  get_agents: 'agents',

  // findings
  get_critical_findings: 'findings',
  search_findings_by_agent: 'findings',
  get_top_rules: 'findings',
  // get_top_agents ranks agents over either findings or events (its own `index` param) -- filed
  // under 'findings' for the same reason as get_events_by_agent below: it is the common case and
  // costs no extra stage-1 category.
  get_top_agents: 'findings',
  get_findings_by_time: 'findings',
  // get_events_by_agent (issue: "Add a typed events tool over wazuh-events-v5") targets the raw
  // event stream, not findings -- but it is filed under 'findings' rather than a new 'events'
  // category. Rationale: a dedicated category costs one more line on the stage-1 routing menu
  // (CATEGORY_DESCRIPTIONS) on EVERY turn regardless of whether it is ever picked, and users
  // conflate "what happened"/"events" with "findings" in exactly the way the issue's own
  // reproduction shows (a findings-only tool call for an "everything that happened" question) --
  // filing this under 'findings' means it is reachable whenever the model (mis)routes an
  // events-shaped question there, which is the common case, at zero extra stage-1 cost.
  get_events_by_agent: 'findings',
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
  // get_cve_intel (workstream A1b) keys off a CVE id like get_vulnerability_by_cve -- same
  // category, no extra stage-1 line.
  get_cve_intel: 'vulnerabilities',

  // fim
  get_fim_files: 'fim',

  // sca
  get_sca_results: 'sca',
  get_sca_checks: 'sca',

  // mitre
  get_mitre_findings: 'mitre',
  get_mitre_summary: 'mitre',

  // inventory (syscollector) -- get_agent_os/get_agent_packages/get_agent_ports/
  // get_agent_processes were consolidated into get_agent_inventory (issue: "Consolidate agent
  // inventory into one tool"); this single entry replaces all four.
  get_agent_inventory: 'inventory',

  // compliance
  get_compliance_alerts: 'compliance',
  get_compliance_summary: 'compliance',

  // security_analytics
  get_rules: 'security_analytics',
  get_threat_intel_components: 'security_analytics',
  get_detectors: 'security_analytics',
  // lookup_indicator/get_cti_status (workstream A1b) are threat-intel-pipeline-content questions
  // ("is this a known indicator", "is the feed up to date"), the same domain as the rule/decoder/
  // detector catalog above, not the customer's own observed data -- filed here rather than a new
  // category to avoid one more stage-1 routing line.
  lookup_indicator: 'security_analytics',
  get_cti_status: 'security_analytics',

  // free_search (escape hatch + generic ID lookup)
  find_document_by_field: 'free_search',
  search_wazuh_data: 'free_search',
  // get_field_values (workstream B) is the "verify before filter" discovery tool: it is useful
  // regardless of which data family a question ultimately routes to (a bad guess at a rule level,
  // a check result, an OS name can happen from any category), so -- like search_wazuh_data -- it
  // is always appended to the resolved tool list in `resolveStage2Tools` below rather than gated
  // behind one category. Filed under 'free_search' here only for `assertRegistryConsistency`'s
  // bookkeeping and documentation; the always-on behavior is what actually makes it reachable.
  get_field_values: 'free_search',
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
    'Agent listing by status (active, pending, never_connected, disconnected) and/or agent ID. ' +
    'Enrollment/connection status only, NOT comms-channel health or message drop-rate.',
  findings:
    'Finding search/summaries: critical findings, by agent/rule/rule-tag/OS/time, top rules, top/' +
    'noisiest agents, brute-force, suspicious PowerShell, general security summary. Also covers ' +
    'the raw/normalized event stream ("everything that happened", matched or not). NOT automated ' +
    'actions Wazuh took in response (active response/blocking/quarantine) -- no category covers that.',
  vulnerabilities:
    'CVE/vulnerability data: by agent, by CVE ID, solved, or critical only -- plus the CTI ' +
    "feed's own catalog knowledge about a specific CVE (description, severity, affected " +
    'software), separate from what is actually detected on this deployment.',
  fim: 'File Integrity Monitoring: current state of monitored files (path, mtime, owner, hashes).',
  sca:
    'Security Configuration Assessment (SCA): per-agent compliance benchmark results (e.g. CIS ' +
    'Ubuntu), NOT Security Analytics pipeline policies.',
  mitre:
    'MITRE ATT&CK technique/tactic findings and technique-frequency summaries.',
  inventory:
    'Syscollector inventory: agent/host OS, installed software or packages, open ports, running ' +
    'processes, or installed hotfixes -- including "what software/programs are installed" ' +
    'questions that name the host only vaguely ("this box/server/machine") rather than by ID.',
  compliance:
    'Compliance findings/summaries for any of 10 frameworks (PCI DSS, HIPAA, GDPR, ISO 27001, ' +
    'NIS2, NIST 800-171/800-53, FedRAMP, CMMC, TSC).',
  security_analytics:
    'The Security Analytics ruleset and pipeline content itself — rules (name/level/status/' +
    'technique), components (decoders, integrations, policies, filters, KVDBs), detector ' +
    'definitions (which detectors exist, enabled state, monitored indices, findings counts), ' +
    'whether a specific IP/hash/URL/domain is a known indicator (IOC) per the threat-intel feed, ' +
    'and whether the CTI content feeds are up to date. Pipeline/threat-intel-catalog content, ' +
    'NOT findings that fired and NOT SCA compliance benchmarks.',
  free_search:
    'Anything else about Wazuh finding/vulnerability/state data, PLUS operational metrics and ' +
    'Security Analytics detector findings (last resort — always offered regardless of which ' +
    'category is picked, so this rarely needs to be picked for its own sake). For IOC lookup, ' +
    'CTI feed freshness, or CVE feed knowledge, prefer lookup_indicator/get_cti_status/' +
    'get_cve_intel (security_analytics/vulnerabilities categories) over this escape hatch.',
  general:
    'Greetings, thanks, or questions about the assistant itself. If the user asks anything about ' +
    'their own environment - however vaguely - do NOT pick general.',
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
      'then call route_question with them, most relevant first. Pick "general" alone only for ' +
      'greetings, thanks, or questions about the assistant itself - never when the user asks ' +
      'anything, however vaguely, about their own environment.',
    'Categories:',
    menu,
    'Call route_question now.',
  ].join('\n');
}

/**
 * Categories whose QUESTION VOCABULARY genuinely overlaps, so routing to one must also offer the
 * other's tools. Deterministic, because the alternative (making the descriptions clearer) was
 * measured and lost.
 *
 * EVIDENCE (issue #8935, instrumented on the deployed build, 3/3 runs identical): "How badly are we
 * failing CIS, in plain numbers?" routed to `["compliance"]`, which offers
 * `get_compliance_alerts` / `get_compliance_summary` / `search_wazuh_data`. `get_sca_results` --
 * which holds the answer, 102 failed / 95 passed / 10 not-applicable on `cis_ubuntu22-04` -- was
 * NEVER OFFERED. The assistant then said "none of the available compliance-framework tools include a
 * 'cis' tag", which was LITERALLY TRUE of the tools it had. It was not hallucinating a limitation; it
 * was accurately describing a tool list that did not contain SCA.
 *
 * Note what this is NOT: `sca`'s own description already reads "per-agent compliance benchmark
 * results (e.g. CIS Ubuntu)" -- the vocabulary was already there and the router still chose
 * `compliance`. So sharpening prose is not the fix. Neither is a prompt instruction: the model cannot
 * call a tool it was not given, which is the same shape as issue #8913 (guidance naming `get_agents`
 * on a turn where the `agents` category was never routed) and #8919 (a tool description naming a tool
 * from another category).
 *
 * Why co-routing rather than moving the vocabulary: in Wazuh a "compliance" question can legitimately
 * be answered from EITHER side -- SCA benchmark results (per-agent CIS/hardening checks) or
 * framework-tagged findings (PCI DSS, HIPAA, GDPR...). Neither router choice is wrong, so the fix is
 * to stop making it a choice. Symmetric on purpose: "which PCI controls are we failing" deserves the
 * SCA tools for the same reason "how badly are we failing CIS" deserves the compliance ones.
 *
 * Kept deliberately narrow -- one evidenced pair. This is NOT a place to relax routing generally: the
 * router exists to narrow ~30 tools to a handful, and every added category costs the model attention
 * on tools it does not need. Add a pair here only with a measured witness like the one above.
 */
export const CO_ROUTED_CATEGORIES: Partial<
  Record<RouterCategory, readonly RouterCategory[]>
> = {
  compliance: ['sca'],
  sca: ['compliance'],
};

/** `categories` plus every co-routed sibling (see `CO_ROUTED_CATEGORIES`), order-preserving and
 * deduped. `general` is deliberately not co-routed with anything -- it is the no-data-path recovery
 * category, and widening it would defeat the minimal recovery set below. */
export function withCoRoutedCategories(
  categories: readonly RouterCategory[],
): RouterCategory[] {
  const out: RouterCategory[] = [];
  const seen = new Set<RouterCategory>();
  const push = (category: RouterCategory): void => {
    if (!seen.has(category)) {
      seen.add(category);
      out.push(category);
    }
  };
  for (const category of categories) {
    push(category);
  }
  for (const category of categories) {
    for (const sibling of CO_ROUTED_CATEGORIES[category] ?? []) {
      push(sibling);
    }
  }
  return out;
}

/**
 * Stage-2 tool-list resolver: union of the routed categories' tools, plus
 * `search_wazuh_data` always appended (deduped) as the safety-valve escape hatch. NEVER returns
 * `undefined` and NEVER resolves to an empty list: a stage-1 misclassification must be
 * recoverable, not terminal, so even a lone `general` route (see issue "never route zero
 * tools") resolves to a minimal recovery set — `get_security_summary` plus `search_wazuh_data`
 * — instead of leaving the turn with no data path at all. `tool_choice` still stays `'auto'` for
 * these turns (server/routes/chat.ts's `orchestrate`), so a genuine greeting still gets a
 * plain-text answer; the minimal set is only an escape hatch the model *may* reach for, never a
 * forced call.
 *
 * `categories` is expected to already be schema-validated (schema-validator.ts against
 * `ROUTE_QUESTION_TOOL.parameters`, done by the caller in chat.ts) so every entry is one of
 * `CATEGORY_ORDER`; this function still defensively drops anything unrecognized rather than
 * trusting that invariant blindly.
 */
export function resolveStage2Tools(categories: string[]): ToolSpec[] {
  const valid = categories.filter((cat): cat is RouterCategory =>
    (CATEGORY_ORDER as string[]).includes(cat),
  );
  const routed = withCoRoutedCategories(valid);

  const toolNames = new Set<string>();
  if (routed.length === 1 && routed[0] === 'general') {
    // Minimal recovery set (see doc comment above): `general` alone maps to no tool category in
    // `TOOL_CATEGORY`/`CATEGORY_TOOLS`, so without this branch the union below would be empty.
    toolNames.add('get_security_summary');
  } else {
    for (const category of routed) {
      for (const toolName of CATEGORY_TOOLS[category]) {
        toolNames.add(toolName);
      }
    }
  }
  // Always-on escape hatch, deduped via the Set regardless of whether
  // `free_search` was itself one of the routed categories.
  toolNames.add('search_wazuh_data');
  // Always-on discovery tool (workstream B) -- see TOOL_CATEGORY's get_field_values entry above
  // for why this mirrors search_wazuh_data's unconditional placement instead of a category gate.
  // DELIBERATE product decision, not a side effect (code review B11): this adds ~1.5 KB of
  // description + 4 params to EVERY stage-2 call, including `general`, where field discovery is
  // rarely relevant. Accepted because the alternative -- gating it per category -- would silently
  // reintroduce the "model guesses a filter value" failure mode B1 exists to close, on whichever
  // category someone forgets to add it to.
  toolNames.add('get_field_values');

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
