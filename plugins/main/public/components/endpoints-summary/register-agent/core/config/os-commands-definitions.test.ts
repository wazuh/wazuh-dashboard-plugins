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
          property: 'WAZUH_SSL_VERIFICATION',
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
          property: 'WAZUH_SSL_VERIFICATION',
          value: false,
        },
        selectedOS,
      );
      expect(result).toBe("WAZUH_SSL_VERIFICATION='none'");
    },
  );
});

/* The 5.0 installer refuses WAZUH_REGISTRATION_CA as a removed variable. */
it('defines no CA variable for any operating system', () => {
  const properties = Object.values(optionalParamsDefinitions).map(
    ({ property }) => property,
  );
  expect(properties).not.toContain('WAZUH_REGISTRATION_CA');
});
