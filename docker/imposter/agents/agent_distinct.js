if (!String.prototype.includes) {
  String.prototype.includes = function (search, start) {
    'use strict';

    if (search instanceof RegExp) {
      throw TypeError('first argument must not be a RegExp');
    }
    if (start === undefined) {
      start = 0;
    }
    return this.indexOf(search, start) !== -1;
  };
}

var fields = context.request.queryParams.fields;

/* Based on agents.json */
var originalResponse = {
  data: {
    affected_items: [
      {
        os: {
          arch: 'x86_64',
          major: '2',
          name: 'Amazon Linux',
          platform: 'amzn',
          uname:
            'Linux |wazuh-manager-master-0 |4.14.114-105.126.amzn2.x86_64 |#1 SMP Tue May 7 02:26:40 UTC 2019 |x86_64',
          version: '2',
        },
        group: [
          'default',
          'test',
          'test2',
          'test3',
          'test4',
          'test5',
          'test6',
          'test7',
          'test8',
          'test9',
          'test10',
        ],
        ip: 'FE80:0034:0223:A000:0002:B3FF:0000:8329',
        id: '000',
        registerIP: 'FE80:0034:0223:A000:0002:B3FF:0000:8329',
        dateAdd: '2022-08-25T16:17:46Z',
        name: 'wazuh-manager-master-0',
        status: 'active',
        manager: 'wazuh-manager-master-0',
        node_name: 'master',
        lastKeepAlive: '9999-12-31T23:59:59Z',
        version: 'Wazuh v4.4.0',
        group_config_status: 'synced',
        status_code: 0,
        count: 1,
      },
      {
        os: {
          arch: 'x86_64',
          major: '2',
          name: 'Amazon Linux',
          platform: 'amzn',
          uname:
            'Linux |wazuh-manager-master-0 |4.14.114-105.126.amzn2.x86_64 |#1 SMP Tue May 7 02:26:40 UTC 2019 |x86_64',
          version: '2',
        },
        group: ['default', 'test', 'test2', 'test3', 'test4', 'test5'],
        ip: 'FE80:1234:2223:A000:2202:B3FF:FE1E:8329',
        id: '001',
        registerIP: 'FE80:1234:2223:A000:2202:B3FF:FE1E:8329',
        dateAdd: '2022-08-25T16:17:46Z',
        name: 'wazuh-manager-master-0',
        status: 'active',
        manager: 'wazuh-manager-master-0',
        node_name: 'master',
        lastKeepAlive: '9999-12-31T23:59:59Z',
        version: 'Wazuh v4.4.0',
        group_config_status: 'not synced',
        status_code: 0,
        count: 1,
      },
      {
        os: {
          arch: 'x86_64',
          major: '2',
          name: 'Amazon Linux',
          platform: 'amzn',
          uname:
            'Linux |wazuh-manager-master-0 |4.14.114-105.126.amzn2.x86_64 |#1 SMP Tue May 7 02:26:40 UTC 2019 |x86_64',
          version: '2',
        },
        group: ['default', 'test', 'test2'],
        ip: '127.0.0.1',
        id: '002',
        registerIP: '127.0.0.1',
        dateAdd: '2022-08-25T16:17:46Z',
        name: 'wazuh-manager-master-0',
        status: 'active',
        manager: 'wazuh-manager-master-0',
        node_name: 'master',
        lastKeepAlive: '9999-12-31T23:59:59Z',
        version: 'Wazuh v4.5.0',
        group_config_status: 'synced',
        status_code: 0,
        count: 1,
      },
      {
        os: {
          build: '19045',
          major: '10',
          minor: '0',
          name: 'Microsoft Windows 10 Home Single Language',
          platform: 'windows',
          uname: 'Microsoft Windows 10 Home Single Language',
          version: '10.0.19045',
        },
        disconnection_time: '2023-03-14T04:37:42Z',
        manager: 'test.com',
        status: 'disconnected',
        name: 'disconnected-agent',
        dateAdd: '1970-01-01T00:00:00Z',
        group: ['default', 'test'],
        lastKeepAlive: '2023-03-14T04:20:51Z',
        node_name: 'node01',
        registerIP: 'any',
        id: '003',
        version: 'Wazuh v4.3.10',
        ip: '111.111.1.111',
        mergedSum: 'e669d89eba52f6897060fc65a45300ac',
        configSum: '97fccbb67e250b7c80aadc8d0dc59abe',
        group_config_status: 'not synced',
        status_code: 1,
        count: 1,
      },
      {
        status: 'never_connected',
        name: 'never_connected_agent',
        dateAdd: '2023-03-14T09:44:11Z',
        node_name: 'unknown',
        registerIP: 'any',
        id: '004',
        ip: 'any',
        group_config_status: 'not synced',
        status_code: 4,
        count: 1,
      },
      {
        os: {
          arch: 'x86_64',
          major: '2',
          name: 'macOS High Sierra',
          platform: 'darwin',
          uname:
            'macOS High Sierra |wazuh-manager-master-0 |4.14.114-105.126.amzn2.x86_64 |#1 SMP Tue May 7 02:26:40 UTC 2019 |x86_64',
          version: '2',
        },
        ip: '127.0.0.1',
        id: '005',
        group: ['default'],
        registerIP: '127.0.0.1',
        dateAdd: '2022-08-25T16:17:46Z',
        name: 'macOS High Sierra agent',
        status: 'disconnected',
        manager: 'wazuh-manager-master-0',
        node_name: 'master',
        lastKeepAlive: '9999-12-31T23:59:59Z',
        version: 'Wazuh v4.5.0',
        group_config_status: 'synced',
        status_code: 2,
        count: 1,
      },
      {
        os: {
          name: 'Ubuntu',
          platform: 'ubuntu',
          uname:
            'Linux |f288f4c59dbc |5.19.0-35-generic |#36~22.04.1-Ubuntu SMP PREEMPT_DYNAMIC Fri Feb 17 15:17:25 UTC 2 |x86_64',
          version: '18.04.6 LTS',
        },
        group_config_status: 'not synced',
        status_code: 0,
        ip: '172.19.0.27',
        status: 'pending',
        name: 'Pending agent',
        group: ['default'],
        node_name: 'master-node',
        version: 'Wazuh v4.4.0',
        lastKeepAlive: '2023-03-16T15:15:05+00:00',
        id: '006',
        dateAdd: '2023-03-16T15:14:47+00:00',
        count: 1,
      },
      {
        status: 'never_connected',
        name: 'never_connected_agent-2',
        dateAdd: '2023-03-14T09:44:11Z',
        node_name: 'unknown',
        registerIP: 'any',
        id: '007',
        ip: 'any',
        group_config_status: 'not synced',
        status_code: 5,
        count: 1,
      },
      {
        status: 'never_connected',
        name: 'never_connected_agent-3',
        dateAdd: '2023-03-14T09:44:11Z',
        node_name: 'unknown',
        registerIP: 'any',
        id: '008',
        ip: 'any',
        group_config_status: 'not synced',
        status_code: 1,
        count: 1,
      },
      {
        status: 'never_connected',
        name: 'never_connected_agent-4',
        dateAdd: '2023-03-14T09:44:11Z',
        node_name: 'unknown',
        registerIP: 'any',
        id: '009',
        ip: 'any',
        group_config_status: 'not synced',
        status_code: 2,
        count: 1,
      },
      {
        os: {
          build: '19045',
          major: '10',
          minor: '0',
          name: 'Microsoft Windows 10 Home Single Language',
          platform: 'windows',
          uname: 'Microsoft Windows 10 Home Single Language',
          version: '10.0.19045',
        },
        disconnection_time: '2023-03-14T04:37:42Z',
        manager: 'test.com',
        status: 'disconnected',
        name: 'disconnected-agent-2',
        dateAdd: '1970-01-01T00:00:00Z',
        group: ['default', 'test'],
        lastKeepAlive: '2023-03-14T04:20:51Z',
        node_name: 'node01',
        registerIP: 'any',
        id: '010',
        version: 'Wazuh v4.3.10',
        ip: '111.111.1.111',
        mergedSum: 'e669d89eba52f6897060fc65a45300ac',
        configSum: '97fccbb67e250b7c80aadc8d0dc59abe',
        group_config_status: 'not synced',
        count: 1,
      },
    ],
    total_affected_items: 5,
    total_failed_items: 0,
    failed_items: [],
  },
  message: 'All selected agents information was returned',
  error: 0,
};

