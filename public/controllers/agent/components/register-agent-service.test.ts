import * as RegisterAgentService from './register-agent-service';
import { WzRequest } from '../../../react-services/wz-request';
import { ServerAddressOptions } from '../register-agent/steps';

jest.mock('../../../react-services', () => ({
  ...(jest.requireActual('../../../react-services') as object),
  WzRequest: () => ({
    apiReq: jest.fn(),
  }),
}));

const mockedResponseClusterStatus = {
  data: {
    data: {
      enabled: 'yes',
      running: 'yes',
    },
    error: 0,
  },
};

describe('Register agent service', () => {
  beforeEach(() => jest.clearAllMocks());
  describe('getRemoteConfiguration', () => {
    it('should return secure connection = TRUE when have connection secure', async () => {
      const remoteWithSecureAndNoSecure = [
        {
          connection: 'syslog',
          ipv6: 'no',
          protocol: ['UDP'],
          port: '514',
          'allowed-ips': ['0.0.0.0/0'],
        },
        {
          connection: 'secure',
          ipv6: 'no',
          protocol: ['UDP'],
          port: '1514',
          queue_size: '131072',
        },
      ];
      const mockedResponse = {
        data: {
          data: {
            affected_items: [
              {
                remote: remoteWithSecureAndNoSecure,
              },
            ],
          },
        },
      };

      WzRequest.apiReq = jest
        .fn()
        .mockResolvedValueOnce(mockedResponseClusterStatus)
        .mockResolvedValueOnce(mockedResponse);
      const nodeName = 'example-node';
      const res = await RegisterAgentService.getRemoteConfiguration(
        'example-node',
      );
      expect(res.name).toBe(nodeName);
      expect(res.haveSecureConnection).toBe(true);
    });

    it('should return secure connection = FALSE available when dont have connection secure', async () => {
      const remoteWithSecureAndNoSecure = [
        {
          connection: 'syslog',
          ipv6: 'no',
          protocol: ['UDP', 'TCP'],
          port: '514',
          'allowed-ips': ['0.0.0.0/0'],
        },
      ];
      const mockedResponse = {
        data: {
          data: {
            affected_items: [
              {
                remote: remoteWithSecureAndNoSecure,
              },
            ],
          },
        },
      };
      WzRequest.apiReq = jest
        .fn()
        .mockResolvedValueOnce(mockedResponseClusterStatus)
        .mockResolvedValueOnce(mockedResponse);
      const nodeName = 'example-node';
      const res = await RegisterAgentService.getRemoteConfiguration(
        'example-node',
      );
      expect(res.name).toBe(nodeName);
      expect(res.haveSecureConnection).toBe(false);
    });

    it('should return protocols UDP when is the only connection protocol available', async () => {
      const remoteWithSecureAndNoSecure = [
        {
          connection: 'syslog',
          ipv6: 'no',
          protocol: ['UDP'],
          port: '514',
          'allowed-ips': ['0.0.0.0/0'],
        },
        {
          connection: 'secure',
          ipv6: 'no',
          protocol: ['UDP'],
          port: '1514',
          queue_size: '131072',
        },
      ];
      const mockedResponse = {
        data: {
          data: {
            affected_items: [
              {
                remote: remoteWithSecureAndNoSecure,
              },
            ],
          },
        },
      };
      WzRequest.apiReq = jest
        .fn()
        .mockResolvedValueOnce(mockedResponseClusterStatus)
        .mockResolvedValueOnce(mockedResponse);
      const nodeName = 'example-node';
      const res = await RegisterAgentService.getRemoteConfiguration(
        'example-node',
      );
      expect(res.name).toBe(nodeName);
      expect(res.isUdp).toEqual(true);
    });

    it('should return protocols TCP when is the only connection protocol available', async () => {
      const remoteWithSecureAndNoSecure = [
        {
          connection: 'syslog',
          ipv6: 'no',
          protocol: ['TCP'],
          port: '514',
          'allowed-ips': ['0.0.0.0/0'],
        },
        {
          connection: 'secure',
          ipv6: 'no',
          protocol: ['TCP'],
          port: '1514',
          queue_size: '131072',
        },
      ];
      const mockedResponse = {
        data: {
          data: {
            affected_items: [
              {
                remote: remoteWithSecureAndNoSecure,
              },
            ],
          },
        },
      };
      WzRequest.apiReq = jest
        .fn()
        .mockResolvedValueOnce(mockedResponseClusterStatus)
        .mockResolvedValueOnce(mockedResponse);
      const nodeName = 'example-node';
      const res = await RegisterAgentService.getRemoteConfiguration(
        'example-node',
      );
      expect(res.name).toBe(nodeName);
      expect(res.isUdp).toEqual(false);
    });

    it('should return is not UDP when have UDP and TCP protocols available', async () => {
      const remoteWithSecureAndNoSecure = [
        {
          connection: 'syslog',
          ipv6: 'no',
          protocol: ['TCP'],
          port: '514',
          'allowed-ips': ['0.0.0.0/0'],
        },
        {
          connection: 'secure',
          ipv6: 'no',
          protocol: ['UDP'],
          port: '1514',
          queue_size: '131072',
        },
      ];
      const mockedResponse = {
        data: {
          data: {
            affected_items: [
              {
                remote: remoteWithSecureAndNoSecure,
              },
            ],
          },
        },
      };
      WzRequest.apiReq = jest
        .fn()
        .mockResolvedValueOnce(mockedResponseClusterStatus)
        .mockResolvedValueOnce(mockedResponse);
      const nodeName = 'example-node';
      const res = await RegisterAgentService.getRemoteConfiguration(
        'example-node',
      );
      expect(res.name).toBe(nodeName);
      expect(res.isUdp).toEqual(false);
    });
  });

  describe('getConnectionConfig', () => {
    beforeAll(() => {
      jest.clearAllMocks();
    });

    it('should return IS NOT UDP when the server address is typed manually (custom)', async () => {
      const nodeSelected: ServerAddressOptions = {
        label: 'node-selected',
        value: 'node-selected',
        nodetype: 'master',
      };

      const remoteWithSecureAndNoSecure = [
        {
          connection: 'syslog',
          ipv6: 'no',
          protocol: ['UDP'],
          port: '514',
          'allowed-ips': ['0.0.0.0/0'],
        },
        {
          connection: 'secure',
          ipv6: 'no',
          protocol: ['UDP'],
          port: '1514',
          queue_size: '131072',
        },
      ];
      const mockedResponse = {
        data: {
          data: {
            affected_items: [
              {
                remote: remoteWithSecureAndNoSecure,
              },
            ],
          },
        },
      };
      WzRequest.apiReq = jest.fn().mockResolvedValueOnce(mockedResponse);

      const config = await RegisterAgentService.getConnectionConfig(
        nodeSelected,
        'default-dns-address',
      );
      expect(config.udpProtocol).toEqual(false);
      expect(config.serverAddress).toBe('default-dns-address');
    });

    it('should return IS NOT UDP when the server address is received like default server address dns (custom)', async () => {
      const nodeSelected: ServerAddressOptions = {
        label: 'node-selected',
        value: 'node-selected',
        nodetype: 'master',
      };

      const remoteWithSecureAndNoSecure = [
        {
          connection: 'syslog',
          ipv6: 'no',
          protocol: ['UDP'],
          port: '514',
          'allowed-ips': ['0.0.0.0/0'],
        },
        {
          connection: 'secure',
          ipv6: 'no',
          protocol: ['UDP'],
          port: '1514',
          queue_size: '131072',
        },
      ];
      const mockedResponse = {
        data: {
          data: {
            affected_items: [
              {
                remote: remoteWithSecureAndNoSecure,
              },
            ],
          },
        },
      };
      WzRequest.apiReq = jest.fn().mockResolvedValueOnce(mockedResponse);

      const config = await RegisterAgentService.getConnectionConfig(
        nodeSelected,
        'custom-server-address',
      );
      expect(config.udpProtocol).toEqual(false);
    });
  });
});
