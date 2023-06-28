import { RegisterAgentData } from '../interfaces/types';
import LinuxDarkIcon from '../../../../public/assets/images/themes/dark/linux-icon.svg';
import LinuxLightIcon from '../../../../public/assets/images/themes/light/linux-icon.svg';
import WindowsDarkIcon from '../../../../public/assets/images/themes/dark/windows-icon.svg';
import WindowsLightIcon from '../../../../public/assets/images/themes/light/windows-icon.svg';
import MacDarkIcon from '../../../../public/assets/images/themes/dark/mac-icon.svg';
import MacLightIcon from '../../../../public/assets/images/themes/light/mac-icon.svg';
import { getUiSettings } from '../../../kibana-services';

const theme = getUiSettings()?.get('theme:darkMode') ? 'dark' : 'light';

export const REGISTER_AGENT_DATA_STEP_ONE: RegisterAgentData[] = [
  {
    icon: theme === 'dark' ? LinuxDarkIcon : LinuxLightIcon,
    title: 'LINUX',
    hr: true,
    architecture: ['RPM amd64', 'RPM aarch64', 'DEB amd64', 'DEB aarch64'],
  },
  {
    icon: theme === 'dark' ? WindowsDarkIcon : WindowsLightIcon,
    title: 'WINDOWS',
    hr: true,
    architecture: ['MSI 32/64'],
  },
  {
    icon: theme === 'dark' ? MacDarkIcon : MacLightIcon,
    title: 'macOS',
    hr: true,
    architecture: ['Intel', 'Apple Silicon'],
  },
];

export const REGISTER_AGENT_DATA_STEP_TWO = [
  {
    title: 'Server address',
    subtitle:
      'This is the address the agent uses to communicate with the Wazuh server. Enter an IP address or a fully qualified domain name (FDQN).',
  },
];

export const REGISTER_AGENT_DATA_STEP_THREE = [
  {
    title: 'Optional settings',
    subtitle:
      'The deployment sets the endpoint hostname as the agent name by default. Optionally, you can set your own name in the field below.',
  },
];
