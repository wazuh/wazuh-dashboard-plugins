import { Agent } from '../../public/components/endpoints-summary/types';
import { DeepPartialRecordMock } from '../types';

export const AGENT = {
  DEBIAN: {
    os: {
      arch: 'x86_64',
      major: '9',
      name: 'Debian GNU/Linux',
      platform: 'debian',
      uname:
        'Linux |ip-10-0-1-106 |4.9.0-9-amd64 |#1 SMP Debian 4.9.168-1+deb9u2 (2019-05-13) |x86_64',
      version: '9',
    },
    group: ['default', 'debian'],
    ip: 'FE80:1234:2223:A000:2202:B3FF:FE1E:8329',
    id: '001',
    registerIP: 'FE80:1234:2223:A000:2202:B3FF:FE1E:8329',
    dateAdd: new Date('2022-08-25T16:17:46Z'),
    name: 'Debian agent',
    status: 'active',
    manager: 'wazuh-manager-master-0',
    node_name: 'master',
    lastKeepAlive: new Date('9999-12-31T23:59:59Z'),
    version: 'Wazuh v4.5.0',
    group_config_status: 'not synced',
    status_code: 0,
  },
  WINDOWS: {
    os: {
      major: '10',
      minor: '0',
      name: 'Microsoft Windows 10 Home Single Language',
      platform: 'windows',
      uname: 'Microsoft Windows 10 Home Single Language',
      version: '10.0.19045',
    },
    manager: 'test.com',
    status: 'active',
    name: 'Windows-agent',
    dateAdd: new Date('1970-01-01T00:00:00Z'),
    group: ['default', 'windows'],
    lastKeepAlive: new Date('2023-03-14T04:20:51Z'),
    node_name: 'node01',
    registerIP: 'any',
    id: '003',
    version: 'Wazuh v4.3.10',
    ip: '111.111.1.111',
    mergedSum: 'e669d89eba52f6897060fc65a45300ac',
    configSum: '97fccbb67e250b7c80aadc8d0dc59abe',
    group_config_status: 'not synced',
    status_code: 1,
  },
  DARWIN: {
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
    id: '004',
    group: ['default', 'darwin'],
    registerIP: '127.0.0.1',
    dateAdd: new Date('2022-08-25T16:17:46Z'),
    name: 'macOS High Sierra agent',
    status: 'active',
    manager: 'wazuh-manager-master-0',
    node_name: 'master',
    lastKeepAlive: new Date('9999-12-31T23:59:59Z'),
    version: 'Wazuh v4.5.0',
    group_config_status: 'synced',
    status_code: 3,
  },
} satisfies Record<string, DeepPartialRecordMock<Agent>>;