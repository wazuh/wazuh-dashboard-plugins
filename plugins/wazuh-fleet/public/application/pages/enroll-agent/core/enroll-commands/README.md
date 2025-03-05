# Documentation

- [Enroll Agent](#enroll-agent)
  - [Solution details](#solution-details)
  - [Configuration details](#configuration-details)
    - [OS Definitions](#os-definitions)
      - [Configuration example](#configuration-example)
      - [Validations](#validations)
    - [Optional Parameters Configuration](#optional-parameters-configuration)
      - [Configuration example](#configuration-example-1)
      - [Validations](#validations-1)
    - [Command Generator](#command-generator)
      - [Get install command](#get-install-command)
      - [Get start command](#get-start-command)
      - [Get url package](#get-url-package)
      - [Get all commands](#get-all-commands)

# Enroll Agent

The agent enrollment is a process that will allow the user to enroll an agent in the Manager. The plugin will provide a form where the user will be able to select the OS and the package that he wants to install. The plugin will generate the enrollment commands and will show them to the user.

# Solution details

To optimize and make more easier the process to generate the enrollment commands we have created a class called `Command Generator` that given a set of parameters it will generate the enrollment commands.

## Configuration

To make the command generator works we need to configure the following parameters and pass them to the class:

## OS Definitions

The OS definitions are a set of parameters that will be used to generate the enrollment commands. The parameters are the following:

```ts
// global types

export interface IOptionsParamConfig<T extends string> {
  property: string;
  getParamCommand: (props: TOptionalParamsCommandProps<T>) => string;
}

export type TOptionalParams<T extends string> = {
  [key in T]: IOptionsParamConfig<T>;
};

export interface IOperationSystem {
  name: string;
  architecture: string;
}

/// ....

interface ILinuxOSTypes {
  name: 'linux';
  architecture: 'x64' | 'x86';
}
interface IWindowsOSTypes {
  name: 'windows';
  architecture: 'x86';
}

interface IMacOSTypes {
  name: 'mac';
  architecture: '32/64';
}

type TOperatingSystem = ILinuxOSTypes | IMacOSTypes | IWindowsOSTypes; // add the necessary OS options

type TOptionalParameters =
  | 'server_address'
  | 'agent_name'
  | 'username'
  | 'password'
  | 'verificationMode'
  | 'enrollmentKey';

export interface IOSDefinition<
  OS extends IOperationSystem,
  Params extends string,
> {
  name: OS['name'];
  options: IOSCommandsDefinition<OS, Params>[];
}

export interface IOSCommandsDefinition<
  OS extends IOperationSystem,
  Param extends string,
> {
  architecture: OS['architecture'];
  urlPackage: (props: TOSEntryProps<Param>) => string;
  installCommand: (
    props: TOSEntryProps<Param> & { urlPackage: string },
  ) => string;
  startCommand: (props: TOSEntryProps<Param>) => string;
}
```

This configuration will define the different OS that we want to support and the different packages that we want to support for each OS. The `urlPackage` function will be used to generate the URL to download the package, the `installCommand` function will be used to generate the command to install the package and the `startCommand` function will be used to generate the command to start the agent.

### Configuration example

```ts

const osDefinitions: IOSDefinition<TOperatingSystem, TOptionalParameters>[] = [{
  name: 'linux',
  options: [
    {
      architecture: 'amd64',
      urlPackage: props => 'add url package',
      installCommand: props => 'add install command',
      startCommand: props => `add start command`,
    },
    {
      architecture: 'amd64',
      urlPackage: props => 'add url package',
      installCommand: props => 'add install command',
      startCommand: props => `add start command`,
    }
  ],
},
{
    name: 'windows',
    options: [
        {
        architecture: '32/64',
        urlPackage: props => 'add url package',
        installCommand: props => 'add install command',
        startCommand: props => `add start command`,
        },
    ],
  }
};
```

## Validations

The `Command Generator` will validate the OS Definitions received and will throw an error if the configuration is not valid. The validations are the following:

- The OS Definitions must not have duplicated OS names defined.
- The OS Definitions must not have duplicated options defined.
- The OS names would be defined in the `tOS` type.
- The Package Extensions would be defined in the `tPackageExtensions` type.

Another validations will be provided in development time and will be provided by the types added to the project. You can find the types definitions in the `types` file.

## Optional Parameters Configuration

The optional parameters are a set of parameters that will be added to the enrollment commands. The parameters are the following:

```ts
export type TOptionalParamsName =
  | 'server_address'
  | 'agent_name'
  | 'username'
  | 'password'
  | 'verificationMode'
  | 'enrollmentKey';

export type TOptionalParams = {
  [key in TOptionalParamsName]: {
    property: string;
    getParamCommand: (props) => string;
  };
};
```

This configuration will define the different optional parameters that we want to support and the way how to we will process and show in the commands.The `getParamCommand` is the function that will process the props received and show the final command format.

### Configuration example

```ts

export const optionalParameters: TOptionalParams<TOptionalParameters> = {
  server_address: {
      property: '--enroll-url',
      getParamCommand:  props => 'returns the optional param command'
    }
  },
  any_other: {
      property: 'PARAM NAME IN THE COMMAND',
      getParamCommand: props => 'returns the optional param command'
  },
}

```

## Validations

The `Command Generator` will validate the Optional Parameters received and will throw an error if the configuration is not valid. The validations are the following:

- The Optional Parameters must not have duplicated names defined.
- The Optional Parameters name would be defined in the `TOptionalParamsName` type.

Another validations will be provided in development time and will be provided by the types added to the project. You can find the types definitions in the `types` file.

## Command Generator

To use the command generator we need to import the class and create a new instance of the class. The class will receive the OS Definitions and the Optional Parameters as parameters.

```ts
import { CommandGenerator } from 'path/command-generator';

// Commange Generator interface/contract

export interface ICommandGenerator<
  OS extends IOperationSystem,
  Params extends string,
> extends ICommandGeneratorMethods<Params> {
  osDefinitions: IOSDefinition<OS, Params>[];
  wazuhVersion: string;
}

export interface ICommandGeneratorMethods<T extends string> {
  selectOS(params: IOperationSystem): void;
  addOptionalParams(props: IOptionalParameters<T>): void;
  getInstallCommand(): string;
  getStartCommand(): string;
  getUrlPackage(): string;
  getAllCommands(): ICommandsResponse<T>;
}

const commandGenerator = new CommandGenerator(
  osDefinitions,
  optionalParameters,
);
```

When the class is created the definitions provided will be validated and if the configuration is not valid an error will be thrown. The errors were mentioned in the configurations `Validations` section.

### Get install command

To generate the install command we need to call the `getInstallComand` function. To perform this function the `Command Generator` must receive the OS name and/or the optional parameters as parameters before. The function will return the requested command.

```ts
import { CommandGenerator } from 'path/command-generator';

const commandGenerator = new CommandGenerator(
  osDefinitions,
  optionalParameters,
);

// specify to the command generator the OS that we want to use
commandGenerator.selectOS({
  name: 'linux',
  architecture: 'amd64',
});

// get install command
const installCommand = commandGenerator.getInstallCommand();
```

The `Command Generator` will search the OS provided and search in the OS Definitions and will process the command using the `installCommand` function defined in the OS Definition. If the OS is not found an error will be thrown.
If the `getInstallCommand` but the OS is not selected an error will be thrown.

## Get start command

To generate the install command we need to call the `getStartCommand` function. To perform this function the `Command Generator` must receive the OS name and/or the optional parameters as parameters before. The function will return the requested command.

```ts
import { CommandGenerator } from 'path/command-generator';

const commandGenerator = new CommandGenerator(
  osDefinitions,
  optionalParameters,
);

// specify to the command generator the OS that we want to use
commandGenerator.selectOS({
  name: 'linux',
  architecture: 'amd64',
});

// get start command
const installCommand = commandGenerator.getStartCommand();
```

## Get url package

To generate the install command we need to call the `getUrlPackage` function. To perform this function the `Command Generator` must receive the OS name and/or the optional parameters as parameters before. The function will return the requested command.

```ts
import { CommandGenerator } from 'path/command-generator';

const commandGenerator = new CommandGenerator(
  osDefinitions,
  optionalParameters,
);

// specify to the command generator the OS that we want to use
commandGenerator.selectOS({
  name: 'linux',
  architecture: 'amd64',
});

const urlPackage = commandGenerator.getUrlPackage();
```

## Get all commands

To generate the install command we need to call the `getAllCommands` function. To perform this function the `Command Generator` must receive the OS name and/or the optional parameters as parameters before. The function will return the requested commands.

```ts
import { CommandGenerator } from 'path/command-generator';

const commandGenerator = new CommandGenerator(
  osDefinitions,
  optionalParameters,
);

// specify to the command generator the OS that we want to use
commandGenerator.selectOS({
  name: 'linux',
  architecture: 'amd64',
});

// specify to the command generator the optional parameters that we want to use
commandGenerator.addOptionalParams({
  server_address: 'server-ip',
  agent_name: 'agent-name',
  any_parameter: 'any-value',
});

// get all commands
const installCommand = commandGenerator.getAllCommands();
```

If we specify the optional parameters the `Command Generator` will process the commands and will add the optional parameters to the commands. The optional parameters processing will be only applied to the commands that have the optional parameters defined in the Optional Parameters Definitions. If the OS Definition does not have the optional parameters defined the `Command Generator` will ignore the optional parameters.

### getAllComands output

```ts
export interface ICommandsResponse<T extends string> {
  wazuhVersion: string;
  os: string;
  architecture: string;
  url_package: string;
  install_command: string;
  start_command: string;
  optionals: IOptionalParameters<T> | object;
}
```
