import assert from 'node:assert/strict';
import {
  resolveStage2Tools,
  buildRoutingPrompt,
  CO_ROUTED_CATEGORIES,
  CHAIN_PAIRS,
  withCoRoutedCategories,
} from './router';
import { listToolDefinitions } from './registry';

/**
 * Proves the "never route zero tools" fix: a stage-1 route of `general` alone must still resolve
 * a minimal recovery tool set (get_security_summary + search_wazuh_data) instead of `undefined`,
 * so a misclassified operational question can self-correct mid-turn instead of losing the data
 * path for the whole turn (see the "never route zero tools" issue). Also proves a normal
 * data-category resolution is unaffected by that change, and that the narrowed `general`
 * category description carries the explicit exclusion the fix relies on to reduce
 * misclassification in the first place.
 */

test('resolveStage2Tools(general) returns the minimal set, never undefined/empty', () => {
  const specs = resolveStage2Tools(['general']);
  assert.ok(Array.isArray(specs), 'must return an array, never undefined');
  const names = specs.map(spec => spec.name).sort();
  // get_field_values joins search_wazuh_data as an always-on tool (workstream B, "verify before
  // filter") -- see router.ts's TOOL_CATEGORY/resolveStage2Tools doc comments.
  assert.deepEqual(names, [
    'get_field_values',
    'get_security_summary',
    'search_wazuh_data',
  ]);
});

test('resolveStage2Tools: a data category resolution includes its chain-pair detail tools', () => {
  // `agents` -> `get_agents`, which is a CHAIN_PAIRS summary tool (see router.ts), so its detail
  // tools are also expected in the resolved list -- this is intentional widening, not a
  // regression: see the "chain co-offering" tests below for the rationale. The expansion is a
  // FIXED POINT, not one hop: `get_sca_results` (a get_agents detail tool) is itself a CHAIN_PAIRS
  // key for `get_sca_checks`, and `search_findings_by_agent` (also a get_agents detail tool) is
  // itself a CHAIN_PAIRS key for `find_document_by_field`, so both are expected here too.
  const specs = resolveStage2Tools(['agents']);
  const names = specs.map(spec => spec.name).sort();
  // get_field_values joins as an always-on tool (workstream B) on top of the CHAIN_PAIRS
  // fixed-point expansion (workstream D adds get_sca_checks via get_sca_results).
  assert.deepEqual(names, [
    'find_document_by_field',
    'get_agent_inventory',
    'get_agents',
    'get_field_values',
    'get_sca_checks',
    'get_sca_results',
    'get_vulnerabilities_by_agent',
    'search_findings_by_agent',
    'search_wazuh_data',
  ]);
});

test('resolveStage2Tools: general + a data category still resolves that category', () => {
  const specs = resolveStage2Tools(['general', 'findings']);
  const names = specs.map(spec => spec.name);
  assert.ok(names.includes('search_wazuh_data'));
  assert.ok(names.includes('get_critical_findings'));
  // Not the lone-`general` minimal-recovery branch, so no forced get_security_summary beyond
  // whatever `findings` itself already contributes.
});

test('the "general" category description carries the explicit exclusion', () => {
  const prompt = buildRoutingPrompt('2026-01-01T00:00:00.000Z');
  const generalLine = prompt
    .split('\n')
    .find(line => line.trim().startsWith('- general:'));
  assert.ok(generalLine, 'routing prompt must list a "general" menu entry');
  assert.match(
    generalLine as string,
    /do NOT pick general/,
    "general's description must explicitly exclude environment questions",
  );
});

// --- issue #8935: deterministic co-routing for overlapping category vocabulary -------------------

test('resolveStage2Tools: routing to compliance also offers the SCA tools', () => {
  // The measured defect: "How badly are we failing CIS, in plain numbers?" routed to
  // ["compliance"] on 3/3 instrumented runs, and get_sca_results -- which holds the answer -- was
  // never offered, so the assistant truthfully reported that none of the tools it HAD covered CIS.
  const names = resolveStage2Tools(['compliance']).map(spec => spec.name);
  assert.ok(
    names.includes('get_sca_results'),
    'get_sca_results must be offered',
  );
  assert.ok(names.includes('get_sca_checks'), 'get_sca_checks must be offered');
  // The originally-routed category's own tools must survive co-routing.
  assert.ok(names.includes('get_compliance_summary'));
  assert.ok(names.includes('get_compliance_alerts'));
});

