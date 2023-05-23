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

export interface OSDefinitionOption {
  extension: tPackageExtensions;
  architecture: string;
  version: string;
  name?: tOS;
  packageManager?: tPackageManagerTypes;
}

export interface OSDefinition {
  name: tOS;
  options: {
    extension: tPackageExtensions;
    architecture: string;
    packageManager: tPackageManagerTypes;
    urlPackage: (props: OSDefinitionOption) => string;
    installCommand: (props: OSDefinitionOption & { urlPackage: string }) => string;
    startCommand: (props: OSDefinitionOption) => string;
  }[];
}

///////////////////////////////////////////////////////////////////

export interface ICommandConstructorInput {
  os: OSDefinition;
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
  osDefinitions: OSDefinition[],
  osName: tOS,
  architecture: string,
  extension: tPackageExtensions,
  packageManager: tPackageManagerTypes
}
