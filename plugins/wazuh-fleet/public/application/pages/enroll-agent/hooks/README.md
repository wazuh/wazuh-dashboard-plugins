# Documentation

- [useEnrollAgentCommand hook](#useenrollagentcommand-hook)
- [Advantages](#advantages)
- [Usage](#usage)
- [Types](#types)
  - [Hook props](#hook-props)
  - [Hook output](#hook-output)
- [Hook with Generic types](#hook-with-generic-types)
  - [Operating systems types example](#operating-systems-types-example)

## useEnrollAgentCommand hook

This hook makes use of the `Command Generator class` to generate the commands to enroll agents in the manager and allows to use it in React components.

## Advantages

- Ease of use of the Command Generator class.
- The hook returns the methods envolved to create the enroll commands by the operating system and optionas specified.
- The commands generate are stored in the state of the hook and can be used in the component.

## Usage

```ts

import { useEnrollAgentCommands } from 'path/to/use-enroll-agent-commands';

import { OSdefintions, paramsDefinitions} from 'path/config/os-definitions';

/*
  the props recived by the hook must implement types:
    - OS: IOSDefinition<TOperatingSystem, TOptionalParamsNames>[]
    - optional parameters: TOptionalParams<TOptionalParamsNames>
*/

const {
  selectOS,
  setOptionalParams,
  installCommand,
  startCommand,
  optionalParamsParsed
 } = useEnrollAgentCommands<TOperatingSystem, TOptionalParameters>();

// select OS depending on the specified OS defined in the hook configuration
selectOS({
    name: 'name-OS',
    architecture: 'architecture-OS',
})

// add optionals params depending on the specified optional parameters in the hook configuration
setOptionalParams({
    field_1: 'value_1',
    field_2: 'value_2',
    ...
})

/** the commands and the optional params will be processed and stored in the hook state **/

// install command
console.log('install command for the selected OS with optionals params', installCommand);
// start command
console.log('start command for the selected OS with optionals params', startCommand);
// optionals params processed
console.log('optionals params processed', optionalParamsParsed);

```

## Types

### Hook props

```ts
export interface IOperationSystem {
  name: string;
  architecture: string;
}

interface IUseEnrollCommandsProps<
  OS extends IOperationSystem,
  Params extends string,
> {
  osDefinitions: IOSDefinition<OS, Params>[];
  optionalParamsDefinitions: TOptionalParams<Params>;
}
```

### Hook output

```ts
export interface IOperationSystem {
  name: string;
  architecture: string;
}

interface IUseEnrollCommandsOutput<
  OS extends IOperationSystem,
  Params extends string,
> {
  selectOS: (params: OS) => void;
  setOptionalParams: (params: IOptionalParameters<Params>) => void;
  installCommand: string;
  startCommand: string;
  optionalParamsParsed: IOptionalParameters<Params> | {};
}
```

## Hook with Generic types

We can pass the types with the OS posibilities options and the optionals params defined.
And the hook will validate and show warning in compilation and development time.

#### Operating systems types example

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

export interface ILinuxOSTypes {
  name: 'linux';
  architecture: 'x64' | 'x86';
}
export interface IWindowsOSTypes {
  name: 'windows';
  architecture: 'x86';
}

export interface IMacOSTypes {
  name: 'mac';
  architecture: '32/64';
}

export type TOperatingSystem = ILinuxOSTypes | IMacOSTypes | IWindowsOSTypes;

type TOptionalParameters =
  | 'server_address'
  | 'agent_name'
  | 'username'
  | 'password'
  | 'verificationMode'
  | 'enrollmentKey';

import { OSdefintions, paramsDefinitions } from 'path/config/os-definitions';

// pass it to the hook and it will use the types when we are selecting the OS
const {
  selectOS,
  setOptionalParams,
  installCommand,
  startCommand,
  optionalParamsParsed,
} = useEnrollAgentCommands<TOperatingSystem, TOptionalParameters>(
  OSdefintions,
  paramsDefinitions,
);

// when the options are not valid depending on the types defined, the IDE will show a warning
selectOS({
  name: 'linux',
  architecture: 'x64',
});
```
