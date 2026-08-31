'use strict';

/**
 * Per-tool E2E matrix: drives the REAL server/routes/chat.ts orchestration path (guardrails.ts +
 * executor.ts + digest.ts all apply, exactly like a real user turn) for every one of the 29 tools
 * in server/tools/registry.ts's CATALOG, against LIVE Wazuh 5.0 data, and answers one question per
 * tool: does it actually return data?
 *
 * This exists because `run_plumbing.js` (this directory) proves PLUMBING -- tool_call fires, no
 * error event, a table event arrives, stream ends `done` -- using a mock LLM. It does NOT prove the
 * tool's QUERY is correct against 5.0's real field mappings: `get_suspicious_powershell` passed
 * every existing gate while `match`-ing a `keyword` field (`rule.description`) that can never match
 * an analyzed query, silently returning 0 rows forever. `run_plumbing.js`'s own per-tool assertion
 * (`tableEvents.length === 0` fails the case) would have caught a 0-row TABLE EVENT going missing,
 * but not a table event that legitimately exists with zero rows in it -- an empty table still
 * satisfies "a table event arrived". This script's whole point is telling apart three different
 * reasons a tool can return 0 rows:
 *   - EMPTY-DATA:       the tool's target index family genuinely has no matching documents.
 *   - SUSPECT-BROKEN:   the family HAS documents, but this tool still returns 0 -- the PowerShell
 *                       signature, flagged loudly.
 *   - GUARDRAIL-REJECTED / ERROR: the call never got a real result at all.
 *
 * Mechanism (identical to run_plumbing.js, reusing its exact building blocks -- see that file's
 * header comment and eval/README.md's "Plumbing regression" section for the full explanation):
 * `eval/mock_provider.js` is registered as an `openai_compatible` provider; a `[[route:CATEGORY]]`
 * marker steers the two-stage router's stage-1 call, and a trailing `[[mock:TOOLNAME:{json args}]]`
 * marker makes the mock stream back a tool call for that exact tool/args. Tool EXECUTION still
 * hits the real Manager API / Indexer via EVAL_BASE_URL -- only the "thinking" step is mocked. This
 * script does NOT import server/ TypeScript (needs the OSD runtime) and does NOT add a new server
 * route -- same "drive it through the real HTTP path" constraint as run_plumbing.js.
 *
 * Arguments per tool are NOT hardcoded guesses: `eval/es_discovery.js` pulls a real agent name/id,
 * a real CVE, a real SCA policy id, a real rule id/tag, a real OS name, etc. straight from the live
 * indexer/Manager before any tool is invoked (see that file's header for the direct-vs-SSH indexer
 * access story -- this VM's indexer is loopback-bound inside the guest, so discovery transparently
 * falls back to SSH). A tool whose required real value could not be discovered is reported
 * SKIPPED with the exact reason, not silently omitted -- a coverage hole must be visible.
 *
 * Env vars (mirrors run_plumbing.js's, plus a few of its own):
 *   EVAL_BASE_URL, EVAL_USER, EVAL_PASS      -- dashboard (see cli-env.js)
 *   MOCK_BASE_URL                            -- where the DASHBOARD reaches mock_provider.js
 *   MOCK_PROVIDER_ID                         -- reuse an already-registered mock provider
 *   MOCK_PORT / MOCK_DEBUG_URL               -- unused here (no privacy-pipeline checks in this
 *                                                script), kept only if a future extension wants them
 *   EVAL_SLEEP_S                             -- seconds between calls (default 1)
 *   EVAL_LOADOUT_DIR                         -- default eval/loadout (gitignored)
 *   EVAL_ES_USER/EVAL_ES_PASS                -- indexer Basic auth (default admin/admin)
 *   EVAL_MANAGER_USER/EVAL_MANAGER_PASS      -- Manager API Basic auth (default wazuh/wazuh)
 *   EVAL_SSH_HOST / EVAL_SSH_CONFIG          -- see es_discovery.js
 *
 * Exit code: number of SUSPECT-BROKEN + ERROR tools (0 = every tool is OK/EMPTY-DATA/SKIPPED-clean).
 * SKIPPED and GUARDRAIL-REJECTED do not affect the exit code on their own -- they are coverage/
 * design findings, not proof the tool is broken -- but both are printed loudly in the summary.
 */

