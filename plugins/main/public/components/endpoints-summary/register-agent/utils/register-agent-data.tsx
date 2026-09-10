import { RegisterAgentData } from '../interfaces/types';
import LinuxDarkIcon from '../../../../../public/assets/images/themes/dark/linux-icon.svg';
import LinuxLightIcon from '../../../../../public/assets/images/themes/light/linux-icon.svg';
import WindowsDarkIcon from '../../../../../public/assets/images/themes/dark/windows-icon.svg';
import WindowsLightIcon from '../../../../../public/assets/images/themes/light/windows-icon.svg';
import MacDarkIcon from '../../../../../public/assets/images/themes/dark/mac-icon.svg';
import MacLightIcon from '../../../../../public/assets/images/themes/light/mac-icon.svg';
import { getUiSettings } from '../../../../kibana-services';

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
      'The agent reaches the server at a single endpoint built from an address, a port, and a path prefix. Only the address is required: the other two are under the advanced options, and left empty the agent falls back to its own defaults.',
  },
];

export const OPTIONAL_PARAMETERS_TEXT = [
  {
    title: 'Optional settings',
    subtitle:
      'By default, the deployment uses the hostname as the agent name. Optionally, you can use a different agent name in the field below.',
  },
];

export const ENROLLMENT_TOKEN_TEXTS = [
  {
    title: 'Enrollment token',
    subtitle:
      'The agent enrolls with a token that names this manager and pins its certificate authority, instead of with the shared enrollment password. Generate one with the server defaults, a 30 day lifetime and unlimited enrollments, or open the advanced options to reuse a token kept from an earlier deployment or to set those values yourself.',
  },
];
