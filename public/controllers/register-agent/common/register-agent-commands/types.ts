export type tOS = 'linux' | 'windows' | 'mac';
export type tPackageExtensions =
  | 'rpm'
  | 'deb'
  | 'rpm'
  | 'msi'
  | 'pkg'
  | 'p5p'
  | 'rpm'
  | 'tar'
  | 'apk';

export type tPackageManagerTypes =
  | 'yum'
  | 'apt'
  | 'zypper'
  | 'win'
  | 'mac'
  | 'pkgadd'
  | 'pkg'
  | 'rpm'
  | 'aix'
  | 'hp'
  | 'apk'
  | 'curl';

export interface IOSDefinitionOption {
  extension: tPackageExtensions;
  architecture: string;
  version: string;
  name?: tOS;
  packageManager?: tPackageManagerTypes;
}

export interface IOSCommandsDefinition {
  extension: tPackageExtensions;
  architecture: string;
  packageManager: tPackageManagerTypes;
  urlPackage: (props: IOSDefinitionOption) => string;
  installCommand: (props: IOSDefinitionOption & { urlPackage: string }) => string;
  startCommand: (props: IOSDefinitionOption) => string;
}

export interface IOSDefinition {
  name: tOS;
  options: IOSCommandsDefinition[];
}

///////////////////////////////////////////////////////////////////

export interface ICommandConstructorInput {
  os: IOSDefinition;
  serverAddress: string;
  agentName?: string;
  groups?: string[];
  password?: string;
  protocol?: string;
}

type tPackagesArchitecture = {
  [key in tPackageManagerTypes]: tPackageExtensions;
};


export interface IDefinitionsInput {
  osName: tOS,
  architecture: string,
  extension: tPackageExtensions,
  packageManager: tPackageManagerTypes
}

///////////////////////////////////////////////////////////////////
export interface IOptionsParamConfig {
  property: string;
  getParamCommand: (property: string, value: string) => string;
}

export interface IOptionalParams {
  [key: string]: IOptionsParamConfig;
}


