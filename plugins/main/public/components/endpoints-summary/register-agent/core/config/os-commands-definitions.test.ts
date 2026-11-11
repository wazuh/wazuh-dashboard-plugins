import {
  optionalParamsDefinitions,
  osCommandsDefinitions,
} from './os-commands-definitions';

let mockPreRelease = false;
jest.mock('../../../../../kibana-services', () => ({
  getWazuhStage: () => '',
  isWazuhPreRelease: () => mockPreRelease,
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

describe('Linux install commands - GPG key', () => {
  const linuxOptions = osCommandsDefinitions.find(
    ({ name }) => name === 'LINUX',
  )!.options;
  const getCommands = () =>
    linuxOptions.map(option =>
      option.installCommand({
        name: 'LINUX',
        architecture: option.architecture,
        wazuhVersion: '5.0.0',
        urlPackage: 'https://example.com/package',
        packageName: 'package',
        optionals: {},
      }),
    );

  afterEach(() => {
    mockPreRelease = false;
  });

  it.each([
    [false, 'https://packages.wazuh.com/key/GPG-KEY-WAZUH'],
    [true, 'https://packages-staging.xdrsiem.wazuh.info/key/GPG-KEY-WAZUH'],
  ])(
    'imports the key of the build first (pre-release: %p)',
    (preRelease, keyUrl) => {
      mockPreRelease = preRelease;
      const [debAmd, rpmAmd, debArm, rpmArm] = getCommands();
      for (const command of [rpmAmd, rpmArm]) {
        expect(command.startsWith(`sudo rpm --import ${keyUrl} && curl`)).toBe(
          true,
        );
      }
      for (const command of [debAmd, debArm]) {
        expect(command.startsWith(`wget -qO - ${keyUrl} | sudo gpg`)).toBe(
          true,
        );
        expect(command).toContain(
          'sudo chmod 644 /usr/share/keyrings/wazuh.gpg && wget https://example.com/package',
        );
        // dpkg runs only after the embedded signature is checked.
        expect(command).toMatch(
          /&& \(f=\$PWD\/package && .* && gpgv --keyring \/usr\/share\/keyrings\/wazuh\.gpg -o signed _gpgbuilder && .* && sha1sum -c --quiet sums && rm -rf "\$PWD"\) && sudo dpkg -i \.\/package$/,
        );
      }
    },
  );
});
