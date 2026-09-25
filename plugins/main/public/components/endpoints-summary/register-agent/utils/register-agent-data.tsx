import { i18n } from '@osd/i18n';
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
    title: i18n.translate('wazuh.endpointsSummary.serverAddressStep.title', {
      defaultMessage: 'Server address',
    }),
    subtitle: i18n.translate(
      'wazuh.endpointsSummary.serverAddressStep.subtitle',
      {
        defaultMessage:
          'The agent reaches the server at a single endpoint built from an address, a port, and a path prefix. Only the address is required: the other two are under the advanced options, and left empty the agent falls back to its own defaults.',
      },
    ),
  },
];

export const OPTIONAL_PARAMETERS_TEXT = [
  {
    title: i18n.translate('wazuh.endpointsSummary.optionalSettingsStep.title', {
      defaultMessage: 'Optional settings',
    }),
    subtitle: i18n.translate(
      'wazuh.endpointsSummary.optionalSettingsStep.subtitle',
      {
        defaultMessage:
          'The agent verifies the manager certificate by default, against the endpoint system CA store or against a manager CA file given below. The deployment also uses the hostname as the agent name. Optionally, you can turn the verification off and use a different agent name in the fields below.',
      },
    ),
  },
];

export const ENROLLMENT_TOKEN_TEXTS = [
  {
    title: i18n.translate('wazuh.endpointsSummary.enrollmentTokenStep.title', {
      defaultMessage: 'Enrollment token',
    }),
    subtitle: i18n.translate(
      'wazuh.endpointsSummary.enrollmentTokenStep.subtitle',
      {
        defaultMessage:
          'The agent enrolls with a token that names this manager and pins its certificate authority. Generate one with the server defaults, a 30 day lifetime and unlimited enrollments, open the advanced options to set those values yourself, or reuse a token kept from an earlier deployment.',
      },
    ),
  },
];
