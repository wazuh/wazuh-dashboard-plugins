const random = require('../../lib/random');
const {
  generate_random_wazuh,
  generate_random_agent,
} = require('../shared-utils');

const default_count = '10000';
const default_index_name_prefix = 'wazuh-states-inventory-processes';
const default_index_name = `${default_index_name_prefix}-sample`;

function generate_random_process() {
  return {
    args: `arg${random.int(0, 9999)}`,
    command_line: `command${random.int(0, 9999)}`,
    name: `process${random.int(0, 9999)}`,
    parent: { pid: random.int(1, 9999) },
    pid: random.int(1, 9999),
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

function generate_document(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    '@timestamp': random.date(),
    agent: generate_random_agent(),
    process: generate_random_process(),
    wazuh: generate_random_wazuh(params),
  };
}

module.exports = {
  default_count,
  default_index_name,
  generate_document,
};
