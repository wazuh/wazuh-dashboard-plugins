const random = require('../../lib/random');

const default_count = '10000';
const default_index_name = 'wazuh-states-fim-files-sample';
const DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

function generate_random_date() {
  const start_date = new Date();
  const end_date = new Date(start_date);
  end_date.setDate(end_date.getDate() - 10);

  // Random date between start_date and end_date
  const random_date = new Date(
    end_date.getTime() +
      Math.random() * (start_date.getTime() - end_date.getTime()),
  );

  // Format date to match the Python format
  return random_date.toISOString();
}

function generate_random_agent() {
  return {
    id: String(random.int(0, 99)).padStart(3, '0'),
    name: `Agent${random.int(0, 99)}`,
    version: `v${random.int(0, 9)}-stable`,
    host: generate_random_host(),
  };
}

function generate_random_host() {
  return {
    architecture: random.choice(['x86_64', 'arm64']),
    ip: `${random.int(1, 255)}.${random.int(0, 255)}.${random.int(0, 255)}.${random.int(0, 255)}`,
  };
}

function generate_random_data_stream() {
  return {
    type: random.choice(['Scheduled', 'Realtime']),
  };
}

function generate_random_event() {
  return {
    category: random.choice(['registy_value', 'registry_key', 'file']),
    type: random.choice(['added', 'modified', 'deleted']),
  };
}

function generate_random_file() {
  return {
    gid: `gid${random.int(0, 1000)}`,
    group: `group${random.int(0, 1000)}`,
    hash: {
      md5: `${random.int(0, 9999)}`,
      sha1: `${random.int(0, 9999)}`,
      sha256: `${random.int(0, 9999)}`,
    },
    inode: `inode${random.int(0, 1000)}`,
    mtime: generate_random_date(),
    owner: `owner${random.int(0, 1000)}`,
    path: '/path/to/file',
    size: random.int(1000, 1000000),
    uid: `uid${random.int(0, 1000)}`,
  };
}

function generate_random_wazuh() {
  return {
    cluster: {
      name: `wazuh-cluster-${random.int(0, 10)}`,
      node: `wazuh-cluster-node-${random.int(0, 10)}`,
    },
    schema: { version: '1.7.0' },
  };
}

function generate_document(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    '@timestamp': generate_random_date(),
    agent: generate_random_agent(),
    data_stream: generate_random_data_stream(),
    event: generate_random_event(),
    file: generate_random_file(),
    wazuh: generate_random_wazuh(),
  };
}

module.exports = {
  default_count,
  default_index_name,
  generate_document,
};
