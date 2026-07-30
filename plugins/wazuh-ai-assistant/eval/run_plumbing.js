'use strict';

/**
 * Plumbing regression: drives the REAL orchestration pipeline (server/routes/chat.ts) for every
 * tool in server/tools/registry.ts's CATALOG (29 entries), using eval/mock_provider.js instead of a real LLM so the run costs zero tokens and
 * is deterministic. The mock only replaces the "thinking" step -- tool execution still hits the
 * REAL Wazuh Manager API / Indexer via whatever EVAL_BASE_URL points at (executor.ts's
 * executeIndexerRequest /
 * executeManagerRequest are untouched), so this also regression-tests guardrails.ts + digest.ts
 * against live data, just without depending on a real model's tool-selection behavior.
 *
 * Env vars (see eval/README.md):
 *   EVAL_BASE_URL     default "https://localhost:8443"
 *   EVAL_USER         default "admin"
 *   EVAL_PASS         required
 *   MOCK_BASE_URL     default "http://localhost:9876/v1" -- baseUrl to register the mock provider
 *                     with. When the dashboard runs in a VM and this script runs on the host, the
 *                     dashboard reaches the runner over the VM's NAT gateway -- e.g.
 *                     MOCK_BASE_URL=http://10.0.2.2:9876/v1 for a default VirtualBox NAT setup.
 *   MOCK_PROVIDER_ID  optional: reuse an already-registered provider id instead of creating a new
 *                     one each run (see eval/README.md "Registering the mock provider").
 *   EVAL_SLEEP_S      seconds between calls (default 2 -- this hits a live Manager/Indexer, not a
 *                     token quota, so the default pacing is much lighter than run_live.js's).
 *
 * Exit code = number of FAILed assertions (0 = all PASS).
 */

const { login, chat, API_ROOT, cookieHeader } = require('./sse_client');
const { BASE_URL, USER, PASS, fail } = require('./cli-env');

const MOCK_BASE_URL = process.env.MOCK_BASE_URL || 'http://localhost:9876/v1';
const SLEEP_S =
  process.env.EVAL_SLEEP_S !== undefined ? Number(process.env.EVAL_SLEEP_S) : 2;
// Where THIS script (not the dashboard -- see MOCK_BASE_URL above) reaches mock_provider.js's own
// /debug/requests admin endpoints. Separate from MOCK_BASE_URL because that one is what the
// DASHBOARD is told to use (which may be a different address, e.g. 10.0.2.2 from inside a VM),
// while this script is assumed to run on the SAME host as `node mock_provider.js` (eval/README.md's
// "Step 1"/"Step 3" are both run from the same shell).
const MOCK_PORT = process.env.MOCK_PORT || 9876;
const MOCK_DEBUG_URL =
  process.env.MOCK_DEBUG_URL || `http://localhost:${MOCK_PORT}`;
