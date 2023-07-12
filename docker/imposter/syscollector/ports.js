var agentID = context.request.pathParams.agent_id;

var ipv4_01 = {
  local: {
    ip: '0.0.0.0',
    port: 46841,
  },
  remote: {
    ip: '0.0.0.0',
    port: 0,
  },
  scan: {
    id: 0,
    time: '2021-05-28T11:16:14Z',
  },
  inode: 12387152,
  rx_queue: 0,
  protocol: 'tcp',
  pid: 0,
  tx_queue: 0,
  agent_id: agentID,
};

var ipv4_02 = {
  local: {
    ip: '0.0.0.0',
    port: 80,
  },
  remote: {
    ip: '0.0.0.0',
    port: 0,
  },
  scan: {
    id: 0,
    time: '2021-05-28T11:16:14Z',
  },
  inode: 12387152,
  rx_queue: 0,
  protocol: 'tcp',
  pid: 0,
  tx_queue: 0,
  agent_id: agentID,
};

var ipv4_03 = {
  local: {
    ip: '0.0.0.0',
    port: 443,
  },
  remote: {
    ip: '0.0.0.0',
    port: 0,
  },
  scan: {
    id: 0,
    time: '2021-05-28T11:16:14Z',
  },
  state: 'listening',
  inode: 12387152,
  rx_queue: 0,
  protocol: 'tcp',
  pid: 0,
  tx_queue: 0,
  agent_id: agentID,
};

var ipv6_01 = {
  local: {
    ip: 'FE80:0034:0223:A000:0002:B3FF:0000:8329',
    port: 1515,
  },
  remote: {
    ip: '0.0.0.0',
    port: 0,
  },
  scan: {
    id: 315935312,
    time: '2020-04-15T11:02:07Z',
  },
  state: 'listening',
  inode: 12397153,
  rx_queue: 0,
  protocol: 'tcp',
  tx_queue: 0,
  agent_id: agentID,
};

var ipv6_02 = {
  local: {
    ip: 'FE80:0034:0223:A000:0002:B3FF:0000:8329',
    port: 80,
  },
  remote: {
    ip: '0.0.0.0',
    port: 0,
  },
  scan: {
    id: 315935312,
    time: '2020-04-15T11:02:07Z',
  },
  state: 'listening',
  inode: 12397153,
  rx_queue: 0,
  protocol: 'tcp',
  tx_queue: 0,
  agent_id: agentID,
};

var ipv6_03 = {
  local: {
    ip: 'FE80:0034:0223:A000:0002:B3FF:0000:8329',
    port: 443,
  },
  remote: {
    ip: '0.0.0.0',
    port: 0,
  },
  scan: {
    id: 315935312,
    time: '2020-04-15T11:02:07Z',
  },
  state: 'listening',
  inode: 12397153,
  rx_queue: 0,
  protocol: 'tcp',
  tx_queue: 0,
  agent_id: agentID,
};

var affected_items_agents = {
  '001': [
    ipv4_01,
    ipv6_01,
    ipv4_03,
    ipv4_01,
    ipv6_01,
    ipv4_03,
    ipv4_01,
    ipv6_01,
    ipv4_03,
    ipv4_01,
    ipv6_01,
    ipv4_03,
    ipv4_01,
    ipv6_01,
    ipv4_03,
    ipv4_01,
    ipv6_01,
    ipv4_03,
    ipv4_01,
    ipv6_01,
    ipv4_03,
    ipv4_01,
    ipv6_01,
    ipv4_03,
    ipv4_01,
    ipv6_01,
    ipv4_03,
    ipv4_01,
    ipv6_01,
    ipv4_03,
    ipv4_01,
    ipv4_02,
    ipv4_03,
  ],
  '002': [ipv4_01, ipv4_02, ipv4_03],
  '003': [ipv6_01, ipv6_02, ipv6_03],
};

var affected_items =
  affected_items_agents[agentID] || affected_items_agents['001'];
var total_affected_items = affected_items.length;

var limit = context.request.queryParams.limit;
var offset = context.request.queryParams.offset;

if (offset || limit) {
  affected_items = affected_items.slice(offset, offset + limit);
}

var response = {
  data: {
    affected_items: affected_items,
    total_affected_items: total_affected_items,
    total_failed_items: 0,
    failed_items: [],
  },
  message: 'All specified syscollector information was returned',
  error: 0,
};

respond().withStatusCode(200).withData(JSON.stringify(response));
