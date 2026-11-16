import {
  optionalParamsDefinitions,
  osCommandsDefinitions,
  tOptionalParameters,
} from './os-commands-definitions';
import { IOptionalParameters } from '../register-commands/types';
import { PLUGIN_MAJOR_VERSION } from '../../../../../../common/constants';

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
        optionals: {} as IOptionalParameters<tOptionalParameters>,
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
        // rpm -ihv runs only after the signature is present and verified.
        expect(command).toMatch(
          /&& rpm -K package && LC_ALL=C rpm -Kv package \| grep -q 'Signature, key ID \[0-9a-f\]\*: OK' && sudo rpm -ihv package$/,
        );
      }
      const aptSource = preRelease
        ? `https://packages-staging.xdrsiem.wazuh.info/pre-release/${PLUGIN_MAJOR_VERSION}.x/apt unstable`
        : `https://packages.wazuh.com/production/${PLUGIN_MAJOR_VERSION}.x/apt stable`;
      for (const command of [debAmd, debArm]) {
        expect(
          command.startsWith(
            `sudo wget -qO /usr/share/keyrings/wazuh.asc ${keyUrl} && sudo chmod 644 /usr/share/keyrings/wazuh.asc && wget https://example.com/package && `,
          ),
        ).toBe(true);
        expect(command).toContain(
          `echo "deb [signed-by=/usr/share/keyrings/wazuh.asc] ${aptSource} main"`,
        );
        // dpkg runs only after the package matches the SHA-256 of the verified index.
        expect(command).toMatch(
          /&& sudo apt-get update -qq -c \$d\/apt\.conf && .* \| sha256sum -c --quiet && sudo rm -rf \$d && sudo dpkg -i \.\/package$/,
        );
      }
    },
  );
});