// OPTIONAL pin for the privacy checks' "real value that must never leak to the provider" fixture.
// Deliberately has NO default: the privacy checks now DERIVE that value from the privacy_map event
// they are already asserting on (the entry carrying a HOST_n pseudonym), which makes them
// independent of which agents happen to exist in the index. A default here would silently defeat
// that derivation: a hardcoded default only holds while the findings index contains exactly one
// agent, and silently breaks as soon as that host drops out of the 20-most-recent window.
const REAL_AGENT_NAME_OVERRIDE = process.env.EVAL_REAL_AGENT_NAME;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * One minimal-valid args object per catalog tool (server/tools/registry.ts:42-82), derived by
 * reading each tool's `parameters` schema + `buildRequest` in server/tools/catalog/*.ts and
 * supplying only the required properties (or the smallest set that avoids a thrown validation
 * error in buildRequest, e.g. search_wazuh_data's query_dsl must itself be valid JSON text).
 * Agent-scoped tools (Manager /sca, /syscollector/*) use agent id "000" / name "wazuh-aio" --
 * NOTE this is the manager's own pseudo-agent. Syscollector endpoints (os/ports/
 * processes) on agent 000 were confirmed live vs Wazuh 4.14.6 + spec (see
 * server/tools/catalog/get_agent_os.ts and siblings); /sca on agent 000 was not separately probed,
 * so a FAIL there specifically may still reflect that, not a guardrail/digest bug.
 */
const TOOL_ARGS = {
  // Original 6 (production)
  get_active_agents: {},
  get_disconnected_agents: {},
  get_critical_findings: {},
  search_findings_by_agent: { agent_name: 'wazuh-aio' },
  get_top_rules: {},
  get_critical_vulnerabilities: {},

  // General finding search / summary
  get_findings_by_time: {},
  get_brute_force: {},
  get_security_summary: {},
  get_suspicious_powershell: {},
  search_findings_by_rule_title: {
    rule_title: 'Wazuh Rootcheck - Rootkit or malware detected',
  },
  search_findings_by_rule_tag: { rule_tag: 'sshd' },
  get_pci_dss_findings: {},
  get_pci_dss_summary: {},
  search_findings_by_multiple_agents: { agent_names: ['wazuh-aio'] },
  search_findings_by_os: { os_name: 'Ubuntu' },

  // Vulnerabilities (get_solved_vulnerabilities retired in the 5.0 port)
  get_vulnerabilities: {},
  get_vulnerabilities_by_agent: { agent_identifier: 'wazuh-aio' },
  get_vulnerability_by_cve: { cve_id: 'CVE-2021-44228' },

  // FIM / SCA / MITRE (get_fim_events replaced by get_fim_files in the 5.0 port)
  get_fim_files: {},
  get_sca_results: { agent_id: '000' },
  get_sca_checks: { agent_id: '000', policy_id: 'cis_ubuntu22-04' },
  get_mitre_findings: {},
  get_mitre_summary: {},

  // Syscollector inventory
  get_agent_os: { agent_id: '000' },
  get_agent_packages: { agent_id: '000' },
  get_agent_ports: { agent_id: '000' },
  get_agent_processes: { agent_id: '000' },

  // Escape hatch -- query_dsl is a JSON-encoded STRING per search_wazuh_data.ts's flat schema
  // (common/types.ts has no nested-object property type, search_wazuh_data.ts:7-8).
  search_wazuh_data: {
    index_pattern: 'wazuh-findings-v5-*',
    query_dsl: JSON.stringify({
      query: {
        bool: {
          filter: [{ range: { '@timestamp': { gte: 'now-1d', lte: 'now' } } }],
        },
      },
      size: 5,
    }),
  },
};

/**
 * All T1 read tools the main per-tool loop below drives (28 catalog read tools plus the
 * search_wazuh_data escape hatch). Every mutation tool was removed from the product entirely,
 * so this list is exactly `Object.keys(TOOL_ARGS)` in spirit -- kept hand-written for clarity.
 */
const TOOL_NAMES = [
  'get_active_agents',
  'get_disconnected_agents',
  'get_critical_findings',
  'search_findings_by_agent',
  'get_top_rules',
  'get_critical_vulnerabilities',
  'get_findings_by_time',
  'get_brute_force',
  'get_security_summary',
  'get_suspicious_powershell',
  'search_findings_by_rule_title',
  'search_findings_by_rule_tag',
  'get_pci_dss_findings',
  'get_pci_dss_summary',
  'search_findings_by_multiple_agents',
  'search_findings_by_os',
  'get_vulnerabilities',
  'get_vulnerabilities_by_agent',
  'get_vulnerability_by_cve',
  'get_fim_files',
  'get_sca_results',
  'get_sca_checks',
  'get_mitre_findings',
  'get_mitre_summary',
  'get_agent_os',
  'get_agent_packages',
  'get_agent_ports',
  'get_agent_processes',
  'search_wazuh_data',
];

/**
 * Router category per tool (server/tools/router.ts's TOOL_CATEGORY is the single source of truth
 * -- this is a hardcoded MIRROR of it, not a shared import, since eval/ scripts are plain Node/JS
 * with zero deps and don't compile the plugin's TypeScript, eval/README.md's "Two-stage router"
 * section). Keep in sync by hand if router.ts's map changes. Used to prepend a `[[route:CATEGORY]]`
 * marker (eval/mock_provider.js's ROUTE_MARKER_RE) so the mock's stage-1 route_question response
 * routes to the category that actually contains each tool, then falls through to the real
 * stage-2 request carrying that tool's schema for mock_provider.js's existing `[[mock:...]]`
 * handling to pick up.
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

async function registerMockProvider(baseUrl, cookies) {
  const response = await fetch(`${baseUrl}${API_ROOT}/providers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'osd-xsrf': 'true',
      Cookie: cookieHeader(cookies),
    },
    body: JSON.stringify({
      name: `eval-mock-provider-${Date.now()}`,
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

/** GET server/routes/settings.ts's API_PATHS.SETTINGS singleton (creates it with defaults on
 * first access server-side -- see getOrCreateAssistantSettings, settings.ts:28-49). */
async function getAssistantSettings(baseUrl, cookies) {
  const response = await fetch(`${baseUrl}${API_ROOT}/settings`, {
    method: 'GET',
    headers: { Cookie: cookieHeader(cookies) },
  });
  if (!response.ok) {
    throw new Error(
      `GET /settings failed: HTTP ${response.status} ${await response
        .text()
        .catch(() => '')}`,
    );
  }
  return response.json();
}

/** PUT the full AssistantSettings body (the route requires all four attributes every time --
 * settings.ts's PUT validator, settings.ts:305-321). */
async function putAssistantSettings(baseUrl, cookies, body) {
  const response = await fetch(`${baseUrl}${API_ROOT}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'osd-xsrf': 'true',
      Cookie: cookieHeader(cookies),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `PUT /settings failed: HTTP ${response.status} ${await response
        .text()
        .catch(() => '')}`,
    );
  }
  return response.json();
}

/** mock_provider.js's GET /debug/requests -- talks DIRECTLY to the mock (not through the
 * dashboard), see MOCK_DEBUG_URL's doc comment above. */
async function getMockDebugRequests() {
  const response = await fetch(`${MOCK_DEBUG_URL}/debug/requests`);
  if (!response.ok) {
    throw new Error(
      `GET ${MOCK_DEBUG_URL}/debug/requests failed: HTTP ${response.status}`,
    );
  }
  return response.json();
}

/** mock_provider.js's DELETE /debug/requests. */
async function clearMockDebugRequests() {
  const response = await fetch(`${MOCK_DEBUG_URL}/debug/requests`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(
      `DELETE ${MOCK_DEBUG_URL}/debug/requests failed: HTTP ${response.status}`,
    );
  }
  return response.json();
}

/** Any complete minted-pseudonym token (privacy.ts's PSEUDONYM_TOKEN_RE, mirrored loosely here --
 * this harness doesn't import server/ TypeScript, see eval/README.md's "zero deps" constraint). */
const PSEUDONYM_TOKEN_RE = /\b(?:HOST|IP|USER|URL|VAL)_\d+\b/;

/**
 * `note` is an optional, additive extra (every pre-existing call site omits it, unaffected):
 * printed on the status line regardless of PASS/FAIL, for a case that has more than one legitimate
 * outcome and needs to say which one actually happened, or which branch of an
 * environment-dependent check ran (e.g. `privacy_new_fields_no_leak`'s "check skipped" note).
 */
function report(name, ok, reasons, note) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${note ? ` (${note})` : ''}`);
  if (!ok) {
    for (const reason of reasons) {
      console.log(`    - ${reason}`);
    }
  }
}

/** Shared assertions for a single tool-call round: right tool called, no error, table, done. */
function assertToolRound(toolName, events) {
  const reasons = [];
  const toolCallEvents = events.filter(
    event => event && event.type === 'tool_call',
  );
  const errorEvents = events.filter(event => event && event.type === 'error');
  const tableEvents = events.filter(event => event && event.type === 'table');
  const lastEvent = events[events.length - 1];

  if (!toolCallEvents.some(event => event.toolCall.name === toolName)) {
    reasons.push(
      `expected tool_call for "${toolName}", saw: ${
        toolCallEvents.length
          ? toolCallEvents.map(e => e.toolCall.name).join(', ')
          : '(none)'
      }`,
    );
  }
  // Two-stage router (server/tools/router.ts): stage-1's route_question call is INTERNAL --
  // server/routes/chat.ts's runStage1Routing must never forward it as an SSE tool_call event.
  if (toolCallEvents.some(event => event.toolCall.name === 'route_question')) {
    reasons.push(
      'route_question leaked as a tool_call SSE event (stage 1 must stay internal-only)',
    );
  }
  if (errorEvents.length > 0) {
    reasons.push(
      `unexpected error event(s): ${errorEvents
        .map(e => e.message)
        .join(' | ')}`,
    );
  }
  if (tableEvents.length === 0) {
    reasons.push(
      'expected a table event, got none (tool execution may have failed guardrails/backend)',
    );
  }
  if (!lastEvent || lastEvent.type !== 'done') {
    reasons.push(
      `stream did not end with 'done' (last: ${
        lastEvent ? lastEvent.type : '(no events)'
      })`,
    );
  }
  return reasons;
}

async function main() {
  console.log(`Logging in to ${BASE_URL} as ${USER}...`);
  const cookies = await login(BASE_URL, USER, PASS);
  console.log('Login OK.');

  const providerId =
    process.env.MOCK_PROVIDER_ID ||
    (await registerMockProvider(BASE_URL, cookies));
  console.log(
    `Using mock provider id: ${providerId} (baseUrl=${MOCK_BASE_URL})\n`,
  );

  let failCount = 0;
  let index = 0;
  // +1 429-once, +1 router general-only, +6 the privacy pipeline block (settings smoke test,
  // privacy-on, privacy-off regression, map round-trip dedup, widened-fields no-leak check,
  // final settings restore).
  const totalRuns = TOOL_NAMES.length + 2 + 6;

  for (const toolName of TOOL_NAMES) {
    index += 1;
    const args = TOOL_ARGS[toolName];
    const category = TOOL_CATEGORY[toolName];
    if (!category) {
      fail(
        `TOOL_CATEGORY has no entry for "${toolName}" -- keep it in sync with server/tools/router.ts.`,
      );
    }
    // [[route:CATEGORY]] prepended (not appended) so mock_provider.js's end-anchored
    // [[mock:TOOLNAME:args]] marker still matches for the stage-2 round that follows stage 1.
    const prompt = `[[route:${category}]] Test tool ${toolName}. [[mock:${toolName}:${JSON.stringify(
      args,
    )}]]`;
    let reasons;
    try {
      const events = await chat(BASE_URL, cookies, providerId, prompt);
      reasons = assertToolRound(toolName, events);
    } catch (error) {
      reasons = [
        `harness crashed: ${
          error && error.message ? error.message : String(error)
        }`,
      ];
    }
    const ok = reasons.length === 0;
    if (!ok) failCount += 1;
    console.log(`[${index}/${totalRuns}]`);
    report(toolName, ok, reasons);

    if (index < totalRuns && SLEEP_S > 0) {
      await sleep(SLEEP_S * 1000);
    }
  }

  // 429-once: assert a `status` event mentioning "retrying" (retry.ts:94-100), no error, done.
  index += 1;
  console.log(`[${index}/${totalRuns}]`);
  {
    let reasons = [];
    try {
      const events = await chat(
        BASE_URL,
        cookies,
        providerId,
        'Trigger a rate limit. [[mock:429-once]]',
      );
      const statusEvents = events.filter(
        event => event && event.type === 'status',
      );
      const errorEvents = events.filter(
        event => event && event.type === 'error',
      );
      const lastEvent = events[events.length - 1];
      if (!statusEvents.some(event => /retrying/i.test(event.message || ''))) {
        reasons.push(
          `expected a status event containing "retrying", saw: ${
            statusEvents.length
              ? statusEvents.map(e => e.message).join(' | ')
              : '(none)'
          }`,
        );
      }
      if (errorEvents.length > 0) {
        reasons.push(
          `unexpected error event(s): ${errorEvents
            .map(e => e.message)
            .join(' | ')}`,
        );
      }
      if (!lastEvent || lastEvent.type !== 'done') {
        reasons.push(
          `stream did not end with 'done' (last: ${
            lastEvent ? lastEvent.type : '(no events)'
          })`,
        );
      }
    } catch (error) {
      reasons = [
        `harness crashed: ${
          error && error.message ? error.message : String(error)
        }`,
      ];
    }
    const ok = reasons.length === 0;
    if (!ok) failCount += 1;
    report('retry_429_once', ok, reasons);
  }

  // [[route:general]]-only: mock_provider.js's stage-1 branch echoes categories:["general"]
  // (eval/mock_provider.js's ROUTE_MARKER_RE), so server/tools/router.ts's resolveStage2Tools
  // resolves `tools: undefined` for the turn (routed to `general` alone) and
  // the stage-2 round runs with no tools at all: assert NO tool_call and NO table, just a normal
  // text answer ending in 'done'.
  index += 1;
  console.log(`[${index}/${totalRuns}]`);
  {
    let reasons = [];
    try {
      const events = await chat(
        BASE_URL,
        cookies,
        providerId,
        '[[route:general]] Hello there, just say hi back, no data needed.',
      );
      const toolCallEvents = events.filter(
        event => event && event.type === 'tool_call',
      );
      const tableEvents = events.filter(
        event => event && event.type === 'table',
      );
      const errorEvents = events.filter(
        event => event && event.type === 'error',
      );
      const lastEvent = events[events.length - 1];
      if (toolCallEvents.length > 0) {
        reasons.push(
          `expected no tool_call events, saw: ${toolCallEvents
            .map(e => e.toolCall.name)
            .join(', ')}`,
        );
      }
      if (tableEvents.length > 0) {
        reasons.push(`expected no table events, saw ${tableEvents.length}`);
      }
      if (errorEvents.length > 0) {
        reasons.push(
          `unexpected error event(s): ${errorEvents
            .map(e => e.message)
            .join(' | ')}`,
        );
      }
      if (!lastEvent || lastEvent.type !== 'done') {
        reasons.push(
          `stream did not end with 'done' (last: ${
            lastEvent ? lastEvent.type : '(no events)'
          })`,
        );
      }
    } catch (error) {
      reasons = [
        `harness crashed: ${
          error && error.message ? error.message : String(error)
        }`,
      ];
    }
    const ok = reasons.length === 0;
    if (!ok) failCount += 1;
    report('route_general_only', ok, reasons);
  }

  // ===================================================================================
  // Privacy pipeline block: the client/eval side of the server's pseudonymization pipeline.
  // Runs after all 30 checks above, reusing the same mock provider and session.
  // ===================================================================================

  // --- settings_routes_smoke: GET (assert shape) -> PUT a modified fieldPolicy -> GET (assert
  // persisted). The modified fieldPolicy is NOT reverted immediately after this check -- see the
  // comment below for why it has to stay active through the privacy checks that follow, and
  // `settings_restore_defaults` at the very end of this block for where it finally gets undone.
  index += 1;
  console.log(`[${index}/${totalRuns}]`);
  let originalSettings;
  {
    let reasons = [];
    try {
      originalSettings = await getAssistantSettings(BASE_URL, cookies);
      if (
        typeof originalSettings.privacyDefaultOn !== 'boolean' ||
        typeof originalSettings.userCanOverride !== 'boolean' ||
        typeof originalSettings.privacyDefaultPerProvider !== 'object' ||
        originalSettings.privacyDefaultPerProvider === null ||
        !Array.isArray(originalSettings.fieldPolicy)
      ) {
        reasons.push(
          `GET /settings returned an unexpected shape: ${JSON.stringify(
            originalSettings,
          )}`,
        );
      }

      // Pure persistence check with an inert rule (a field no tool's digest ever carries). The
      // privacy_on_pseudonymization check below needs NO policy modification: FIELD_POLICY_DEFAULTS
      // ships tool-scoped entries for the Manager agents tools ("get_active_agents/name" -> HOST,
      // ".../ip" -> IP -- see server/tools/privacy.ts), so the defaults alone anonymize that
      // digest.
      // The rule stays active until settings_restore_defaults at the end of this file, proving
      // persistence across the intervening checks rather than just across one GET.
      const modifiedFieldPolicy = [
        ...originalSettings.fieldPolicy,
        { field: 'eval.test_field', action: 'never' },
      ];
      await putAssistantSettings(BASE_URL, cookies, {
        ...originalSettings,
        fieldPolicy: modifiedFieldPolicy,
      });

      const reGet = await getAssistantSettings(BASE_URL, cookies);
      const hasTestRule = (reGet.fieldPolicy || []).some(
        entry => entry.field === 'eval.test_field' && entry.action === 'never',
      );
      if (!hasTestRule) {
        reasons.push(
          `PUT /settings did not persist the added fieldPolicy entry: ${JSON.stringify(
            reGet.fieldPolicy,
          )}`,
        );
      }
    } catch (error) {
      reasons.push(
        `harness crashed: ${
          error && error.message ? error.message : String(error)
        }`,
      );
    }
    const ok = reasons.length === 0;
    if (!ok) failCount += 1;
    report('settings_routes_smoke', ok, reasons);
  }

  // --- privacy_on_pseudonymization: get_findings_by_time with privacy:{enabled:true, map:[]}.
  // get_findings_by_time rather than get_active_agents: a stack with no enrolled agents beyond the
  // excluded pseudo-agent 000 returns zero rows from the agents tools, leaving nothing to
  // pseudonymize. The findings index carries data either way, and its digest samples carry
  // "wazuh.agent.name" -- a plain FIELD_POLICY_DEFAULTS entry (kind HOST) that anonymizes its value.
  index += 1;
  console.log(`[${index}/${totalRuns}]`);
  let mintedEntries = [];
  {
    let reasons = [];
    try {
      await clearMockDebugRequests();
      const events = await chat(
        BASE_URL,
        cookies,
        providerId,
        '[[route:findings]] What findings fired recently? [[mock:get_findings_by_time:{}]]',
        { privacy: { enabled: true, map: [] } },
      );

      const errorEvents = events.filter(
        event => event && event.type === 'error',
      );
      const privacyMapEvents = events.filter(
        event => event && event.type === 'privacy_map',
      );
      const digestEvents = events.filter(
        event => event && event.type === 'digest',
      );
      const tableEvents = events.filter(
        event => event && event.type === 'table',
      );
      const toolCallEvents = events.filter(
        event => event && event.type === 'tool_call',
      );

      if (errorEvents.length > 0) {
        reasons.push(
          `unexpected error event(s): ${errorEvents
            .map(e => e.message)
            .join(' | ')}`,
        );
      }

      // (a) a privacy_map event arrived carrying a HOST pseudonym, and the real host value is
      // DERIVED from that entry rather than hard-coded.
      //
      // Asserting a specific host name here would only hold while the findings index contained
      // exactly ONE agent: with several, `get_findings_by_time`'s 20-most-recent window may not
      // include that host, failing the gate for a reason unrelated to privacy. Deriving from the
      // map keeps every property below identical — the real value must be minted, must NOT reach
      // the digest or the provider, and MUST still reach the local table — while staying
      // independent of which
      // agents happen to be in the data. EVAL_REAL_AGENT_NAME still pins it explicitly if set.
      mintedEntries = privacyMapEvents.flatMap(event => event.entries || []);
      const hostEntry = mintedEntries.find(entry =>
        /^HOST_\d+$/.test(String(entry.pseudonym)),
      );
      const realHostValue =
        REAL_AGENT_NAME_OVERRIDE || (hostEntry && hostEntry.value);
      if (!hostEntry) {
        reasons.push(
          `expected a privacy_map entry with a HOST_n pseudonym, saw: ${JSON.stringify(
            mintedEntries,
          )}`,
        );
      }
      if (realHostValue && /^HOST_\d+$/.test(String(realHostValue))) {
        reasons.push(
          `the minted HOST entry's value is itself a pseudonym: ${realHostValue}`,
        );
      }

      // (b) the correlated digest event's content does not leak the real value and carries a
      // HOST pseudonym: "wazuh.agent.name" is a plain FIELD_POLICY_DEFAULTS entry (kind HOST),
      // so the findings digest anonymizes its value to HOST_n out of the box -- no policy
      // modification required.
      const toolCallEvent = toolCallEvents.find(
        event => event.toolCall.name === 'get_findings_by_time',
      );
      const digestEvent = toolCallEvent
        ? digestEvents.find(
            event => event.toolCallId === toolCallEvent.toolCall.id,
          )
        : undefined;
      if (!digestEvent) {
        reasons.push(
          'expected a digest event correlated to the get_findings_by_time tool_call, got none',
        );
      } else {
        if (realHostValue && digestEvent.content.includes(realHostValue)) {
          reasons.push(
            `digest content leaked the real value "${realHostValue}": ${digestEvent.content}`,
          );
        }
        if (!/HOST_\d+/.test(digestEvent.content)) {
          reasons.push(
            `digest content has no HOST_n pseudonym token: ${digestEvent.content}`,
          );
        }
      }

      // (c) no request body the mock provider actually received contains the real value anywhere.
      const providerRequests = await getMockDebugRequests();
      const leaked =
        realHostValue &&
        providerRequests.some(requestBody =>
          JSON.stringify(requestBody).includes(realHostValue),
        );
      if (leaked) {
        reasons.push(
          `a request body sent to the mock provider contained "${realHostValue}"`,
        );
      }

      // (d) the table event (local-only, never sent to the provider) keeps the real data.
      const tableHasRealValue =
        realHostValue &&
        tableEvents.some(event =>
          JSON.stringify(event.spec).includes(realHostValue),
        );
      if (!tableHasRealValue) {
        reasons.push(
          `expected the table event to contain the real value "${realHostValue}"`,
        );
      }

      // (e) the tool_call SSE event's arguments are real-form. get_active_agents takes no
      // arguments, so this only confirms the inbound pseudonym-reversal pass in chat.ts did not
      // corrupt an empty object --
      // this zero-token scripted mock never emits pseudonym-form arguments in the first place (it
      // just echoes the prompt's plain-JSON [[mock:...]] marker back), so a stronger round-trip
      // check isn't possible with this harness; see eval/README.md's privacy section.
      if (!toolCallEvent) {
        reasons.push(
          'expected a tool_call event for get_findings_by_time, got none',
        );
      } else if (JSON.stringify(toolCallEvent.toolCall.arguments) !== '{}') {
        reasons.push(
          `expected empty real-form arguments, got: ${JSON.stringify(
            toolCallEvent.toolCall.arguments,
          )}`,
        );
      }
    } catch (error) {
      reasons.push(
        `harness crashed: ${
          error && error.message ? error.message : String(error)
        }`,
      );
    }
    const ok = reasons.length === 0;
    if (!ok) failCount += 1;
    report('privacy_on_pseudonymization', ok, reasons);
  }

  // --- privacy_off_regression: same prompt, no `privacy` key at all (mirrors a client that has
  // never touched privacy mode).
  index += 1;
  console.log(`[${index}/${totalRuns}]`);
  {
    let reasons = [];
    try {
      const events = await chat(
        BASE_URL,
        cookies,
        providerId,
        '[[route:findings]] What findings fired recently? [[mock:get_findings_by_time:{}]]',
      );
      const errorEvents = events.filter(
        event => event && event.type === 'error',
      );
      const privacyMapEvents = events.filter(
        event => event && event.type === 'privacy_map',
      );
      const digestEvents = events.filter(
        event => event && event.type === 'digest',
      );

      if (errorEvents.length > 0) {
        reasons.push(
          `unexpected error event(s): ${errorEvents
            .map(e => e.message)
            .join(' | ')}`,
        );
      }
      if (privacyMapEvents.length > 0) {
        reasons.push(
          `expected no privacy_map event with privacy off, saw: ${JSON.stringify(
            privacyMapEvents,
          )}`,
        );
      }
      const digestEvent = digestEvents[0];
      // Asserts the INVERSE property instead of naming a specific agent: with privacy off nothing
      // is pseudonymized, so the digest must carry NO pseudonym token at all and must still carry a
      // real agent name (any non-empty one). Requiring a literal agent name here would depend on
      // that being the only agent in the index: adding more pushes it out of the 20-most-recent
      // window and fails the gate for a reason unrelated to privacy.
      const PSEUDONYM_TOKEN_RE = /\b(?:HOST|USER|IP|URL|VAL)_\d+\b/;
      if (!digestEvent) {
        reasons.push('expected a digest event, got none');
      } else if (PSEUDONYM_TOKEN_RE.test(digestEvent.content)) {
        reasons.push(
          `expected NO pseudonym tokens in the digest with privacy off, got: ${digestEvent.content}`,
        );
      } else if (!/"wazuh\.agent\.name":"[^"]+"/.test(digestEvent.content)) {
        reasons.push(
          `expected the digest to carry a real (non-empty) wazuh.agent.name with privacy off, got: ${digestEvent.content}`,
        );
      }
    } catch (error) {
      reasons.push(
        `harness crashed: ${
          error && error.message ? error.message : String(error)
        }`,
      );
    }
    const ok = reasons.length === 0;
    if (!ok) failCount += 1;
    report('privacy_off_regression', ok, reasons);
  }

  // --- privacy_map_dedup_roundtrip: re-send with privacy:{enabled:true, map:mintedEntries} (the
  // client's full held map from privacy_on_pseudonymization above) plus a second question; the
  // already-seeded value must not be re-minted as a NEW privacy_map entry.
  index += 1;
  console.log(`[${index}/${totalRuns}]`);
  {
    let reasons = [];
    try {
      const events = await chat(
        BASE_URL,
        cookies,
        providerId,
        '[[route:findings]] And what fired before that? [[mock:get_findings_by_time:{}]]',
        { privacy: { enabled: true, map: mintedEntries } },
      );
      const errorEvents = events.filter(
        event => event && event.type === 'error',
      );
      if (errorEvents.length > 0) {
        reasons.push(
          `unexpected error event(s): ${errorEvents
            .map(e => e.message)
            .join(' | ')}`,
        );
      }
      const privacyMapEvents = events.filter(
        event => event && event.type === 'privacy_map',
      );
      const newEntries = privacyMapEvents.flatMap(event => event.entries || []);
      const seededValues = new Set(mintedEntries.map(entry => entry.value));
      const duplicate = newEntries.find(entry => seededValues.has(entry.value));
      if (duplicate) {
        reasons.push(
          `privacy_map re-minted an already-seeded value: ${JSON.stringify(
            duplicate,
          )}`,
        );
      }
      // server/tools/privacy.ts's Pseudonymizer.pseudonymize() returns the seeded pseudonym as-is
      // for an already-known value (never appending to `minted`), so chat.ts's emitPrivacyMapOnce
      // (which only fires when newEntries() is non-empty) should not emit a privacy_map event AT
      // ALL here -- a stronger assertion than just "no duplicate", asserted directly.
      if (privacyMapEvents.length > 0) {
        reasons.push(
          `expected no privacy_map event on a full-map round-trip, saw: ${JSON.stringify(
            privacyMapEvents,
          )}`,
        );
      }
    } catch (error) {
      reasons.push(
        `harness crashed: ${
          error && error.message ? error.message : String(error)
        }`,
      );
    }
    const ok = reasons.length === 0;
    if (!ok) failCount += 1;
    report('privacy_map_dedup_roundtrip', ok, reasons);
  }

  // --- privacy_new_fields_no_leak: widens the same no-leak pattern as
  // privacy_on_pseudonymization above to the finding investigation fields
  // (server/tools/catalog/common.ts's FINDING_DIGEST_EXTRA_COLUMNS), which must all be
  // classified in the field policy. `data.dstuser` is chosen because a live population
  // probe measured it at ~90% over a 7-day window,
  // the most likely of the new fields to actually appear in a live 5-row digest sample -- but this
  // harness drives a real, mutable Indexer (no local fixture file to seed, unlike a unit test), so
  // whether it's present THIS run is still not guaranteed. Rather than asserting on a hardcoded
  // value (this harness has no way to know a real username in advance, unlike REAL_AGENT_NAME
  // which is an env-configured fixture), it discovers a real value live from a privacy-OFF digest
  // first, then re-runs with privacy ON and asserts that exact value never reaches the provider or
  // the digest. If no sample carries the field this run, the check reports PASS with a note rather
  // than failing on an environment condition it cannot control (mirrors corpus.json's
  // 'required_empty_ok' tolerance for live-data variability).
  index += 1;
  console.log(`[${index}/${totalRuns}]`);
  {
    let reasons = [];
    let note;
    try {
      const offEvents = await chat(
        BASE_URL,
        cookies,
        providerId,
        '[[route:findings]] Which users had sessions closed in the last 24 hours? [[mock:get_findings_by_time:{}]]',
      );
      const offDigest = offEvents.find(
        event => event && event.type === 'digest',
      );
      let realDstUser;
      if (offDigest) {
        const match = /"data\.dstuser":"([^"]+)"/.exec(offDigest.content);
        realDstUser = match ? match[1] : undefined;
      }

      if (!realDstUser) {
        note =
          "no data.dstuser value present in this run's live digest sample -- check skipped";
      } else {
        await clearMockDebugRequests();
        const onEvents = await chat(
          BASE_URL,
          cookies,
          providerId,
          '[[route:findings]] Which users had sessions closed in the last 24 hours? [[mock:get_findings_by_time:{}]]',
          { privacy: { enabled: true, map: [] } },
        );
        const errorEvents = onEvents.filter(
          event => event && event.type === 'error',
        );
        if (errorEvents.length > 0) {
          reasons.push(
            `unexpected error event(s): ${errorEvents
              .map(e => e.message)
              .join(' | ')}`,
          );
        }
        const onDigest = onEvents.find(
          event => event && event.type === 'digest',
        );
        if (!onDigest) {
          reasons.push(
            'expected a digest event on the privacy-on re-run, got none',
          );
        } else {
          if (onDigest.content.includes(realDstUser)) {
            reasons.push(
              `digest content leaked the real value "${realDstUser}": ${onDigest.content}`,
            );
          }
          if (!PSEUDONYM_TOKEN_RE.test(onDigest.content)) {
            reasons.push(
              `digest content has no pseudonym token: ${onDigest.content}`,
            );
          }
        }
        const providerRequests = await getMockDebugRequests();
        const leaked = providerRequests.some(requestBody =>
          JSON.stringify(requestBody).includes(realDstUser),
        );
        if (leaked) {
          reasons.push(
            `a request body sent to the mock provider contained "${realDstUser}"`,
          );
        }
        const onTableEvents = onEvents.filter(
          event => event && event.type === 'table',
        );
        const tableHasRealValue = onTableEvents.some(event =>
          JSON.stringify(event.spec).includes(realDstUser),
        );
        if (!tableHasRealValue) {
          reasons.push(
            `expected the table event to still contain the real value "${realDstUser}"`,
          );
        }
      }
    } catch (error) {
      reasons.push(
        `harness crashed: ${
          error && error.message ? error.message : String(error)
        }`,
      );
    }
    const ok = reasons.length === 0;
    if (!ok) failCount += 1;
    report('privacy_new_fields_no_leak', ok, reasons, note);
  }

  // --- settings_restore_defaults: undo settings_routes_smoke's added fieldPolicy entry now that
  // every check that depended on it has run, leaving the target dashboard exactly as this script
  // found it.
  index += 1;
  console.log(`[${index}/${totalRuns}]`);
  {
    let reasons = [];
    try {
      if (!originalSettings) {
        reasons.push(
          'originalSettings was never captured (settings_routes_smoke must have failed earlier); nothing to restore.',
        );
      } else {
        await putAssistantSettings(BASE_URL, cookies, originalSettings);
        const restored = await getAssistantSettings(BASE_URL, cookies);
        // Key-order-insensitive comparison: the saved-object round-trip does not preserve JSON
        // key order inside entries ({field,kind,action} came back as {field,action,kind} in the
        // first live run), so canonicalize each entry to "field|action|kind" and sort.
        const canonical = policy =>
          (policy || [])
            .map(entry => `${entry.field}|${entry.action}|${entry.kind || ''}`)
            .sort()
            .join(';');
        if (
          canonical(restored.fieldPolicy) !==
          canonical(originalSettings.fieldPolicy)
        ) {
          reasons.push(
            'settings did not restore to their original fieldPolicy after the cleanup PUT',
          );
        }
      }
    } catch (error) {
      reasons.push(
        `harness crashed: ${
          error && error.message ? error.message : String(error)
        }`,
      );
    }
    const ok = reasons.length === 0;
    if (!ok) failCount += 1;
    report('settings_restore_defaults', ok, reasons);
  }

  console.log('\n=== Summary ===');
  console.log(
    `PASS: ${totalRuns - failCount}  FAIL: ${failCount}  TOTAL: ${totalRuns}`,
  );
  process.exit(failCount);
}

main().catch(error => {
  console.error('FATAL:', error);
  process.exit(2);
});