test('resolveStage2Tools: routing to sca also offers the compliance tools (symmetric)', () => {
  // Symmetric on purpose: "which PCI controls are we failing" deserves the SCA tools for the same
  // reason the CIS question deserves the compliance ones -- in Wazuh either side can hold the answer.
  const names = resolveStage2Tools(['sca']).map(spec => spec.name);
  assert.ok(names.includes('get_compliance_summary'));
  assert.ok(names.includes('get_sca_results'));
});

test('withCoRoutedCategories: order-preserving, deduped, and does not widen `general`', () => {
  assert.deepEqual(withCoRoutedCategories(['compliance']), [
    'compliance',
    'sca',
  ]);
  assert.deepEqual(withCoRoutedCategories(['sca']), ['sca', 'compliance']);
  // Already both: no duplicates, original order kept.
  assert.deepEqual(withCoRoutedCategories(['sca', 'compliance']), [
    'sca',
    'compliance',
  ]);
  // `general` is the no-data-path recovery category; widening it would defeat the minimal recovery
  // set resolveStage2Tools falls back to.
  assert.deepEqual(withCoRoutedCategories(['general']), ['general']);
  // An unrelated category is untouched.
  assert.deepEqual(withCoRoutedCategories(['fim']), ['fim']);
});

test('CO_ROUTED_CATEGORIES: every pair is symmetric and names a real category (coverage)', () => {
  // A one-way pair would silently make routing asymmetric: the CIS question would find SCA but a
  // PCI question would not find the benchmark data, and nothing else in the suite would notice.
  const failures: string[] = [];
  for (const [category, siblings] of Object.entries(CO_ROUTED_CATEGORIES)) {
    for (const sibling of siblings ?? []) {
      if (!(CO_ROUTED_CATEGORIES[sibling] ?? []).includes(category as never)) {
        failures.push(`${category} -> ${sibling} is not mirrored back`);
      }
      if (resolveStage2Tools([sibling]).length === 0) {
        failures.push(`${sibling} resolves to no tools`);
      }
    }
  }
  assert.deepEqual(failures, []);
  assert.ok(
    Object.keys(CO_ROUTED_CATEGORIES).length > 0,
    'the map must not be empty, or these tests pass vacuously',
  );
});

test('every general-alone turn still gets the minimal recovery set, unchanged by co-routing', () => {
  const names = resolveStage2Tools(['general']).map(spec => spec.name);
  assert.deepEqual(names.sort(), [
    'get_field_values',
    'get_security_summary',
    'search_wazuh_data',
  ]);
});
test('the "findings" category description mentions top/noisiest agents (get_top_agents routing)', () => {
  // Pins get_top_agents' routing hint in TOOL_CATEGORY/CATEGORY_DESCRIPTIONS -- with no test, this
  // line has no guard against silently disappearing in a future three-way merge of router.ts.
  const prompt = buildRoutingPrompt('2026-01-01T00:00:00.000Z');
  const findingsLine = prompt
    .split('\n')
    .find(line => line.trim().startsWith('- findings:'));
  assert.ok(findingsLine, 'routing prompt must list a "findings" menu entry');
  assert.match(
    findingsLine as string,
    /top\/noisiest agents/,
    "findings' description must mention top/noisiest agents so get_top_agents-shaped questions route here",
  );
});
/**
 * Issue #8913's own worked example ("What software does this box have installed?") measured
 * live at 0/5 for `get_agent_inventory` even AFTER the tool learned to self-resolve a missing
 * agent (see get-agent-inventory.ts's `resolveDeicticAgentParams`) -- because stage 1 never
 * routed to the `inventory` category in the first place, so the tool was never even offered in
 * stage 2 (`resolveStage2Tools`). The pre-fix `inventory` description said "installed packages"
 * but never the word "software", and had no note that a vague host reference ("this box") is
 * still an inventory-domain question rather than an identity question. Pin both additions here
 * so a future reword silently regresses this instead of failing loudly.
 */
test('the "inventory" category description covers "software" and vague host phrasing', () => {
  const prompt = buildRoutingPrompt('2026-01-01T00:00:00.000Z');
  const inventoryLine = prompt
    .split('\n')
    .find(line => line.trim().startsWith('- inventory:'));
  assert.ok(
    inventoryLine,
    'routing prompt must list an "inventory" menu entry',
  );
  assert.match(
    inventoryLine as string,
    /\bsoftware\b/i,
    'inventory description must literally say "software", not just "installed packages", to ' +
      "match #8913's exact worked-example phrasing",
  );
  assert.match(
    inventoryLine as string,
    /this box\/server\/machine/,
    'inventory description must call out vague host references as still in-scope, not just ' +
      'named/numbered agents',
  );
});

