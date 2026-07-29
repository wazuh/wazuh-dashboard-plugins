'use strict';

/**
 * Live-data discovery + index-family verification for eval/run_tool_matrix.js.
 *
 * Supplies each of the 29 catalog tools (server/tools/registry.ts) with a REAL argument value --
 * an agent id that actually has documents, a CVE that actually exists, an SCA policy id that
 * actually exists -- instead of a hardcoded guess, and separately answers "does this tool's target
 * index family hold any documents at all". Without the second answer a 0-row result is ambiguous:
 * run_tool_matrix.js's classifyResult needs it to tell an empty index (EMPTY-DATA) apart from a
 * tool that is silently broken (SUSPECT-BROKEN).
 *
 * Two data sources (Indexer and Manager API), each tried DIRECT first with a one-time fallback to
 * running `curl` on the target host over SSH. The fallback result is cached per source for the
 * rest of the run rather than re-probed per query.
 *
 * The fallback exists because a port-forwarded indexer is often not reachable from outside the
 * host running it: OpenSearch commonly binds 127.0.0.1, so a forwarded port accepts the TCP
 * connection while the TLS handshake never completes. Set EVAL_INDEXER_URL when the indexer IS
 * directly reachable, and EVAL_SSH_HOST (plus EVAL_SSH_CONFIG if the host needs a specific ssh
 * config) to enable the fallback. Every connection setting is an environment variable; this file
 * hardcodes no host and no credential.
 */

const { execFile } = require('child_process');

/** Exits with an actionable message rather than failing later on an unauthenticated request. */
function requireEnv(name, purpose) {
  const value = process.env[name];
  if (!value) {
    console.error(`ERROR: ${name} is required (${purpose}).`);
    process.exit(2);
  }
  return value;
}

// Usernames default to the product defaults; passwords never do. A credential fallback would make
// this script attempt a well-known login against whatever host it is pointed at.
const ES_USER = process.env.EVAL_ES_USER || 'admin';
const ES_PASS = requireEnv(
  'EVAL_ES_PASS',
  `the indexer password for ${ES_USER}`,
);
const INDEXER_URL = (
  process.env.EVAL_INDEXER_URL || 'https://localhost:9200'
).replace(/\/$/, '');
// The address the SSH fallback uses ON the target host, which is usually not the forwarded port
// the direct path above uses.
const INDEXER_URL_ON_HOST =
  process.env.EVAL_INDEXER_URL_ON_HOST || 'https://localhost:9200';

const MANAGER_USER = process.env.EVAL_MANAGER_USER || 'wazuh';
const MANAGER_PASS = requireEnv(
  'EVAL_MANAGER_PASS',
  `the Manager API password for ${MANAGER_USER}`,
);
const MANAGER_URL = (
  process.env.EVAL_MANAGER_URL || 'https://localhost:55000'
).replace(/\/$/, '');
const MANAGER_URL_ON_HOST =
  process.env.EVAL_MANAGER_URL_ON_HOST || 'https://localhost:55000';

// Optional: set EVAL_SSH_HOST to enable the run-curl-over-SSH fallback described in the header.
// EVAL_SSH_CONFIG is passed to `ssh -F` when the host is not resolvable from the default config.
const SSH_HOST = process.env.EVAL_SSH_HOST;
const SSH_CONFIG = process.env.EVAL_SSH_CONFIG;
const SSH_TIMEOUT_MS = Number(process.env.EVAL_SSH_TIMEOUT_MS || 20000);
const DIRECT_TIMEOUT_MS = Number(process.env.EVAL_DIRECT_TIMEOUT_MS || 5000);

/** `opts.input`, when set, is written to the child's stdin and the stream is then closed. */
function execFilePromise(cmd, args, opts = {}) {
  const { input, ...execOpts } = opts;
  return new Promise((resolve, reject) => {
    const child = execFile(cmd, args, execOpts, (error, stdout, stderr) => {
      if (error) {
        reject(
          new Error(`${error.message}${stderr ? ` | stderr: ${stderr}` : ''}`),
        );
        return;
      }
      resolve(stdout);
    });
    if (input !== undefined) {
      child.stdin.end(input);
    }
  });
}

