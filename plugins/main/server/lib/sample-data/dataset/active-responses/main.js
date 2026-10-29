const random = require('../../lib/random');
const { generateRandomWazuh } = require('../../shared-utils');

const AGENTS_COUNT = 20;
const DAYS = 30;
const FINDINGS_INDEX = 'wazuh-findings-v5-sample';

// Responses a user can configure, each one with the executable it runs
const RESPONSES = [
  { name: 'Block source IP', executable: 'firewall-drop' },
  { name: 'Disable compromised account', executable: 'disable-account' },
  { name: 'Block host with iptables', executable: 'host-deny' },
  { name: 'Restart Wazuh agent', executable: 'restart-wazuh' },
  { name: 'Isolate endpoint', executable: 'netsh' },
];
const RULES = [
  { id: '5712', level: '10', description: 'sshd: brute force attempt' },
  {
    id: '5763',
    level: '10',
    description: 'sshd: brute force trying to get access',
  },
  {
    id: '31151',
    level: '10',
    description: 'Multiple web server 400 error codes',
  },
  { id: '40111', level: '12', description: 'Multiple authentication failures' },
  { id: '87105', level: '15', description: 'File matched a malware indicator' },
  { id: '100002', level: '7', description: 'Suspicious process spawned' },
];
// The location of a response is the agent that generated the finding in most
// of them, so the other values are the exception.
const LOCATIONS = ['local', 'local', 'local', 'local', 'all', 'defined-agent'];

/**
 * Generate an active response document, the one the indexer writes when an
 * alerting monitor triggers an active response channel.
 * @param {Object} params - parameters that may contain cluster information
 * @returns {Object} active response document
 */
function generateDocument(params) {
  const response = random.choice(RESPONSES);
  const rule = random.choice(RULES);
  const location = random.choice(LOCATIONS);
  const isStateful = random.int(1, 4) === 1;
  const agentNumber = random.int(1, AGENTS_COUNT);
  const agentId = String(agentNumber).padStart(3, '0');

  return {
    '@timestamp': random.date(DAYS),
    event: {
      doc_id: random.hash(),
      index: FINDINGS_INDEX,
    },
    wazuh: {
      ...generateRandomWazuh(params),
      cluster: {
        name: params?.cluster?.name || 'wazuh',
        node: params?.cluster?.node || 'node01',
      },
      active_response: {
        name: response.name,
        executable: response.executable,
        extra_arguments: random.choice([null, '-', '--timeout 600']),
        type: isStateful ? 'stateful' : 'stateless',
        ...(isStateful && { stateful_timeout: random.choice([60, 300, 600]) }),
        location,
        ...(location === 'defined-agent' && { agent_id: agentId }),
      },
      agent: {
        id: agentId,
        name: `wazuh-agent-${agentId}`,
        groups: [random.choice(['default', 'linux', 'web-servers'])],
        host: {
          hostname: `endpoint-${agentId}`,
          os: { name: random.choice(['Ubuntu', 'Amazon Linux 2', 'CentOS']) },
        },
      },
      rule: {
        id: rule.id,
        level: rule.level,
        description: rule.description,
      },
    },
  };
}

module.exports = {
  generateDocument,
};
