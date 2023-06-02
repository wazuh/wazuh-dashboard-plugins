/////////////////////////////////////////////////////////
/// Domain
/////////////////////////////////////////////////////////

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

export interface IOperationSystem {
  name: tOS;
  architecture: string;
  extension: tPackageExtensions;
}

export type IOptionalParameters = {
  [key in tOptionalParamsName]: string;
};

///////////////////////////////////////////////////////////////////
/// Operating system commands definitions
///////////////////////////////////////////////////////////////////

export interface IOSDefinition {
  name: tOS;
  options: IOSCommandsDefinition[];
}

type tOSEntryProps = IOSProps & { optionals?: IOptionalParameters };

export interface IOSCommandsDefinition {
  extension: tPackageExtensions;
  architecture: string;
  urlPackage: (props: tOSEntryProps) => string;
  installCommand: (props: tOSEntryProps & { urlPackage: string }) => string;
  startCommand: (props: tOSEntryProps) => string;
}

export interface IOSProps extends IOperationSystem {
  wazuhVersion: string;
}

///////////////////////////////////////////////////////////////////
//// Commands optional parameters
///////////////////////////////////////////////////////////////////
interface IOptionalParamProps {
  property: string;
  value: string;
}

export type tOptionalParamsName =
  | 'server_address'
  | 'agent_name'
  | 'protocol'
  | 'agent_group'
  | 'wazuh_password';

export type tOptionalParamsCommandProps = IOptionalParamProps & {
  name: tOptionalParamsName;
};
export interface IOptionsParamConfig {
  property: string;
  getParamCommand: (props: tOptionalParamsCommandProps) => string;
}

export type tOptionalParams = {
  [key in tOptionalParamsName]: IOptionsParamConfig;
};

export interface IOptionalParamInput {
  value: string;
  name: tOptionalParamsName;
}
export interface IOptionalParametersManager {
  getOptionalParam(props: IOptionalParamInput): string;
  getAllOptionalParams(paramsValues: IOptionalParameters): object;
}

///////////////////////////////////////////////////////////////////
/// Command creator class
///////////////////////////////////////////////////////////////////

export type IOSInputs = IOperationSystem & IOptionalParameters;
export interface ICommandGenerator {
  osDefinitions: IOSDefinition[];
  wazuhVersion: string;
  selectOS(params: IOperationSystem): void;
  addOptionalParams(props: IOptionalParameters): void;
  getInstallCommand(): string;
  getStartCommand(): string;
  getUrlPackage(): string;
  getAllCommands(): ICommandsResponse;
}
export interface ICommandsResponse {
  wazuhVersion: string;
  os: string;
  architecture: string;
  extension: string;
  url_package: string;
  install_command: string;
  start_command: string;
  optionals: IOptionalParameters | object;
}
