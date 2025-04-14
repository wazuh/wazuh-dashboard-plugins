import { EnrollAgentData } from '../interfaces/types';
import LinuxDarkIcon from '../assets/images/themes/dark/linux-icon.svg';
import LinuxLightIcon from '../assets/images/themes/light/linux-icon.svg';
import WindowsDarkIcon from '../assets/images/themes/dark/windows-icon.svg';
import WindowsLightIcon from '../assets/images/themes/light/windows-icon.svg';
import MacDarkIcon from '../assets/images/themes/dark/mac-icon.svg';
import MacLightIcon from '../assets/images/themes/light/mac-icon.svg';
import { getCore } from '../../../../plugin-services';

const darkMode = getCore()?.uiSettings?.get('theme:darkMode');

export const OPERATING_SYSTEMS_OPTIONS: EnrollAgentData[] = [
  {
    icon: darkMode ? LinuxDarkIcon : LinuxLightIcon,
    title: 'LINUX',
    hr: true,
    architecture: [
      {
        label: 'RPM amd64',
        value: 'linux_rpm_amd64',
      },
      {
        label: 'RPM aarch64',
        value: 'linux_rpm_arm64',
      },
      {
        label: 'DEB amd64',
        value: 'linux_deb_amd64',
      },
      {
        label: 'DEB aarch64',
        value: 'linux_deb_arm64',
      },
    ],
  },
  {
    icon: darkMode ? WindowsDarkIcon : WindowsLightIcon,
    title: 'WINDOWS',
    hr: true,
    architecture: [{ label: 'MSI 32/64 bits', value: 'windows' }],
  },
  {
    icon: darkMode ? MacDarkIcon : MacLightIcon,
    title: 'macOS',
    hr: true,
    architecture: [
      {
        label: 'Intel',
        value: 'macos_intel64',
      },
      {
        label: 'Apple silicon',
        value: 'macos_arm64',
      },
    ],
  },
];

export const SERVER_ADDRESS_TEXTS = [
  {
    title: 'Server address',
    subtitle:
      'This is the address the agent uses to communicate with the server. Enter an valid URL including the port, the address can be an IP address or a fully qualified domain name (FQDN).',
  },
];

export const OPTIONAL_PARAMETERS_TEXT = [
  {
    title: 'Optional settings',
    subtitle:
      'By default, the deployment uses the hostname as the agent name. Optionally, you can use a different agent name in the field below.',
  },
];
