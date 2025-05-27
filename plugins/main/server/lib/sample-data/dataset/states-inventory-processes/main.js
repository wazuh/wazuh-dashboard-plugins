const random = require('../../lib/random');
const { generateRandomWazuh, generateRandomAgent } = require('../shared-utils');

function generateRandomProcess() {
  return {
    args: `arg${random.int(0, 9999)}`,
    args_count: random.int(0, 9999),
    command_line: `command${random.int(0, 9999)}`,
    name: `process${random.int(0, 9999)}`,
    parent: { pid: random.int(1, 9999) },
    pid: random.int(1, 9999),
    start: random.unixTimestamp(),
    state: random.choice([
      'Running',
      'Uninterruptible Sleep',
      'Interruptable Sleep',
      'Stopped',
      'Zombie',
    ]),
    stime: random.unixTimestamp(),
    utime: random.unixTimestamp(),
  };
}

function generateDocument(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    '@timestamp': random.date(),
    agent: generateRandomAgent(),
    process: generateRandomProcess(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