const fs = require('fs');
const path = require('path');
const { login, chat, API_ROOT, cookieHeader } = require('./sse_client');
const { BASE_URL, USER, PASS, fail } = require('./cli-env');
const { discoverLiveFixtures } = require('./es_discovery');

const MOCK_BASE_URL = process.env.MOCK_BASE_URL || 'http://localhost:9876/v1';
const SLEEP_S =
  process.env.EVAL_SLEEP_S !== undefined ? Number(process.env.EVAL_SLEEP_S) : 1;
const LOADOUT_DIR =
  process.env.EVAL_LOADOUT_DIR || path.join(__dirname, 'loadout');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mirrors server/tools/router.ts's TOOL_CATEGORY map by hand (same constraint as run_plumbing.js's
 * identical constant -- this harness is plain Node/JS, it doesn't compile the plugin's TypeScript).
 * Keep in sync with router.ts if that map changes.
 */
const TOOL_CATEGORY = {
  get_active_agents: 'agents',
  get_disconnected_agents: 'agents',
  get_critical_findings: 'findings',
  search_findings_by_agent: 'findings',
  get_top_rules: 'findings',
  get_critical_vulnerabilities: 'vulnerabilities',
  get_findings_by_time: 'findings',
  get_brute_force: 'findings',
  get_security_summary: 'findings',
  get_suspicious_powershell: 'findings',
  search_findings_by_rule_title: 'findings',
  search_findings_by_rule_tag: 'findings',
  get_pci_dss_findings: 'compliance',
  get_pci_dss_summary: 'compliance',
  search_findings_by_multiple_agents: 'findings',
  search_findings_by_os: 'findings',
  get_vulnerabilities: 'vulnerabilities',
  get_vulnerabilities_by_agent: 'vulnerabilities',
  get_vulnerability_by_cve: 'vulnerabilities',
  get_fim_files: 'fim',
  get_sca_results: 'sca',
  get_sca_checks: 'sca',
  get_mitre_findings: 'mitre',
  get_mitre_summary: 'mitre',
  get_agent_os: 'inventory',
  get_agent_packages: 'inventory',
  get_agent_ports: 'inventory',
  get_agent_processes: 'inventory',
  search_wazuh_data: 'free_search',
};

/**
 * The 29 CATALOG tools (server/tools/registry.ts:42-82), each with:
 *   - `family`: the key into es_discovery.js's `familyCounts` used to tell EMPTY-DATA from
 *     SUSPECT-BROKEN when this tool returns 0 rows (see that file's header comment).
 *   - `argsFn(fixtures)`: returns `{ args }` built from LIVE discovered values, or
 *     `{ skip: 'reason' }` when a required real value could not be discovered -- surfaced as
 *     SKIPPED rather than guessed.
 */
