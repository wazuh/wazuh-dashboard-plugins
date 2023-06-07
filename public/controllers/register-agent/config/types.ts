// Defined OS combinations
export interface ILinuxOSTypes {
  name: 'linux';
  architecture: 'x64' | 'x86';
  extension: 'rpm' | 'deb';
}
export interface IWindowsOSTypes {
  name: 'windows';
  architecture: 'x86';
  extension: 'msi';
}

export interface IMacOSTypes {
  name: 'mac';
  architecture: '32/64';
  extension: 'pkg';
}

export type tOperatingSystem = ILinuxOSTypes | IMacOSTypes | IWindowsOSTypes;