/**
 * REVIEW FOLLOW-UP (CV-077, live battery re-run 2026-08-20): "What spaces exist and what does
 * each contain?" declined with "I don't have the tool needed... available in this turn" -- the
 * prompt-level decline-copy fix (prompts.ts, see the RBAC/spaces disambiguation note) correctly
 * stopped the WRONG (RBAC-permissions) decline from firing, but stage-1 routing still never
 * offered get_threat_intel_components at all: the "security_analytics" category menu line never
 * used the word "space"/"spaces" anywhere, even though that is exactly the vocabulary the
 * question (and get_threat_intel_components' own `space` parameter) uses. A stage-1 router
 * choosing a category from a description-only menu has no way to match a word that literally
 * never appears in any category's text.
 */
test(
  'the "security_analytics" category description covers Security Analytics "spaces" ' +
    '(content grouping), disambiguated from an RBAC/dashboard permission space',
  () => {
    const prompt = buildRoutingPrompt('2026-01-01T00:00:00.000Z');
    const line = prompt
      .split('\n')
      .find(l => l.trim().startsWith('- security_analytics:'));
    assert.ok(
      line,
      'routing prompt must list a "security_analytics" menu entry',
    );
    assert.match(
      line as string,
      /\bSPACES\b/,
      'security_analytics description must literally say "spaces" so the stage-1 router can match ' +
        'a "what spaces exist" question to this category',
    );
    assert.match(
      line as string,
      /different "space" than an RBAC\/dashboard permission/,
      'must disambiguate from an RBAC/dashboard permission space, not just introduce a second, ' +
        'equally-ambiguous meaning of the same word',
    );
  },
);

/**
 * Out-of-scope regression: M-OOS-01/02 (active-response questions) and M-OOS-05 (agent
 * comms-channel health) were mis-routed onto adjacent tools (get_brute_force,
 * get_events_by_agent, get_agents) instead of being declined, because neither category's
 * stage-1 menu line said what it does NOT cover. These two categories' descriptions must carry
 * that exclusion so a mismatch is visible before stage 2 ever offers the misleading tool.
 */
test('the "findings" category description excludes active-response actions', () => {
  const prompt = buildRoutingPrompt('2026-01-01T00:00:00.000Z');
  const findingsLine = prompt
    .split('\n')
    .find(line => line.trim().startsWith('- findings:'));
  assert.ok(findingsLine, 'routing prompt must list a "findings" menu entry');
  assert.match(
    findingsLine as string,
    /NOT automated actions Wazuh took/,
    "findings's description must explicitly exclude active-response actions",
  );
});

test('the "agents" category description excludes comms-channel health', () => {
  const prompt = buildRoutingPrompt('2026-01-01T00:00:00.000Z');
  const agentsLine = prompt
    .split('\n')
    .find(line => line.trim().startsWith('- agents:'));
  assert.ok(agentsLine, 'routing prompt must list an "agents" menu entry');
  assert.match(
    agentsLine as string,
    /NOT comms-channel health/,
    "agents's description must explicitly exclude comms-channel health",
  );
});

// --- declared chain pairs: two consumers (server/tools/router.ts, server/routes/chat.ts) --------

/**
 * CHAIN_PAIRS coverage/load-time check: every key (summary tool) and every value (detail tool)
 * must be a real registry tool name. `assertChainPairsConsistency` already enforces this at
 * module load (a typo throws at plugin start), so this test's job is to prove that guard is
 * actually reachable/correct rather than a dead function -- and to fail loudly in CI, not just at
 * runtime plugin start, if a future edit reintroduces a typo.
 */
/**
 * Pins the declared order of `CHAIN_PAIRS['get_agents']`: chat.ts's metadata fallback
 * (`findOfferedFollowUpTool`) picks the FIRST eligible detail tool in this array's declared
 * order when an offer names no tool, so this literal ordering is load-bearing production
 * behaviour, not just documentation -- reordering it for readability would silently change which
 * tool an unnamed "what's going on with aio-05"-shaped offer gets forced into. Without this test
 * that reorder would pass every other suite silently.
 */
test('CHAIN_PAIRS: get_agents declares its detail tools in a fixed, pinned order', () => {
  assert.deepEqual(CHAIN_PAIRS.get_agents, [
    'get_vulnerabilities_by_agent',
    'get_sca_results',
    'get_agent_inventory',
    'search_findings_by_agent',
  ]);
});