const TOOL_DEFS = [
  {
    name: 'get_active_agents',
    family: 'managerAgents',
    argsFn: () => ({ args: {} }),
  },
  {
    name: 'get_disconnected_agents',
    family: 'managerAgents',
    argsFn: () => ({ args: {} }),
  },
  {
    name: 'get_critical_findings',
    family: 'findings',
    argsFn: () => ({ args: {} }),
  },
  {
    name: 'search_findings_by_agent',
    family: 'findings',
    argsFn: f =>
      f.agentName
        ? { args: { agent_name: f.agentName } }
        : {
            skip: 'no real wazuh.agent.name value discoverable from wazuh-findings-v5*',
          },
  },
  { name: 'get_top_rules', family: 'findings', argsFn: () => ({ args: {} }) },
  {
    name: 'get_critical_vulnerabilities',
    family: 'vulnerabilities',
    argsFn: () => ({ args: {} }),
  },
  {
    name: 'get_findings_by_time',
    family: 'findings',
    argsFn: () => ({ args: {} }),
  },
  { name: 'get_brute_force', family: 'findings', argsFn: () => ({ args: {} }) },
  {
    name: 'get_security_summary',
    family: 'findings',
    argsFn: () => ({ args: {} }),
  },
  {
    name: 'get_suspicious_powershell',
    family: 'findings',
    argsFn: () => ({ args: {} }),
  },
  {
    name: 'search_findings_by_rule_title',
    family: 'findings',
    argsFn: f =>
      typeof f.ruleTitle === 'string' && f.ruleTitle.length > 0
        ? { args: { rule_title: f.ruleTitle } }
        : {
            skip: 'no real wazuh.rule.title value discoverable from wazuh-findings-v5*',
          },
  },
  {
    name: 'search_findings_by_rule_tag',
    family: 'findings',
    argsFn: f =>
      f.ruleTag
        ? { args: { rule_tag: f.ruleTag } }
        : {
            skip: 'no real wazuh.rule.tags value discoverable from wazuh-findings-v5*',
          },
  },
  {
    name: 'get_pci_dss_findings',
    family: 'findings',
    argsFn: () => ({ args: {} }),
  },
  {
    name: 'get_pci_dss_summary',
    family: 'findings',
    argsFn: () => ({ args: {} }),
  },
  {
    name: 'search_findings_by_multiple_agents',
    family: 'findings',
    argsFn: f =>
      f.agentName
        ? {
            args: {
              agent_names: [f.agentName, f.secondAgentName].filter(Boolean),
            },
          }
        : {
            skip: 'no real wazuh.agent.name values discoverable from wazuh-findings-v5*',
          },
  },
  {
    name: 'search_findings_by_os',
    family: 'findings',
    argsFn: f =>
      f.osName
        ? { args: { os_name: f.osName } }
        : {
            skip: 'no real host.os.name value discoverable from wazuh-findings-v5*',
          },
  },
  {
    name: 'get_vulnerabilities',
    family: 'vulnerabilities',
    argsFn: () => ({ args: {} }),
  },
  {
    name: 'get_vulnerabilities_by_agent',
    family: 'vulnerabilities',
    argsFn: f =>
      f.scaAgentId
        ? { args: { agent_identifier: f.scaAgentId } }
        : {
            skip: 'no real agent id discoverable from wazuh-states-vulnerabilities*/wazuh-states-sca*',
          },
  },
  {
    name: 'get_vulnerability_by_cve',
    family: 'vulnerabilities',
    argsFn: f =>
      f.cve
        ? { args: { cve_id: f.cve } }
        : {
            skip: 'no real vulnerability.id value discoverable from wazuh-states-vulnerabilities*',
          },
  },
  { name: 'get_fim_files', family: 'fim', argsFn: () => ({ args: {} }) },
  {
    name: 'get_sca_results',
    family: 'sca',
    argsFn: f =>
      f.scaAgentId
        ? { args: { agent_id: f.scaAgentId } }
        : {
            skip: 'no real wazuh.agent.id value discoverable from wazuh-states-sca*',
          },
  },
  {
    name: 'get_sca_checks',
    family: 'sca',
    argsFn: f =>
      f.scaAgentId && f.scaPolicyId
        ? { args: { agent_id: f.scaAgentId, policy_id: f.scaPolicyId } }
        : {
            skip: 'no real agent_id + policy_id pair discoverable from wazuh-states-sca*',
          },
  },
  {
    name: 'get_mitre_findings',
    family: 'findings',
    argsFn: () => ({ args: {} }),
  },
  {
    name: 'get_mitre_summary',
    family: 'findings',
    argsFn: () => ({ args: {} }),
  },
  {
    name: 'get_agent_os',
    family: 'inventorySystem',
    argsFn: f =>
      f.inventoryAgentId
        ? { args: { agent_id: f.inventoryAgentId } }
        : {
            skip: 'no real wazuh.agent.id value discoverable from wazuh-states-inventory-system*',
          },
  },
  {
    name: 'get_agent_packages',
    family: 'inventoryPackages',
    argsFn: f =>
      f.inventoryAgentId
        ? { args: { agent_id: f.inventoryAgentId } }
        : {
            skip: 'no real wazuh.agent.id value discoverable from wazuh-states-inventory-packages*',
          },
  },
  {
    name: 'get_agent_ports',
    family: 'inventoryPorts',
    argsFn: f =>
      f.inventoryAgentId
        ? { args: { agent_id: f.inventoryAgentId } }
        : {
            skip: 'no real wazuh.agent.id value discoverable from wazuh-states-inventory-ports*',
          },
  },
  {
    name: 'get_agent_processes',
    family: 'inventoryProcesses',
    argsFn: f =>
      f.inventoryAgentId
        ? { args: { agent_id: f.inventoryAgentId } }
        : {
            skip: 'no real wazuh.agent.id value discoverable from wazuh-states-inventory-processes*',
          },
  },
  {
    name: 'search_wazuh_data',
    family: 'findings',
    argsFn: () => ({
      args: {
        index_pattern: 'wazuh-findings-v5-*',
        query_dsl: JSON.stringify({
          query: {
            bool: {
              filter: [
                { range: { '@timestamp': { gte: 'now-8d', lte: 'now' } } },
              ],
            },
          },
          size: 5,
        }),
      },
    }),
  },
];

