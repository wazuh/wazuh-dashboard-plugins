import { RegisterAgentData } from '../interfaces/types';
import LinuxDarkIcon from '../../../../public/assets/images/themes/dark/linux-icon.svg';
import LinuxLightIcon from '../../../../public/assets/images/themes/light/linux-icon.svg';
import WindowsDarkIcon from '../../../../public/assets/images/themes/dark/windows-icon.svg';
import WindowsLightIcon from '../../../../public/assets/images/themes/light/windows-icon.svg';
import MacDarkIcon from '../../../../public/assets/images/themes/dark/mac-icon.svg';
import MacLightIcon from '../../../../public/assets/images/themes/light/mac-icon.svg';
import { getUiSettings } from '../../../kibana-services';

const darkMode = getUiSettings()?.get('theme:darkMode');

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
      'This is the address the agent uses to communicate with the Wazuh server. Enter an IP address or a fully qualified domain name (FDQN).',
  },
];

export const OPTIONAL_PARAMETERS_TEXT = [
  {
    title: 'Optional settings',
    subtitle:
      'The deployment sets the endpoint hostname as the agent name by default. Optionally, you can set your own name in the field below.',
  },
];
