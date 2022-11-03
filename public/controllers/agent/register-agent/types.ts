
export type OSSystems = 'rpm' | 'deb' | 'macos' | 'win';
export type OSVersion = 'centos5' | 'centos6' | 'redhat5' | 'redhat6';
export type OSArchitecture = 'i386' | 'aarch64' | 'armhf' | 'x86_64';
export type OSSys = 'systemd' | 'sysV' | '';
export type RegisterAgentState = {
  status: string;
  selectedOS: OSSystems | '';
  selectedSYS: OSSys | '';
  selectedArchitecture: OSArchitecture | '';
  selectedVersion: OSVersion | '';
  serverAddress: string;
  groups: { label: string, id: string }[];
  selectedGroup: { label: string, id: string }[];
  udpProtocol: boolean;
  showPassword: boolean;
  wazuhVersion: string;
  wazuhPassword: string;
  version: string;
  loading: boolean;
  gotErrorRegistrationServiceInfo?: boolean;
  needsPassword?: boolean;
  hidePasswordInput?: boolean;
}