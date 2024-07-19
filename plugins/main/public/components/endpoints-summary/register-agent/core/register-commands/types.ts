/////////////////////////////////////////////////////////
/// Domain
/////////////////////////////////////////////////////////
export interface IOperationSystem {
  name: string;
  architecture: string;
}

export type IOptionalParameters<Params extends string> = {
  [key in Params]: string;
};

///////////////////////////////////////////////////////////////////
/// Operating system commands definitions
///////////////////////////////////////////////////////////////////

export interface IOSDefinition<
  OS extends IOperationSystem,
  Params extends string,
> {
  name: OS['name'];
  options: IOSCommandsDefinition<OS, Params>[];
}

interface IOptionalParamsWithValues<Params extends string> {
  optionals?: IOptionalParameters<Params>;
}

export type tOSEntryProps<Param extends string> = IOSProps &
  IOptionalParamsWithValues<Param>;
export type tOSEntryInstallCommand<Param extends string> =
  tOSEntryProps<Param> & { urlPackage: string };

export interface IOSCommandsDefinition<
  OS extends IOperationSystem,
  Param extends string,
> {
  architecture: OS['architecture'];
  urlPackage: (props: tOSEntryProps<Param>) => string;
  installCommand: (props: tOSEntryInstallCommand<Param>) => string;
  startCommand: (props: tOSEntryProps<Param>) => string;
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

export type tOptionalParamsCommandProps<T extends string> =
  IOptionalParamProps & {
    name: T;
  };
export interface IOptionsParamConfig<T extends string> {
  property: string;
  getParamCommand: (
    props: tOptionalParamsCommandProps<T>,
    selectedOS?: IOperationSystem,
  ) => string;
}

export type tOptionalParams<T extends string> = {
  [key in T]: IOptionsParamConfig<T>;
};

export interface IOptionalParamInput<T extends string> {
  value: any;
  name: T;
}
export interface IOptionalParametersManager<T extends string> {
  getOptionalParam(props: IOptionalParamInput<T>): string;
  getAllOptionalParams(
    paramsValues: IOptionalParameters<T>,
    selectedOs?: IOperationSystem,
  ): object;
}

///////////////////////////////////////////////////////////////////
/// Command creator class
///////////////////////////////////////////////////////////////////

export type IOSInputs<T extends string> = IOperationSystem &
  IOptionalParameters<T>;
export interface ICommandGenerator<
  OS extends IOperationSystem,
  Params extends string,
> extends ICommandGeneratorMethods<Params> {
  osDefinitions: IOSDefinition<OS, Params>[];
  wazuhVersion: string;
}

export interface ICommandGeneratorMethods<T extends string> {
  selectOS(params: IOperationSystem): void;
  addOptionalParams(
    props: IOptionalParameters<T>,
    osSelected?: IOperationSystem,
  ): void;
  getInstallCommand(): string;
  getStartCommand(): string;
  getUrlPackage(): string;
  getAllCommands(): ICommandsResponse<T>;
}
export interface ICommandsResponse<T extends string> {
  wazuhVersion: string;
  os: string;
  architecture: string;
  url_package: string;
  install_command: string;
  start_command: string;
  optionals: IOptionalParameters<T> | object;
}
