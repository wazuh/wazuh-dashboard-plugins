# Documentation

- [useRegisterAgentCommand hook](#useregisteragentcommand-hook)
- [Advantages](#advantages)
- [Usage](#usage)
- [Types](#types)
    - [Hook props](#hook-props)
    - [Hook output](#hook-output)
- [Hook with Generic types](#hook-with-generic-types)
    - [Operating systems types example](#operating-systems-types-example)

## useRegisterAgentCommand hook

This hook makes use of the `Command Generator class` to generate the commands to register agents in the manager and allows to use it in React components.

## Advantages

- Ease of use of the Command Generator class.
- The hook returns the methods envolved to create the register commands by the operating system and optionas specified.
- The commands generate are stored in the state of the hook and can be used in the component.


## Usage

```ts

import { useRegisterAgentCommands } from 'path/to/use-register-agent-commands';

const { 
  selectOS,
  setOptionalParams,
  installCommand,
  startCommand,
  optionalParamsParsed
 } = useRegisterAgentCommands();

// select OS depending on the specified OS defined in the hook configuration
selectOS({
    name: 'name-OS',
    architecture: 'architecture-OS',
    extension: 'extension-OS',
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
interface IUseRegisterCommandsProps {
  osDefinitions?: IOSDefinition[];
  optionalParamsDefinitions?: tOptionalParams;
}
```

### Hook output

```ts
interface IUseRegisterCommandsOutput<T> {
  selectOS: (params: T) => void;
  setOptionalParams: (params: IOptionalParameters) => void;
  installCommand: string;
  startCommand: string;
  optionalParamsParsed: IOptionalParameters | {};
}
```

## Hook with Generic types

We can pass the types with the OS posibilities options and the optionals params defined.
And the hook will validate and show warning in compilation and development time.

#### Operating systems types example

```ts
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


// pass it to the hook and it will use the types when we are selecting the OS
const { 
  selectOS,
  setOptionalParams,
  installCommand,
  startCommand,
  optionalParamsParsed
 } = useRegisterAgentCommands<tOperatingSystem>();

// when the options are not valid depending on the types defined, the IDE will show a warning
selectOS({
    name: 'linux',
    architecture: 'x64',
    extension: 'rpm',
})

````

