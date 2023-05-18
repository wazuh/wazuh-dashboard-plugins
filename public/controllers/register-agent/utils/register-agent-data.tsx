import { RegisterAgentData } from '../components/checkbox-group';
import MacIcon from '../../../../public/assets/images/icons/mac-icon.svg';

export const REGISTER_AGENT_DATA: RegisterAgentData[] = [
  {
    icon: MacIcon,
    title: 'aa',
    hr: true,
    architecture: ['RPM amd64', 'RPM aarch64', 'DEB amd64', 'DEB aarch64'],
  },
  {
    icon: 'aa',
    title: 'aa',
    hr: true,
    architecture: ['MSI 32/64'],
  },
  {
    icon: 'aa',
    title: 'aa',
    hr: true,
    architecture: ['PKG 32/64 amb64'],
  },
];
