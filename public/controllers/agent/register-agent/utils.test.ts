import { parseNodeIPs } from './utils';

const mockedSelectedNodesIps = [
  {
    label: 'master-node',
    value: 'wazuh-master',
  },
  {
    name: 'worker1',
    value: '172.26.0.7',
  },
  {
    name: 'worker2',
    value: '172.26.0.6',
  },
];

describe('Register agents utils', () => {
  describe('parseNodeIPs method', () => {
    it('should return a string with the IPs separated by commas when OS is WINDOWS', () => {
      const result = parseNodeIPs(mockedSelectedNodesIps, 'win');
      expect(result).toEqual('wazuh-master;172.26.0.7;172.26.0.6');
    });

    it('should return a string with the IPs separated by commas when OS is AIX', () => {
      const result = parseNodeIPs(mockedSelectedNodesIps, 'aix');
      expect(result).toEqual('wazuh-master,172.26.0.7,172.26.0.6');
    });

    it('should return a string with the IPs separated by commas when OS is AMAZON LINUX', () => {
        const result = parseNodeIPs(mockedSelectedNodesIps, 'amazonlinux');
        expect(result).toEqual('wazuh-master,172.26.0.7,172.26.0.6');
    });

    it('should return a string with the IPs separated by commas when OS is macOS', () => {
        const result = parseNodeIPs(mockedSelectedNodesIps, 'macos');
        expect(result).toEqual('wazuh-master,172.26.0.7,172.26.0.6');
    });

    it('should return a string with the IPs separated by commas when OS is NOT WINDOWS', () => {
        const result = parseNodeIPs(mockedSelectedNodesIps, ''); // by default is not linux
        expect(result).toEqual('wazuh-master,172.26.0.7,172.26.0.6');
    });

    it('should return one an only value without delimiter when the selected options its only one', () => {
        const result = parseNodeIPs(mockedSelectedNodesIps.slice(0,1), 'aix');
        expect(result).toEqual('wazuh-master');
    })
  });
});