test('CHAIN_PAIRS: every summary and detail tool name is a real registry tool', () => {
  const registryToolNames = new Set(
    listToolDefinitions().map(def => def.spec.name),
  );
  const failures: string[] = [];
  for (const [summaryTool, detailTools] of Object.entries(CHAIN_PAIRS)) {
    if (!registryToolNames.has(summaryTool)) {
      failures.push(`unknown summary tool: ${summaryTool}`);
    }
    for (const detailTool of detailTools) {
      if (!registryToolNames.has(detailTool)) {
        failures.push(`${summaryTool} -> unknown detail tool: ${detailTool}`);
      }
    }
  }
  assert.deepEqual(failures, []);
  assert.ok(
    Object.keys(CHAIN_PAIRS).length > 0,
    'the map must not be empty, or this test passes vacuously',
  );
});

test('resolveStage2Tools: get_sca_results chains to get_sca_checks (same-category detail)', () => {
  // The measured Failure B witness (get_sca_results -> get_sca_checks) must also be a Failure A
  // fix: get_sca_checks must be OFFERED whenever get_sca_results is, regardless of which category
  // routed it there.
  const names = resolveStage2Tools(['sca']).map(spec => spec.name);
  assert.ok(names.includes('get_sca_results'));
  assert.ok(names.includes('get_sca_checks'));
});

test('resolveStage2Tools: get_agents chains to cross-category detail tools (Failure A)', () => {
  // The measured miss: "what's going on with aio-05" needs get_vulnerabilities_by_agent, but
  // routing to `agents` alone never offered it before this fix.
  const names = resolveStage2Tools(['agents']).map(spec => spec.name);
  assert.ok(names.includes('get_agents'));
  assert.ok(names.includes('get_vulnerabilities_by_agent'));
  assert.ok(names.includes('get_sca_results'));
  assert.ok(names.includes('get_agent_inventory'));
  assert.ok(names.includes('search_findings_by_agent'));
  // Second-hop witness (the exact pair this map's own doc comment cites as the motivating case):
  // get_agents -> get_sca_results -> get_sca_checks must all be reachable in ONE turn, not just
  // the first hop.
  assert.ok(
    names.includes('get_sca_checks'),
    'get_sca_checks must be reachable via the second hop (get_sca_results is itself a ' +
      'CHAIN_PAIRS key) -- a one-hop-only expansion would drop this',
  );
});

test('resolveStage2Tools: get_vulnerabilities chains to get_agent_inventory (hotfixes)', () => {
  // The measured miss: vulnerabilities -> get_agent_inventory(hotfixes) was never offered when
  // only the `vulnerabilities` category was routed.
  const names = resolveStage2Tools(['vulnerabilities']).map(spec => spec.name);
  assert.ok(names.includes('get_vulnerabilities'));
  assert.ok(names.includes('get_agent_inventory'));
  assert.ok(names.includes('get_vulnerability_by_cve'));
  assert.ok(names.includes('get_vulnerabilities_by_agent'));
});

test('resolveStage2Tools: get_critical_vulnerabilities chains the same detail tools', () => {
  const names = resolveStage2Tools(['vulnerabilities']).map(spec => spec.name);
  assert.ok(names.includes('get_critical_vulnerabilities'));
  assert.ok(names.includes('get_agent_inventory'));
});

test('resolveStage2Tools: findings-row detail tool (find_document_by_field) is reachable via CHAIN_PAIRS', () => {
  // find_document_by_field lives in the `free_search` CATEGORY, which resolveStage2Tools does NOT
  // widen a routed category into -- it only ever appends the single `search_wazuh_data` NAME
  // unconditionally (see its doc comment), never the whole free_search category. So without a
  // CHAIN_PAIRS entry naming it explicitly, find_document_by_field would be offered only when
  // free_search is itself the routed category. `search_findings_by_agent` /
  // `search_findings_by_rule_title` / `search_findings_by_rule_tag` (all in `findings`) now chain
  // to it directly, which is what actually closes the gap.
  const names = resolveStage2Tools(['findings']).map(spec => spec.name);
  assert.ok(names.includes('search_wazuh_data'));
  assert.ok(
    names.includes('find_document_by_field'),
    'find_document_by_field must be reachable from a plain `findings` route via CHAIN_PAIRS, ' +
      'not only via a separately-routed free_search category',
  );
});

