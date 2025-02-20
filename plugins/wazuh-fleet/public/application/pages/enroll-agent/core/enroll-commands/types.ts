// ///////////////////////////////////////////////////////
// / Domain
// ///////////////////////////////////////////////////////
export interface IOperationSystem {
  name: string;
  architecture: string;
}

export type IOptionalParameters<Params extends string> = Record<Params, string>;

// /////////////////////////////////////////////////////////////////
// / Operating system commands definitions
// /////////////////////////////////////////////////////////////////

export interface IOSProps extends IOperationSystem {
  wazuhVersion: string;
}

interface IOptionalParamsWithValues<Params extends string> {
  optionals?: IOptionalParameters<Params>;
}

export type TOSEntryProps<Param extends string> = IOSProps &
  IOptionalParamsWithValues<Param>;
export type TOSEntryInstallCommand<Param extends string> =
  TOSEntryProps<Param> & { urlPackage: string };

export interface IOSCommandsDefinition<
  OS extends IOperationSystem,
  Param extends string,
> {
  architecture: OS['architecture'];
  urlPackage: (props: TOSEntryProps<Param>) => string;
  installCommand: (props: TOSEntryInstallCommand<Param>) => string;
  startCommand: (props: TOSEntryProps<Param>) => string;
}
export interface IOSDefinition<
  OS extends IOperationSystem,
  Params extends string,
> {
  name: OS['name'];
  options: IOSCommandsDefinition<OS, Params>[];
}

// /////////////////////////////////////////////////////////////////
// // Commands optional parameters
// /////////////////////////////////////////////////////////////////
interface IOptionalParamProps {
  property: string;
  value: string;
}

export type TOptionalParamsCommandProps<T extends string> =
  IOptionalParamProps & {
    name: T;
  };
export interface IOptionsParamConfig<T extends string> {
  property: string;
  getParamCommand: (
    props: TOptionalParamsCommandProps<T>,
    selectedOS?: IOperationSystem,
  ) => string;
}

export type TOptionalParams<T extends string> = Record<
  T,
  IOptionsParamConfig<T>
>;

export interface IOptionalParamInput<T extends string> {
  value: any;
  name: T;
}
export interface IOptionalParametersManager<T extends string> {
  getOptionalParam: (props: IOptionalParamInput<T>) => string;
  getAllOptionalParams: (
    paramsValues: IOptionalParameters<T>,
    selectedOs?: IOperationSystem,
  ) => object;
}

// /////////////////////////////////////////////////////////////////
// / Command creator class
// /////////////////////////////////////////////////////////////////
export interface ICommandsResponse<T extends string> {
  wazuhVersion: string;
  os: string;
  architecture: string;
  url_package: string;
  install_command: string;
  start_command: string;
  optionals: IOptionalParameters<T> | object;
}

export interface ICommandGeneratorMethods<T extends string> {
  selectOS: (params: IOperationSystem) => void;
  addOptionalParams: (
    props: IOptionalParameters<T>,
    osSelected?: IOperationSystem,
  ) => void;
  getInstallCommand: () => string;
  getStartCommand: () => string;
  getUrlPackage: () => string;
  getAllCommands: () => ICommandsResponse<T>;
}

export type IOSInputs<T extends string> = IOperationSystem &
  IOptionalParameters<T>;
export interface ICommandGenerator<
  OS extends IOperationSystem,
  Params extends string,
> extends ICommandGeneratorMethods<Params> {
  osDefinitions: IOSDefinition<OS, Params>[];
  wazuhVersion: string;
}
