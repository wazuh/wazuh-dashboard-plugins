import { optionalParamsDefinitions } from './os-commands-definitions';

jest.mock('../../../../../kibana-services', () => ({
  getWazuhStage: () => '',
  isWazuhPreRelease: () => false,
}));

const linux = { name: 'LINUX', architecture: 'DEB amd64' };
const windows = { name: 'WINDOWS', architecture: 'MSI 32/64 bits' };
const macos = { name: 'macOS', architecture: 'Intel' };

describe('optionalParamsDefinitions - sslVerification', () => {
  /* The agent verifies by default, so the enabled state has nothing to add to
  the command. Only the deliberate opt-out is spelled out. */
  it.each([linux, windows, macos])(
    'renders nothing when verification is enabled (%p)',
    selectedOS => {
      const result = optionalParamsDefinitions.sslVerification.getParamCommand(
        {
          name: 'sslVerification',
          property: 'SSL_VERIFICATION',
          value: true,
        },
        selectedOS,
      );
      expect(result).toBe('');
    },
  );

  it.each([linux, windows, macos])(
    'renders the opt-out when verification is disabled (%p)',
    selectedOS => {
      const result = optionalParamsDefinitions.sslVerification.getParamCommand(
        {
          name: 'sslVerification',
          property: 'SSL_VERIFICATION',
          value: false,
        },
        selectedOS,
      );
      expect(result).toBe("SSL_VERIFICATION='none'");
    },
  );
});

describe('optionalParamsDefinitions - managerCa', () => {
  it('renders the CA path when one is given', () => {
    const result = optionalParamsDefinitions.managerCa.getParamCommand(
      {
        name: 'managerCa',
        property: 'WAZUH_REGISTRATION_CA',
        value: '/var/ossec/etc/manager-ca.pem',
      },
      linux,
    );
    expect(result).toBe(
      "WAZUH_REGISTRATION_CA='/var/ossec/etc/manager-ca.pem'",
    );
  });

  it('keeps a path containing spaces intact', () => {
    const result = optionalParamsDefinitions.managerCa.getParamCommand(
      {
        name: 'managerCa',
        property: 'WAZUH_REGISTRATION_CA',
        value: 'C:\\Program Files\\ossec-agent\\manager-ca.pem',
      },
      windows,
    );
    expect(result).toBe(
      "WAZUH_REGISTRATION_CA='C:\\Program Files\\ossec-agent\\manager-ca.pem'",
    );
  });

  it('trims surrounding whitespace', () => {
    const result = optionalParamsDefinitions.managerCa.getParamCommand(
      {
        name: 'managerCa',
        property: 'WAZUH_REGISTRATION_CA',
        value: '  /var/ossec/etc/manager-ca.pem  ',
      },
      linux,
    );
    expect(result).toBe(
      "WAZUH_REGISTRATION_CA='/var/ossec/etc/manager-ca.pem'",
    );
  });

  it.each(['', '   '])('renders nothing for %p', value => {
    const result = optionalParamsDefinitions.managerCa.getParamCommand(
      {
        name: 'managerCa',
        property: 'WAZUH_REGISTRATION_CA',
        value,
      },
      linux,
    );
    expect(result).toBe('');
  });
});