/** Wraps a value for safe interpolation into the single remote shell command line. */
function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

/** `ssh` argv for a remote command, or a clear failure when no host is configured. */
function sshArgs(remoteCmd) {
  if (!SSH_HOST) {
    throw new Error(
      'the direct connection failed and no SSH fallback is configured; ' +
        "set EVAL_SSH_HOST (see this file's header)",
    );
  }
  return SSH_CONFIG
    ? ['-F', SSH_CONFIG, SSH_HOST, remoteCmd]
    : [SSH_HOST, remoteCmd];
}

/**
 * Runs `curl` on the target host over SSH and returns the raw response body (parsed as JSON by the
 * caller).
 *
 * Credentials go to `curl --config -` over stdin, never into the remote command line: the command
 * line is visible in the remote host's process table for the lifetime of the request, and it is
 * also the argv of the login shell that runs it.
 */
async function sshCurl({ user, pass, url, body, method }) {
  const parts = ['curl', '-sk', '--config', '-'];
  if (method) parts.push('-X', shellQuote(method));
  parts.push(shellQuote(url));
  if (body !== undefined) {
    parts.push('-d', shellQuote(JSON.stringify(body)));
  }
  const stdout = await execFilePromise('ssh', sshArgs(parts.join(' ')), {
    timeout: SSH_TIMEOUT_MS,
    maxBuffer: 16 * 1024 * 1024,
    input: curlConfig([
      `user = "${curlConfigValue(`${user}:${pass}`)}"`,
      'header = "Content-Type: application/json"',
    ]),
  });
  return stdout;
}

/** curl's config-file format: one directive per line. */
function curlConfig(directives) {
  return `${directives.join('\n')}\n`;
}

