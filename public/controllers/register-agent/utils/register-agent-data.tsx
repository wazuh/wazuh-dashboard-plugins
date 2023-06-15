import { RegisterAgentData } from '../components/checkbox-group/checkbox-group';
import LinuxIcon from '../../../../public/assets/images/icons/linux-icon.svg';
import WindowsIcon from '../../../../public/assets/images/icons/windows-icon.svg';
import MacIcon from '../../../../public/assets/images/icons/mac-icon.svg';

export const REGISTER_AGENT_DATA: RegisterAgentData[] = [
  {
    icon: LinuxIcon,
    title: 'LINUX',
    hr: true,
    architecture: ['RPM amd64', 'RPM aarch64', 'DEB amd64', 'DEB aarch64'],
  },
  {
    icon: WindowsIcon,
    title: 'WINDOWS',
    hr: true,
    architecture: ['MSI 32/64'],
  },
  {
    icon: MacIcon,
    title: 'macOS',
    hr: true,
    architecture: ['Intel', 'Apple Silicon'],
  },
];