test('resolveStage2Tools: chain-pair expansion does not widen the general-alone minimal recovery set', () => {
  // get_security_summary is itself a CHAIN_PAIRS summary key (-> get_findings_by_time); the
  // general-alone branch must stay the exact minimal recovery set and not run through the
  // expansion.
  const names = resolveStage2Tools(['general'])
    .map(spec => spec.name)
    .sort();
  // get_field_values is appended unconditionally on every path, including general-alone (see
  // resolveStage2Tools's always-on block below the general-alone branch) -- workstream B's
  // addition, not part of the chain-pair expansion this test guards against.
  assert.deepEqual(names, [
    'get_field_values',
    'get_security_summary',
    'search_wazuh_data',
  ]);
});

test('resolveStage2Tools: get_security_summary chains to get_findings_by_time outside the general-alone branch', () => {
  const names = resolveStage2Tools(['findings']).map(spec => spec.name);
  assert.ok(names.includes('get_security_summary'));
  assert.ok(names.includes('get_findings_by_time'));
});

// --- mitre/events escape their own category ---------------------------------------------------
//
// "Explain this MITRE incident -- when was it detected and how" needs the document behind a
// technique row (find_document_by_field) and the detection side (get_rules, the only tool that
// returns a rule description). Both live outside the `mitre` category, and resolveStage2Tools widens
// a route only through CHAIN_PAIRS, so without these edges a mitre-routed turn can list technique
// rows and go no further. Same for get_events_by_agent, which sits in `findings` with no row-level
// pivot of its own.

test('resolveStage2Tools: a mitre route reaches find_document_by_field and get_rules via CHAIN_PAIRS', () => {
  const names = resolveStage2Tools(['mitre']).map(spec => spec.name);
  assert.ok(
    names.includes('get_mitre_findings'),
    'the routed category own tools must survive the expansion',
  );
  assert.ok(
    names.includes('find_document_by_field'),
    'a mitre-routed turn must be able to open the document behind a technique row',
  );
  assert.ok(
    names.includes('get_rules'),
    'a mitre-routed turn must be able to reach the detection-rule side of "how was it detected"',
  );
});

test('CHAIN_PAIRS: get_mitre_findings declares its detail tools in a fixed, pinned order', () => {
  // Same load-bearing reason as the get_agents pin above: chat.ts's `findOfferedFollowUpTool`
  // metadata fallback forces the FIRST eligible detail tool when an offer names no tool, so the
  // row lookup must stay ahead of the rule lookup -- an unnamed "I can dig into that" offer after
  // a technique listing should open the finding, not the Sigma catalog.
  assert.deepEqual(CHAIN_PAIRS.get_mitre_findings, [
    'find_document_by_field',
    'get_rules',
  ]);
});

test('CHAIN_PAIRS: get_events_by_agent chains to find_document_by_field', () => {
  assert.deepEqual(CHAIN_PAIRS.get_events_by_agent, ['find_document_by_field']);
  const names = resolveStage2Tools(['findings']).map(spec => spec.name);
  assert.ok(names.includes('get_events_by_agent'));
  assert.ok(names.includes('find_document_by_field'));
});

// --- Registry FIM must have a category that claims it -----------------------------------------
//
// With the `fim` category described as "current state of monitored files", nothing in the routing
// menu claims Windows registry keys/values, so a registry question reaches no tool that can answer
// it -- even though the data is reachable: search_wazuh_data is appended to every resolved list and
// `wazuh-states-*` covers wazuh-states-fim-registry-keys/-values.

test('the fim routing category claims Windows registry keys/values, not only files', () => {
  const prompt = buildRoutingPrompt('2026-01-01T00:00:00.000Z');
  const fimLine = prompt.split('\n').find(line => line.startsWith('- fim:'));
  assert.ok(fimLine, 'the fim category must appear in the routing menu');
  assert.match(fimLine, /Windows registry keys\/values/);
  assert.match(fimLine, /Run-key/);
});

test('routing to fim still resolves a tool that can actually reach the registry surface', () => {
  // No typed tool reads registry FIM, so the whole route depends on the always-on escape hatch
  // travelling with the fim category. If that ever stops being true, the prompt's registry
  // routing rule becomes an instruction the model cannot obey.
  const names = resolveStage2Tools(['fim']).map(spec => spec.name);
  assert.ok(names.includes('search_wazuh_data'));
  assert.ok(names.includes('get_fim_files'));
});