var selectedFields = fields.split(',');

var combinationsCount = {};

originalResponse.data.affected_items.forEach(function (agent) {
  var combinationKey = selectedFields
    .map(function (field) {
      if (field.includes('.')) {
        var subfields = field.split('.');
        return agent[subfields[0]] !== undefined
          ? agent[subfields[0]][subfields[1]]
          : 'unknown';
      }
      return agent[field];
    })
    .join(',');

  if (!combinationsCount[combinationKey]) {
    combinationsCount[combinationKey] = { count: 0 };
    selectedFields.forEach(function (field) {
      if (field.includes('.')) {
        var subfields = field.split('.');
        if (!combinationsCount[combinationKey][subfields[0]]) {
          combinationsCount[combinationKey][subfields[0]] = {};
        }
        combinationsCount[combinationKey][subfields[0]][subfields[1]] =
          agent[subfields[0]] && agent[subfields[0]][subfields[1]]
            ? agent[subfields[0]][subfields[1]]
            : 'unknown';
      } else {
        combinationsCount[combinationKey][field] = agent[field];
      }
    });
  }
  combinationsCount[combinationKey].count += agent.count;
});

var transformedResponse = {
  data: {
    affected_items: [],
    total_affected_items: 0,
    total_failed_items: 0,
    failed_items: [],
  },
  message: 'All selected agents information was returned',
  error: 0,
};

for (var key in combinationsCount) {
  if (combinationsCount.hasOwnProperty(key)) {
    transformedResponse.data.affected_items.push(combinationsCount[key]);
  }
}

transformedResponse.data.total_affected_items =
  transformedResponse.data.affected_items.length;

respond().withStatusCode(200).withData(JSON.stringify(transformedResponse));
