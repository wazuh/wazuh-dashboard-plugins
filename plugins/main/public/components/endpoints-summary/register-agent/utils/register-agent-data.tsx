import { RegisterAgentData } from '../interfaces/types';
import LinuxDarkIcon from '../../../../../public/assets/images/themes/dark/linux-icon.svg';
import LinuxLightIcon from '../../../../../public/assets/images/themes/light/linux-icon.svg';
import WindowsDarkIcon from '../../../../../public/assets/images/themes/dark/windows-icon.svg';
import WindowsLightIcon from '../../../../../public/assets/images/themes/light/windows-icon.svg';
import MacDarkIcon from '../../../../../public/assets/images/themes/dark/mac-icon.svg';
import MacLightIcon from '../../../../../public/assets/images/themes/light/mac-icon.svg';
import { getUiSettings } from '../../../../kibana-services';
import { endpointsSummaryI18n } from '../../i18n';

const darkMode = getUiSettings()?.get('theme:darkMode');
const dw = endpointsSummaryI18n.deployWizard;

export const OPERATING_SYSTEMS_OPTIONS: RegisterAgentData[] = [
  {
    icon: darkMode ? LinuxDarkIcon : LinuxLightIcon,
    title: dw.osLinux,
    hr: true,
    architecture: ['RPM amd64', 'RPM aarch64', 'DEB amd64', 'DEB aarch64'],
  },
  {
    icon: darkMode ? WindowsDarkIcon : WindowsLightIcon,
    title: dw.osWindows,
    hr: true,
    architecture: ['MSI 32/64 bits'],
  },
  {
    icon: darkMode ? MacDarkIcon : MacLightIcon,
    title: dw.osMacos,
    hr: true,
    architecture: ['Intel', 'Apple silicon'],
  },
];

export const SERVER_ADDRESS_TEXTS = [
  {
    subtitle: dw.serverAddressSubtitle,
  },
];

export const OPTIONAL_PARAMETERS_TEXT = [
  {
    subtitle: dw.optionalSettingsSubtitle,
  },
];