async function registerMockProvider(baseUrl, cookies) {
  const response = await fetch(`${baseUrl}${API_ROOT}/providers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'osd-xsrf': 'true',
      Cookie: cookieHeader(cookies),
    },
    body: JSON.stringify({
      name: `eval-tool-matrix-provider-${Date.now()}`,
      type: 'openai_compatible',
      baseUrl: MOCK_BASE_URL,
      model: 'mock-model',
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '<unreadable>');
    throw new Error(
      `Failed to register mock provider: HTTP ${response.status} ${text}`,
    );
  }
  const created = await response.json();
  return created.id;
}

/** Backend-error prefixes (server/tools/executor.ts's toolErrorContent call sites) that are NOT
 * guardrail rejections -- everything else that reaches this branch (no table/digest event, but a
 * tool_call did happen) is a guardrail/safety-valve/lint rejection (checkIndexAllowlist /
 * applySafetyValves / lintDsl -- executor.ts:82-124). */
const BACKEND_ERROR_RE =
  /^Indexer query failed|^Manager request failed|^Wazuh Manager authentication failed|Internal tool execution error|^Unknown tool|^Invalid arguments/i;

/** Extracts the tool's `{"error": "..."}` result text from the mock's follow-up round: when a
 * tool call fails guardrails/execution, executor.ts never sets `outcome.tableEvent`, so
 * chat.ts (chat.ts:799-817) never yields `table`/`digest` events for it at all -- only the earlier
 * `tool_call` event exists. The error reason instead reaches the model as the `role:'tool'`
 * message content, and mock_provider.js's `lastTool` branch echoes back
 * `"MOCK ANSWER: " + content.slice(0, 100)` as the turn's prose -- this pulls that back out. */
function extractMockedToolErrorText(deltaText) {
  const match = /MOCK ANSWER: (\{.*)/.exec(deltaText);
  return match ? match[1] : deltaText;
}

/**
 * Runs one tool through the real chat route and classifies the outcome. Returns a full result
 * record (never throws -- a harness crash for one tool must not abort the whole matrix).
 */
async function runOneTool(toolDef, discovery, providerId, cookies) {
  const category = TOOL_CATEGORY[toolDef.name];
  const { args, skip } = toolDef.argsFn(discovery.fixtures);

  if (skip) {
    return {
      tool: toolDef.name,
      verdict: 'SKIPPED',
      detail: skip,
      args: null,
      elapsedMs: null,
    };
  }

  const prompt = `[[route:${category}]] Test tool ${toolDef.name}. [[mock:${
    toolDef.name
  }:${JSON.stringify(args)}]]`;
  const start = Date.now();
  let events;
  try {
    events = await chat(BASE_URL, cookies, providerId, prompt);
  } catch (error) {
    return {
      tool: toolDef.name,
      verdict: 'ERROR',
      detail: `harness crashed: ${
        error && error.message ? error.message : String(error)
      }`,
      args,
      elapsedMs: Date.now() - start,
    };
  }
  const elapsedMs = Date.now() - start;

  const toolCallEvents = events.filter(e => e && e.type === 'tool_call');
  const tableEvents = events.filter(e => e && e.type === 'table');
  const digestEvents = events.filter(e => e && e.type === 'digest');
  const streamErrorEvents = events.filter(e => e && e.type === 'error');
  const deltaText = events
    .filter(e => e && e.type === 'delta')
    .map(e => e.content)
    .join('');
  const lastEvent = events[events.length - 1];
  const gotToolCall = toolCallEvents.some(
    e => e.toolCall.name === toolDef.name,
  );

  const base = {
    tool: toolDef.name,
    args,
    elapsedMs,
    category,
    guardrailReject: false,
    tableRows: null,
    digestTotal: null,
    digestReturned: null,
  };

  if (streamErrorEvents.length > 0) {
    return {
      ...base,
      verdict: 'ERROR',
      detail: `stream error event(s): ${streamErrorEvents
        .map(e => e.message)
        .join(' | ')}`,
    };
  }

  if (!gotToolCall) {
    const saw = toolCallEvents.length
      ? toolCallEvents.map(e => e.toolCall.name).join(', ')
      : '(none)';
    return {
      ...base,
      verdict: 'ERROR',
      detail: `expected tool_call for "${toolDef.name}", saw: ${saw}`,
    };
  }

  if (!lastEvent || lastEvent.type !== 'done') {
    return {
      ...base,
      verdict: 'ERROR',
      detail: `stream did not end with 'done' (last: ${
        lastEvent ? lastEvent.type : '(no events)'
      })`,
    };
  }

  if (tableEvents.length > 0 && digestEvents.length > 0) {
    let digest;
    try {
      digest = JSON.parse(digestEvents[0].content);
    } catch (error) {
      return {
        ...base,
        verdict: 'ERROR',
        detail: `digest event content was not valid JSON: ${error.message}`,
      };
    }
    const tableRows = tableEvents[0].spec.rows.length;
    const returned = digest.counts ? digest.counts.returned : undefined;
    const total = digest.counts ? digest.counts.total : undefined;
    const resultBase = {
      ...base,
      tableRows,
      digestTotal: total,
      digestReturned: returned,
    };

    if ((returned || 0) >= 1 || tableRows >= 1) {
      return {
        ...resultBase,
        verdict: 'OK',
        detail: `returned ${returned} row(s) (table had ${tableRows})`,
      };
    }

    const familyCount = discovery.familyCounts[toolDef.family];
    if (familyCount === undefined) {
      return {
        ...resultBase,
        verdict: 'ERROR',
        detail: `tool returned 0 rows and the "${toolDef.family}" family's broad doc count could not be discovered (discovery failure) -- cannot classify EMPTY-DATA vs SUSPECT-BROKEN`,
      };
    }
    if (familyCount === 0) {
      return {
        ...resultBase,
        verdict: 'EMPTY-DATA',
        detail: `0 rows, and the "${toolDef.family}" target index family genuinely has 0 documents (verified via a direct broad indexer/manager query)`,
      };
    }
    return {
      ...resultBase,
      verdict: 'SUSPECT-BROKEN',
      detail: `0 rows returned, but the "${toolDef.family}" target index family HAS ${familyCount} document(s) -- this tool's query likely does not match live 5.0 field mappings (the get_suspicious_powershell signature)`,
    };
  }

  // No table/digest event at all: guardrail rejection or execution error (see
  // extractMockedToolErrorText's doc comment above).
  const reasonText = extractMockedToolErrorText(deltaText);
  const isBackendError = BACKEND_ERROR_RE.test(reasonText);
  return {
    ...base,
    verdict: isBackendError ? 'ERROR' : 'GUARDRAIL-REJECTED',
    guardrailReject: !isBackendError,
    detail:
      reasonText ||
      '(no tool result text captured from the mocked follow-up round)',
  };
}

