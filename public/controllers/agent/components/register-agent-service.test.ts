import { getRemoteConfiguration } from './register-agent-service';
import { WzRequest } from '../../../react-services/wz-request';

jest.mock('../../../react-services', () => ({
  WzRequest: () => ({
    apiReq: jest.fn(),
  }),
}));

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
      WzRequest.apiReq = jest.fn().mockResolvedValueOnce(mockedResponse);
      const nodeName = 'example-node';
      const res = await getRemoteConfiguration('example-node');
      expect(res.name).toBe(nodeName);
      expect(res.haveConnectionSecure).toBe(true);
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
      WzRequest.apiReq = jest.fn().mockResolvedValueOnce(mockedResponse);
      const nodeName = 'example-node';
      const res = await getRemoteConfiguration('example-node');
      expect(res.name).toBe(nodeName);
      expect(res.haveConnectionSecure).toBe(false);
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
        WzRequest.apiReq = jest.fn().mockResolvedValueOnce(mockedResponse);
        const nodeName = 'example-node';
        const res = await getRemoteConfiguration('example-node');
        expect(res.name).toBe(nodeName);
        expect(res.protocols).toEqual(['UDP']);
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
        WzRequest.apiReq = jest.fn().mockResolvedValueOnce(mockedResponse);
        const nodeName = 'example-node';
        const res = await getRemoteConfiguration('example-node');
        expect(res.name).toBe(nodeName);
        expect(res.protocols).toEqual(['TCP']);
      });

      it('should return protocols TCP and UDP when is the only connection protocol available', async () => {
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
        WzRequest.apiReq = jest.fn().mockResolvedValueOnce(mockedResponse);
        const nodeName = 'example-node';
        const res = await getRemoteConfiguration('example-node');
        expect(res.name).toBe(nodeName);
        expect(res.protocols).toEqual(['TCP','UDP']);
      });
  });
});
