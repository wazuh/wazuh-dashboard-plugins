import {
  ICommandConstructorInput,
  IDefinitionsInput,
  IOSCommandsDefinition,
  IOSDefinition,
} from './register-agent-commands/types';

export type IOSInputs = IDefinitionsInput &
  Omit<ICommandConstructorInput, 'os'>;

export interface ICommandFinder {
  getOSDefinition(input: IDefinitionsInput): IOSCommandsDefinition;
}

interface IOptionalParamsResponse {
  name: string;
  propertyName: string;
  value: string;
  param: string;
}

interface ICommandsResponse {
    os: string;
    version: string;
    architecture: string;
    installCommand(): string;
    startCommand(): string;
    /*getOptionalParams<T>(): {
        [key in keyof T]: IOptionalParamsResponse;
    };*/
}

export interface ICommandCreator {
  commandFinder: ICommandFinder;
  osDefinitions: IOSDefinition[];
  version: string;
  selectOS(params: IDefinitionsInput): any;
  getInstallCommand(): string;
  getStartCommand(): string;
  /*getOptionalParams<T>(): {
    [key in keyof T]: IOptionalParamsResponse;
  };*/
}