function printSummaryTable(results) {
  const nameWidth =
    Math.max(...results.map(r => r.tool.length), 'TOOL'.length) + 2;
  const verdictWidth = 'GUARDRAIL-REJECTED'.length + 2;
  const header = `${'TOOL'.padEnd(nameWidth)}${'VERDICT'.padEnd(
    verdictWidth,
  )}${'ROWS'.padEnd(8)}${'MS'.padEnd(8)}DETAIL`;
  console.log(header);
  console.log('-'.repeat(header.length + 60));
  for (const r of results) {
    const rows =
      r.tableRows === null || r.tableRows === undefined
        ? '-'
        : String(r.tableRows);
    const ms =
      r.elapsedMs === null || r.elapsedMs === undefined
        ? '-'
        : String(r.elapsedMs);
    console.log(
      `${r.tool.padEnd(nameWidth)}${r.verdict.padEnd(
        verdictWidth,
      )}${rows.padEnd(8)}${ms.padEnd(8)}${r.detail}`,
    );
  }
}

async function main() {
  console.log('=== Live-data discovery (indexer + Manager) ===');
  const discovery = await discoverLiveFixtures();
  console.log(
    `Indexer access mode: ${discovery.indexerMode}  Manager access mode: ${discovery.managerMode}`,
  );
  if (discovery.modeSwitchNotes.length) {
    for (const note of discovery.modeSwitchNotes)
      console.log(`  note: ${note}`);
  }
  console.log(
    'Discovered fixtures:',
    JSON.stringify(discovery.fixtures, null, 2),
  );
  console.log(
    'Broad family doc counts:',
    JSON.stringify(discovery.familyCounts, null, 2),
  );
  if (discovery.notes.length) {
    console.log('Discovery notes/failures:');
    for (const note of discovery.notes) console.log(`  - ${note}`);
  }
  console.log('');

  console.log(`Logging in to ${BASE_URL} as ${USER}...`);
  const cookies = await login(BASE_URL, USER, PASS);
  console.log('Login OK.');
  const providerId =
    process.env.MOCK_PROVIDER_ID ||
    (await registerMockProvider(BASE_URL, cookies));
  console.log(
    `Using mock provider id: ${providerId} (baseUrl=${MOCK_BASE_URL})\n`,
  );

  const results = [];
  for (let i = 0; i < TOOL_DEFS.length; i += 1) {
    const toolDef = TOOL_DEFS[i];
    const result = await runOneTool(toolDef, discovery, providerId, cookies);
    results.push(result);
    console.log(
      `[${i + 1}/${TOOL_DEFS.length}] ${toolDef.name}: ${result.verdict} -- ${
        result.detail
      }`,
    );
    if (i < TOOL_DEFS.length - 1 && SLEEP_S > 0) {
      await sleep(SLEEP_S * 1000);
    }
  }

  console.log('\n=== Per-tool verdict table ===');
  printSummaryTable(results);

  const counts = {};
  for (const r of results) counts[r.verdict] = (counts[r.verdict] || 0) + 1;
  console.log('\n=== Verdict counts ===');
  for (const verdict of [
    'OK',
    'EMPTY-DATA',
    'SUSPECT-BROKEN',
    'GUARDRAIL-REJECTED',
    'ERROR',
    'SKIPPED',
  ]) {
    console.log(`  ${verdict.padEnd(20)}${counts[verdict] || 0}`);
  }
  console.log(`  ${'TOTAL'.padEnd(20)}${results.length}`);

  const suspectBroken = results.filter(r => r.verdict === 'SUSPECT-BROKEN');
  const errored = results.filter(r => r.verdict === 'ERROR');
  const skipped = results.filter(r => r.verdict === 'SKIPPED');
  const guardrailRejected = results.filter(
    r => r.verdict === 'GUARDRAIL-REJECTED',
  );

  if (suspectBroken.length) {
    console.log(
      '\n=== SUSPECT-BROKEN (0 rows, but the target index family HAS documents) ===',
    );
    for (const r of suspectBroken) {
      console.log(
        `  - ${r.tool} (args=${JSON.stringify(r.args)}): ${r.detail}`,
      );
    }
  }
  if (errored.length) {
    console.log('\n=== ERROR ===');
    for (const r of errored) {
      console.log(`  - ${r.tool}: ${r.detail}`);
    }
  }
  if (skipped.length) {
    console.log('\n=== SKIPPED (coverage holes) ===');
    for (const r of skipped) {
      console.log(`  - ${r.tool}: ${r.detail}`);
    }
  }
  if (guardrailRejected.length) {
    console.log('\n=== GUARDRAIL-REJECTED ===');
    for (const r of guardrailRejected) {
      console.log(
        `  - ${r.tool} (args=${JSON.stringify(r.args)}): ${r.detail}`,
      );
    }
  }

  fs.mkdirSync(LOADOUT_DIR, { recursive: true });
  const outPath = path.join(
    LOADOUT_DIR,
    `tool_matrix_${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
  );
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl: BASE_URL,
        discovery,
        results,
        counts,
      },
      null,
      2,
    ),
  );
  console.log(`\nFull report written to ${outPath}`);

  const exitCode = suspectBroken.length + errored.length;
  console.log(
    `\nExit code ${exitCode} (SUSPECT-BROKEN: ${suspectBroken.length}, ERROR: ${errored.length} -- SKIPPED/GUARDRAIL-REJECTED do not affect exit code)`,
  );
  process.exit(exitCode);
}

main().catch(error => {
  console.error('FATAL:', error);
  process.exit(2);
});