/** Escapes a value for curl's double-quoted config syntax. */
function curlConfigValue(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Direct HTTPS fetch, same request shape as sshCurl above (caller passes the SAME url string
 * shape; direct callers pass the reachable URL, ssh callers pass the on-host URL). */
async function directFetch({ user, pass, url, body, method }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DIRECT_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: method || (body !== undefined ? 'POST' : 'GET'),
      signal: controller.signal,
      headers: {
        Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString(
          'base64',
        )}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * One data source's direct-vs-ssh mode, decided once (on the first call) and cached for every
 * subsequent call -- avoids re-probing a known-dead direct path on every single discovery query.
 */
function makeModeSwitchedClient({
  directUrlBase,
  sshUrlBase,
  user,
  pass,
  label,
}) {
  let mode; // 'direct' | 'ssh', set on first call
  const attempts = [];

  async function call(path, body, method) {
    if (!mode || mode === 'direct') {
      try {
        const text = await directFetch({
          user,
          pass,
          url: `${directUrlBase}${path}`,
          body,
          method,
        });
        mode = 'direct';
        return text;
      } catch (error) {
        attempts.push(
          `direct ${label} failed (${error.message}); falling back to SSH`,
        );
        mode = 'ssh';
      }
    }
    return sshCurl({ user, pass, url: `${sshUrlBase}${path}`, body, method });
  }

  return { call, getMode: () => mode, getAttempts: () => attempts };
}

const indexerClient = makeModeSwitchedClient({
  directUrlBase: INDEXER_URL,
  sshUrlBase: INDEXER_URL_ON_HOST,
  user: ES_USER,
  pass: ES_PASS,
  label: 'indexer',
});
const managerClient = makeModeSwitchedClient({
  directUrlBase: MANAGER_URL,
  sshUrlBase: MANAGER_URL_ON_HOST,
  user: MANAGER_USER,
  pass: MANAGER_PASS,
  label: 'manager',
});

async function esSearch(indexPattern, body) {
  const text = await indexerClient.call(`/${indexPattern}/_search`, body);
  return JSON.parse(text);
}

async function esCount(indexPattern, query) {
  const text = await indexerClient.call(`/${indexPattern}/_count`, {
    query: query || { match_all: {} },
  });
  return JSON.parse(text).count;
}

async function managerAuthToken() {
  const text = await managerClient.call(
    '/security/user/authenticate',
    undefined,
    'POST',
  );
  return JSON.parse(text).data.token;
}

async function managerGetAgentsExcludingManager() {
  const token = await managerAuthToken();
  // The token-bearing GET needs a Bearer Authorization header, which the generic Basic-auth
  // client above doesn't send -- built directly here, reusing whichever mode (direct/ssh) the
  // auth call just settled on.
  const url = `${
    managerClient.getMode() === 'direct' ? MANAGER_URL : MANAGER_URL_ON_HOST
  }/agents?q=id!=000`;
  return managerGetAgentsBearer(token, url);
}

async function managerGetAgentsBearer(token, url) {
  if (managerClient.getMode() === 'direct') {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DIRECT_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      const json = await response.json();
      return json.data.total_affected_items;
    } finally {
      clearTimeout(timer);
    }
  }
  // Bearer token over stdin for the same reason sshCurl sends Basic credentials that way.
  const stdout = await execFilePromise(
    'ssh',
    sshArgs(`curl -sk --config - ${shellQuote(url)}`),
    {
      timeout: SSH_TIMEOUT_MS,
      input: curlConfig([
        `header = "Authorization: Bearer ${curlConfigValue(token)}"`,
      ]),
    },
  );
  return JSON.parse(stdout).data.total_affected_items;
}

/**
 * The one discovery pass this whole harness needs: real values pulled live from the indexer/
 * Manager, plus a broad (match_all) doc count per target-index family used later to classify a
 * 0-row tool result as EMPTY-DATA vs SUSPECT-BROKEN. Every `undefined` field below means "could
 * not discover a real value for this" -- callers must treat that as a coverage hole (SKIPPED), not
 * silently substitute a guess (the whole point of this task).
 */
async function discoverLiveFixtures() {
  const notes = [];
  const fixtures = {};
  const familyCounts = {};

  // --- Findings family (wazuh-findings-v5*): agent names, rule ids, rule tags, OS names. --------
  try {
    const agg = await esSearch('wazuh-findings-v5*', {
      size: 0,
      aggs: {
        agents: { terms: { field: 'wazuh.agent.name', size: 10 } },
        tags: { terms: { field: 'rule.tags', size: 10 } },
        rule_ids: { terms: { field: 'rule.id', size: 10 } },
        os: { terms: { field: 'host.os.name', size: 10 } },
      },
    });
    familyCounts.findings = agg.hits.total.value;
    const agentBuckets = agg.aggregations.agents.buckets;
    const tagBuckets = agg.aggregations.tags.buckets;
    const ruleIdBuckets = agg.aggregations.rule_ids.buckets;
    const osBuckets = agg.aggregations.os.buckets;
    if (agentBuckets[0]) fixtures.agentName = agentBuckets[0].key;
    if (agentBuckets[1]) fixtures.secondAgentName = agentBuckets[1].key;
    if (tagBuckets[0]) fixtures.ruleTag = tagBuckets[0].key;
    if (ruleIdBuckets[0]) fixtures.ruleId = Number(ruleIdBuckets[0].key);
    if (osBuckets[0]) fixtures.osName = osBuckets[0].key;
  } catch (error) {
    notes.push(`findings-family discovery failed: ${error.message}`);
    familyCounts.findings = undefined;
  }

  // --- Vulnerabilities family (wazuh-states-vulnerabilities*): a real CVE. -----------------------
  try {
    const hit = await esSearch('wazuh-states-vulnerabilities*', {
      size: 1,
      query: { match_all: {} },
    });
    familyCounts.vulnerabilities = hit.hits.total.value;
    const source = hit.hits.hits[0] && hit.hits.hits[0]._source;
    if (source) {
      fixtures.cve = source.vulnerability && source.vulnerability.id;
    }
  } catch (error) {
    notes.push(`vulnerabilities-family discovery failed: ${error.message}`);
    familyCounts.vulnerabilities = undefined;
  }

  // --- SCA family (wazuh-states-sca*): a real policy id + the agent id that carries SCA data. ----
  try {
    const hit = await esSearch('wazuh-states-sca*', {
      size: 1,
      query: { match_all: {} },
    });
    familyCounts.sca = hit.hits.total.value;
    const source = hit.hits.hits[0] && hit.hits.hits[0]._source;
    if (source) {
      fixtures.scaPolicyId = source.policy && source.policy.id;
      fixtures.scaAgentId =
        source.wazuh && source.wazuh.agent && source.wazuh.agent.id;
    }
  } catch (error) {
    notes.push(`sca-family discovery failed: ${error.message}`);
    familyCounts.sca = undefined;
  }

  // --- Inventory families (one agent id each; typically the same "001" AIO pseudo-agent). --------
  for (const [key, index] of [
    ['inventorySystem', 'wazuh-states-inventory-system*'],
    ['inventoryPackages', 'wazuh-states-inventory-packages*'],
    ['inventoryPorts', 'wazuh-states-inventory-ports*'],
    ['inventoryProcesses', 'wazuh-states-inventory-processes*'],
  ]) {
    try {
      const hit = await esSearch(index, { size: 1, query: { match_all: {} } });
      familyCounts[key] = hit.hits.total.value;
      const source = hit.hits.hits[0] && hit.hits.hits[0]._source;
      if (
        source &&
        source.wazuh &&
        source.wazuh.agent &&
        source.wazuh.agent.id
      ) {
        fixtures[`${key}AgentId`] = source.wazuh.agent.id;
      }
    } catch (error) {
      notes.push(`${key} discovery failed: ${error.message}`);
      familyCounts[key] = undefined;
    }
  }
  // A single inventoryAgentId fixture: the seeder puts every inventory family on the same agent.
  // Falls back across families in case one inventory family is empty but another isn't.
  fixtures.inventoryAgentId =
    fixtures.inventorySystemAgentId ||
    fixtures.inventoryPackagesAgentId ||
    fixtures.inventoryPortsAgentId ||
    fixtures.inventoryProcessesAgentId;

  // --- FIM family (wazuh-states-fim-files*): just a broad count, get_fim_files needs no args. ----
  try {
    familyCounts.fim = await esCount('wazuh-states-fim-files*');
  } catch (error) {
    notes.push(`fim-family count failed: ${error.message}`);
    familyCounts.fim = undefined;
  }

  // --- Events family (wazuh-events-v5*): often empty on a fresh stack -- counted anyway
  // so the report shows the real number rather than assuming it.
  try {
    familyCounts.events = await esCount('wazuh-events-v5*');
  } catch (error) {
    notes.push(`events-family count failed: ${error.message}`);
    familyCounts.events = undefined;
  }

  // --- Manager agents (get_active_agents/get_disconnected_agents): total non-000 agents. ---------
  try {
    familyCounts.managerAgents = await managerGetAgentsExcludingManager();
  } catch (error) {
    notes.push(`manager agent count failed: ${error.message}`);
    familyCounts.managerAgents = undefined;
  }

  // Specifically for get_suspicious_powershell's 5.0 fix (the bug this whole harness exists to
  // catch): an extra, narrower live count of the OR-clause the tool actually queries, purely as a
  // diagnostic note -- classification below still uses the broad findings family count, per spec.
  try {
    familyCounts.powershellSignals = await esCount('wazuh-findings-v5*', {
      bool: {
        should: [
          { term: { 'rule.mitre.technique.id': 'T1059.001' } },
          { terms: { 'rule.tags': ['powershell', 'windows_powershell'] } },
          {
            terms: {
              'process.name': ['powershell.exe', 'pwsh.exe', 'powershell'],
            },
          },
        ],
        minimum_should_match: 1,
      },
    });
  } catch (error) {
    notes.push(`powershell-signal count failed: ${error.message}`);
  }

  return {
    fixtures,
    familyCounts,
    notes,
    indexerMode: indexerClient.getMode(),
    managerMode: managerClient.getMode(),
    modeSwitchNotes: [
      ...indexerClient.getAttempts(),
      ...managerClient.getAttempts(),
    ],
  };
}

module.exports = { discoverLiveFixtures, esCount, esSearch };
