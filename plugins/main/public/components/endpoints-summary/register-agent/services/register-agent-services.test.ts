import * as RegisterAgentService from './register-agent-services';
import { WzRequest } from '../../../../react-services/wz-request';
import { ServerAddressOptions } from './register-agent-services';

jest.mock('../../../../react-services', () => ({
  ...(jest.requireActual('../../../../react-services') as object),
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
      const res = await RegisterAgentService.getRemoteConfiguration(nodeName);
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
      WzRequest.apiReq = jest.fn().mockResolvedValueOnce(mockedResponse);
      const nodeName = 'example-node';
      const res = await RegisterAgentService.getRemoteConfiguration(nodeName);
      expect(res.name).toBe(nodeName);
      expect(res.haveSecureConnection).toBe(false);
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
    });
  });
});

describe('parseRegisterAgentFormValues', () => {
  const osOptions = [
    {
      icon: '',
      title: 'LINUX',
      hr: true,
      architecture: ['DEB amd64'],
    },
  ] as any;

  const formValues = [
    { name: 'operatingSystemSelection', value: 'DEB amd64' },
    { name: 'serverAddress', value: '1.1.1.1' },
    { name: 'serverPort', value: '' },
    { name: 'serverPath', value: '' },
    { name: 'agentName', value: 'agent1' },
    { name: 'agentGroups', value: [] },
  ] as any;

  /* The switch and the CA path are ordinary optional parameters, so they reach
  the command generator through the same passthrough as the other fields. */
  it('forwards the SSL verification switch as a boolean', () => {
    const result = RegisterAgentService.parseRegisterAgentFormValues(
      [...formValues, { name: 'sslVerification', value: false }],
      osOptions,
    );
    expect(result.optionalParams.sslVerification).toBe(false);
  });

  it('forwards the manager CA path', () => {
    const result = RegisterAgentService.parseRegisterAgentFormValues(
      [
        ...formValues,
        { name: 'sslVerification', value: true },
        { name: 'managerCa', value: '/var/ossec/etc/manager-ca.pem' },
      ],
      osOptions,
    );
    expect(result.optionalParams.sslVerification).toBe(true);
    expect(result.optionalParams.managerCa).toBe(
      '/var/ossec/etc/manager-ca.pem',
    );
  });
});

describe('parseRegisterAgentFormValues - CA and verification interaction', () => {
  const osOptions = [
    {
      icon: '',
      title: 'LINUX',
      hr: true,
      architecture: ['DEB amd64'],
    },
  ] as any;

  const baseValues = [
    { name: 'operatingSystemSelection', value: 'DEB amd64' },
    { name: 'serverAddress', value: '1.1.1.1' },
    { name: 'serverPort', value: '' },
    { name: 'serverPath', value: '' },
    { name: 'agentName', value: '' },
    { name: 'agentGroups', value: [] },
  ] as any;

  /* Otherwise turning the switch off after typing a path would emit both
  SSL_VERIFICATION='none' and the CA, a command that supplies a CA and then
  refuses to use it. */
  it('drops the CA when verification is disabled', () => {
    const result = RegisterAgentService.parseRegisterAgentFormValues(
      [
        ...baseValues,
        { name: 'sslVerification', value: false },
        { name: 'managerCa', value: '/var/ossec/etc/manager-ca.pem' },
      ],
      osOptions,
    );
    expect(result.optionalParams.managerCa).toBe('');
  });

  it('keeps the CA when verification is enabled', () => {
    const result = RegisterAgentService.parseRegisterAgentFormValues(
      [
        ...baseValues,
        { name: 'sslVerification', value: true },
        { name: 'managerCa', value: '/var/ossec/etc/manager-ca.pem' },
      ],
      osOptions,
    );
    expect(result.optionalParams.managerCa).toBe(
      '/var/ossec/etc/manager-ca.pem',
    );
  });
});
