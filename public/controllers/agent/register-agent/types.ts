export type OSSystems =
  | 'rpm'
  | 'deb'
  | 'macos'
  | 'win'
  | 'cent'
  | 'ubu'
  | 'wopen'
  | 'sol'
  | 'aix'
  | 'hp'
  | 'amazonlinux'
  | 'fedora'
  | 'oraclelinux'
  | 'suse'
  | 'raspbian'
  | 'open';
export type OSVersion =
  | 'centos5'
  | 'centos6'
  | 'centos7'
  | 'suse11'
  | 'suse12'
  | 'oraclelinux5'
  | 'oraclelinux6'
  | 'amazonlinux1'
  | 'amazonlinux2'
  | '22'
  | 'busterorgreater'
  | 'ubuntu14'
  | 'ubuntu15'
  | 'ubuntu16'
  | 'leap15'
  | 'redhat5'
  | 'redhat6'
  | 'solaris10'
  | 'solaris11'
  | 'windowsxp'
  | 'windows8'
  | 'sierra'
  | 'highSierra'
  | 'mojave'
  | 'catalina'
  | 'bigSur'
  | 'monterrey'
  | '6.1 TL9'
  | '11.31'
  | 'debian7'
  | 'debian8'
  | 'debian9'
  | 'debian10'
  | 'redhat7'
  | 'amazonlinux2022';
export type OSArchitecture = 'i386' | 'aarch64' | 'armhf' | 'x86_64' | '';
export type OSSys = 'systemd' | 'sysV' | '';
export type RegisterAgentState = {
  status: string;
  selectedOS: OSSystems | '';
  selectedSYS: OSSys | '';
  selectedArchitecture: OSArchitecture | '';
  selectedVersion: OSVersion | '';
  serverAddress: string;
  groups: { label: string; id: string }[];
  agentGroup: { label: string; id: string }[];
  udpProtocol: boolean;
  showPassword: boolean;
  wazuhVersion: string;
  wazuhPassword: string;
  agentName: string;
  version: string;
  loading: boolean;
  gotErrorRegistrationServiceInfo?: boolean;
  needsPassword?: boolean;
  hidePasswordInput?: boolean;
};
