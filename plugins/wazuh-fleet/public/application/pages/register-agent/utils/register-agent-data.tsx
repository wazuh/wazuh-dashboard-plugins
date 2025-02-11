import { RegisterAgentData } from '../interfaces/types';
import LinuxDarkIcon from '../assets/images/themes/dark/linux-icon.svg';
import LinuxLightIcon from '../assets/images/themes/light/linux-icon.svg';
import WindowsDarkIcon from '../assets/images/themes/dark/windows-icon.svg';
import WindowsLightIcon from '../assets/images/themes/light/windows-icon.svg';
import MacDarkIcon from '../assets/images/themes/dark/mac-icon.svg';
import MacLightIcon from '../assets/images/themes/light/mac-icon.svg';
import { getCore } from '../../../../plugin-services';

const darkMode = getCore()?.uiSettings?.get('theme:darkMode');

export const OPERATING_SYSTEMS_OPTIONS: RegisterAgentData[] = [
  {
    icon: darkMode ? LinuxDarkIcon : LinuxLightIcon,
    title: 'LINUX',
    hr: true,
    architecture: ['RPM amd64', 'RPM aarch64', 'DEB amd64', 'DEB aarch64'],
  },
  {
    icon: darkMode ? WindowsDarkIcon : WindowsLightIcon,
    title: 'WINDOWS',
    hr: true,
    architecture: ['MSI 32/64 bits'],
  },
  {
    icon: darkMode ? MacDarkIcon : MacLightIcon,
    title: 'macOS',
    hr: true,
    architecture: ['Intel', 'Apple silicon'],
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
