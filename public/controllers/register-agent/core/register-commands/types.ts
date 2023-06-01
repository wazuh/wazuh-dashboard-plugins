import { IOperationSystem } from "../domain/OperatingSystem";
import { IOptionalParameters } from "../domain/OptionalParameters";

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

export interface IOSDefinitionOption {
  extension: tPackageExtensions;
  architecture: string;
  wazuhVersion: string;
  name?: tOS;
}

export interface IOSCommandsDefinition {
  extension: tPackageExtensions;
  architecture: string;
  urlPackage: (props: IOSDefinitionOption) => string;
  installCommand: (props: IOSDefinitionOption & { urlPackage: string }) => string;
  startCommand: (props: IOSDefinitionOption) => string;
}

export interface IOSDefinition {
  name: tOS;
  options: IOSCommandsDefinition[];
}

///////////////////////////////////////////////////////////////////
export interface IOptionsParamConfig {
  property: string;
  getParamCommand: (property: string, value: string) => string;
}

export interface IOptionalParams {
  [key: string]: IOptionsParamConfig;
}

///////////////////////////////////////////////////////////////////

export type IOSInputs = IOperationSystem &
  Omit<IOptionalParameters, 'os'>;

export interface ICommandFinder {
  //getOSDefinition(input: IOperationSystem): IOSCommandsDefinition;
  getInstallCommand(): string;
  getStartCommand(): string;
  getURLPackage(): string;
}

interface IOptionalParamsResponse {
  name: string;
  propertyName: string;
  value: string;
  param: string;
}

export interface ICommandsResponse {
    wazuhVersion: string;
    os: string;
    architecture: string;
    extension: string;
    url_package: string;
    install_command: string;
    start_command: string;
    /*getOptionalParams<T>(): {
        [key in keyof T]: IOptionalParamsResponse;
    };*/
}

export interface ICommandCreator {
  osDefinitions: IOSDefinition[];
  wazuhVersion: string;
  selectOS(params: IOperationSystem): void;
  getInstallCommand(): string;
  getStartCommand(): string;
  getUrlPackage(): string;
  getAllCommands(): ICommandsResponse;
  /*getOptionalParams<T>(): {
    [key in keyof T]: IOptionalParamsResponse;
  };*/
}


