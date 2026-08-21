const random = require('../../lib/random');
const {
  generateRandomWazuh,
  generateRandomState,
} = require('../../shared-utils');

// Locations a logcollector report usually carries
const LOCATIONS = [
  '/var/log/syslog',
  '/var/log/auth.log',
  '/var/log/dpkg.log',
  '/var/ossec/logs/active-responses.log',
  'df -P',
  'last -n 20',
];

// The index holds the latest report of each agent, so the agent id is assigned
// sequentially instead of randomly: this way every generated agent gets one
// document and the statistics of a specific agent are always present.
const AGENTS_COUNT = 100;
let generatedDocuments = 0;

/**
 * Generate the connection status the agent reports of itself. A report is
 * pushed by the agent, so it comes from a connected one most of the time and a
 * disconnected status is the exception of a stale report.
 * @returns {string} connection status
 */
function generateStatus() {
  return random.int(1, 10) === 1 ? 'disconnected' : 'connected';
}

/**
 * Generate the files of a logcollector window. The counters of a file and the
 * drops of its targets are independent values, so a file with events can have
 * drops and a file without events cannot.
 * @returns {Array<Object>} files of the window
 */
function generateFiles() {
  return random
    .sample(LOCATIONS, random.int(1, LOCATIONS.length))
    .map(location => {
      const events = random.int(0, 500);
      return {
        location,
        events,
        bytes: events * random.int(50, 150),
        targets: [
          {
            name: random.choice(['agent', 'server']),
            drops: events > 0 ? random.int(0, 5) : 0,
          },
        ],
      };
    });
}

/**
 * Generate a logcollector window. `interval` is the last closed window, so its
 * counters are a sample and not a series.
 * @param {number} secondsAgoStart - seconds before now the window starts
 * @param {number} secondsAgoEnd - seconds before now the window ends
 * @returns {Object} window with its range and files
 */
function generateWindow(secondsAgoStart, secondsAgoEnd) {
  return {
    start: new Date(Date.now() - secondsAgoStart * 1000).toISOString(),
    end: new Date(Date.now() - secondsAgoEnd * 1000).toISOString(),
    files: generateFiles(),
  };
}

/**
 * Generate a document of the agent statistics index. The server moves the
 * `modules` object the agent pushes under `wazuh.agent.statistics` without
 * transforming it, so the keys are module names and every field name is the one
 * the agent emits.
 * @param {Object} params - parameters that may contain cluster information
 * @returns {Object} agent statistics document
 */
function generateDocument(params) {
  const dispatched = random.int(0, 5000);

  return {
    state: generateRandomState(),
    wazuh: {
      ...generateRandomWazuh(params),
      agent: {
        id: String(generatedDocuments++ % AGENTS_COUNT).padStart(3, '0'),
        statistics: {
          agent: {
            status: generateStatus(),
            last_keepalive: new Date(
              Date.now() - random.int(0, 600) * 1000,
            ).toISOString(),
            messages: { count: random.int(0, 1000) },
            tasks: {
              dispatched: { total: dispatched },
              discarded_duplicate: { total: random.int(0, dispatched) },
              failed: { total: random.int(0, 10) },
            },
          },
          logcollector: {
            global: generateWindow(random.int(1800, 86400), 60),
            interval: generateWindow(120, 60),
          },
        },
      },
    },
  };
}

module.exports = {
  generateDocument,
};
