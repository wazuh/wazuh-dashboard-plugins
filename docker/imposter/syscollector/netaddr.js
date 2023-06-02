var data = {
  data: {
    affected_items: [
      {
        address: '172.26.0.7',
        iface: 'eth0',
        netmask: '255.255.0.0',
        broadcast: '172.26.255.255',
        proto: 'ipv4',
        agent_id: 1,
      },
      {
        address: 'FE80:0034:0223:A000:0002:B3FF:0000:8329',
        iface: 'eth0',
        netmask: 'FE80:0034:0223:A000:0002:B3FF:0000:8329',
        broadcast: 'FE80:0034:0223:A000:0002:B3FF:0000:8329',
        proto: 'ipv6',
        agent_id: 1,
      },
    ],
    total_affected_items: 1,
    total_failed_items: 0,
    failed_items: [],
  },
  message: 'All specified syscollector information was returned',
  error: 0,
};

respond().withStatusCode(200).withData(JSON.stringify(data));
