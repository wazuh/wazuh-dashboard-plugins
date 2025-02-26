import { IOSDefinition, IOptionalParameters, TOptionalParams } from '../types';
import {
  DuplicatedOSException,
  DuplicatedOSOptionException,
  NoOSSelectedException,
  WazuhVersionUndefinedException,
} from '../exceptions';
import { CommandGenerator } from './command-generator';

const MOCKED_COMMAND_VALUE = 'mocked command';
const mockedCommandsResponse = jest.fn().mockReturnValue(MOCKED_COMMAND_VALUE);

// Defined OS combinations
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

// Defined Optional Parameters

export type TOptionalParameters =
  | 'server_address'
  | 'agent_name'
  | 'username'
  | 'password'
  | 'verificationMode'
  | 'communicationsAPIUrl'
  | 'enrollmentKey';

const osDefinitions: IOSDefinition<TOperatingSystem, TOptionalParameters>[] = [
  {
    name: 'linux',
    options: [
      {
        architecture: 'x64',
        installCommand: mockedCommandsResponse,
        startCommand: mockedCommandsResponse,
        urlPackage: mockedCommandsResponse,
      },
      {
        architecture: 'x86',
        installCommand: mockedCommandsResponse,
        startCommand: mockedCommandsResponse,
        urlPackage: mockedCommandsResponse,
      },
    ],
  },
];
const optionalParams: TOptionalParams<TOptionalParameters> = {
  server_address: {
    property: '--enroll-url',
    getParamCommand: props => `${props.property} '${props.value}'`,
  },
  agent_name: {
    property: '--name',
    getParamCommand: props => `${props.property} '${props.value}'`,
  },
  username: {
    property: '--user',
    getParamCommand: props => `${props.property} '${props.value}'`,
  },
  password: {
    property: '--password',
    getParamCommand: props => `${props.property} '${props.value}'`,
  },
  verificationMode: {
    property: '--verification-mode',
    getParamCommand: props => `${props.property} '${props.value}'`,
  },
  enrollmentKey: {
    property: '--key',
    getParamCommand: props => `${props.property} '${props.value}'`,
  },
  communicationsAPIUrl: {
    property: '--connect-url',
    getParamCommand: props => `${props.property} '${props.value}'`,
  },
};
const optionalValues: IOptionalParameters<TOptionalParameters> = {
  server_address: '',
  agent_name: '',
  username: '',
  password: '',
  verificationMode: '',
  enrollmentKey: '',
};

describe('Command Generator', () => {
  it('should create an valid instance', () => {
    const commandGenerator = new CommandGenerator(
      osDefinitions,
      optionalParams,
      '5.0',
    );

    expect(commandGenerator).toBeDefined();
  });

  it('should return the install command for the os selected', () => {
    const commandGenerator = new CommandGenerator(
      osDefinitions,
      optionalParams,
      '5.0',
    );

    commandGenerator.selectOS({
      name: 'linux',
      architecture: 'x64',
    });
    commandGenerator.addOptionalParams(optionalValues);

    const command = commandGenerator.getInstallCommand();

    expect(command).toBe(MOCKED_COMMAND_VALUE);
  });

  it('should return the start command for the os selected', () => {
    const commandGenerator = new CommandGenerator(
      osDefinitions,
      optionalParams,
      '5.0',
    );

    commandGenerator.selectOS({
      name: 'linux',
      architecture: 'x64',
    });
    commandGenerator.addOptionalParams(optionalValues);

    const command = commandGenerator.getStartCommand();

    expect(command).toBe(MOCKED_COMMAND_VALUE);
  });

  it('should return all the commands for the os selected', () => {
    const commandGenerator = new CommandGenerator(
      osDefinitions,
      optionalParams,
      '5.0',
    );

    commandGenerator.selectOS({
      name: 'linux',
      architecture: 'x64',
    });
    commandGenerator.addOptionalParams(optionalValues);

    const commands = commandGenerator.getAllCommands();

    expect(commands).toEqual({
      os: 'linux',
      architecture: 'x64',
      wazuhVersion: '5.0',
      install_command: MOCKED_COMMAND_VALUE,
      start_command: MOCKED_COMMAND_VALUE,
      url_package: MOCKED_COMMAND_VALUE,
      optionals: {},
    });
  });

  it('should return commands with the filled optional params', () => {
    const commandGenerator = new CommandGenerator(
      osDefinitions,
      optionalParams,
      '5.0',
    );
    const selectedOs: TOperatingSystem = {
      name: 'linux',
      architecture: 'x64',
    };

    commandGenerator.selectOS(selectedOs);

    const optionalValues = {
      server_address: 'https://10.10.10.121:55000',
      agent_name: 'agent1',
      username: 'user',
      password: '1234',
      verificationMode: 'none',
      enrollmentKey: '00000000000000000000000000000000',
      communicationsAPIUrl: 'https://comms:27000',
    };

    commandGenerator.addOptionalParams(optionalValues);

    const commands = commandGenerator.getAllCommands();

    expect(commands).toEqual({
      os: selectedOs.name,
      architecture: selectedOs.architecture,
      wazuhVersion: '5.0',
      install_command: MOCKED_COMMAND_VALUE,
      start_command: MOCKED_COMMAND_VALUE,
      url_package: MOCKED_COMMAND_VALUE,
      optionals: {
        server_address: optionalParams.server_address.getParamCommand({
          property: optionalParams.server_address.property,
          value: optionalValues.server_address,
          name: 'server_address',
        }),
        agent_name: optionalParams.agent_name.getParamCommand({
          property: optionalParams.agent_name.property,
          value: optionalValues.agent_name,
          name: 'agent_name',
        }),
        username: optionalParams.username.getParamCommand({
          property: optionalParams.username.property,
          value: optionalValues.username,
          name: 'username',
        }),
        password: optionalParams.password.getParamCommand({
          property: optionalParams.password.property,
          value: optionalValues.password,
          name: 'password',
        }),
        verificationMode: optionalParams.verificationMode.getParamCommand({
          property: optionalParams.verificationMode.property,
          value: optionalValues.verificationMode,
          name: 'verificationMode',
        }),
        enrollmentKey: optionalParams.enrollmentKey.getParamCommand({
          property: optionalParams.enrollmentKey.property,
          value: optionalValues.enrollmentKey,
          name: 'enrollmentKey',
        }),
        communicationsAPIUrl: optionalParams.enrollmentKey.getParamCommand({
          property: optionalParams.communicationsAPIUrl.property,
          value: optionalValues.communicationsAPIUrl,
          name: 'enrollmentKey',
        }),
      },
    });
  });

  it('should return an ERROR when the os definitions received has a os with options duplicated', () => {
    const osDefinitions: IOSDefinition<
      TOperatingSystem,
      TOptionalParameters
    >[] = [
      {
        name: 'linux',
        options: [
          {
            architecture: 'x64',
            installCommand: mockedCommandsResponse,
            startCommand: mockedCommandsResponse,
            urlPackage: mockedCommandsResponse,
          },
          {
            architecture: 'x64',
            installCommand: mockedCommandsResponse,
            startCommand: mockedCommandsResponse,
            urlPackage: mockedCommandsResponse,
          },
        ],
      },
    ];

    try {
      new CommandGenerator(osDefinitions, optionalParams, '5.0');
    } catch (error) {
      if (error instanceof Error) {
        expect(error).toBeInstanceOf(DuplicatedOSOptionException);
      }
    }
  });

  it('should return an ERROR when the os definitions received has a os with options duplicated', () => {
    const osDefinitions: IOSDefinition<
      TOperatingSystem,
      TOptionalParameters
    >[] = [
      {
        name: 'linux',
        options: [
          {
            architecture: 'x64',
            installCommand: mockedCommandsResponse,
            startCommand: mockedCommandsResponse,
            urlPackage: mockedCommandsResponse,
          },
        ],
      },
      {
        name: 'linux',
        options: [
          {
            architecture: 'x64',
            installCommand: mockedCommandsResponse,
            startCommand: mockedCommandsResponse,
            urlPackage: mockedCommandsResponse,
          },
        ],
      },
    ];

    try {
      new CommandGenerator(osDefinitions, optionalParams, '5.0');
    } catch (error) {
      if (error instanceof Error) {
        expect(error).toBeInstanceOf(DuplicatedOSException);
      }
    }
  });

  it('should return an ERROR when we want to get commands and the os is not selected', () => {
    const commandGenerator = new CommandGenerator(
      osDefinitions,
      optionalParams,
      '5.0',
    );

    try {
      commandGenerator.getAllCommands();
    } catch (error) {
      if (error instanceof Error) {
        expect(error).toBeInstanceOf(NoOSSelectedException);
      }
    }
  });

  it('should return an ERROR when we want to get the install command and the os is not selected', () => {
    const commandGenerator = new CommandGenerator(
      osDefinitions,
      optionalParams,
      '5.0',
    );

    try {
      commandGenerator.getInstallCommand();
    } catch (error) {
      if (error instanceof Error) {
        expect(error).toBeInstanceOf(NoOSSelectedException);
      }
    }
  });

  it('should return an ERROR when we want to get the start command and the os is not selected', () => {
    const commandGenerator = new CommandGenerator(
      osDefinitions,
      optionalParams,
      '5.0',
    );

    try {
      commandGenerator.getStartCommand();
    } catch (error) {
      if (error instanceof Error) {
        expect(error).toBeInstanceOf(NoOSSelectedException);
      }
    }
  });

  it('should return an ERROR when receive an empty version', () => {
    try {
      new CommandGenerator(osDefinitions, optionalParams, '');
    } catch (error) {
      if (error instanceof Error) {
        expect(error).toBeInstanceOf(WazuhVersionUndefinedException);
      }
    }
  });

  it('should receives the solved optional params when the install command is called', () => {
    const commandGenerator = new CommandGenerator(
      osDefinitions,
      optionalParams,
      '5.0',
    );
    const selectedOs: TOperatingSystem = {
      name: 'linux',
      architecture: 'x64',
    };

    commandGenerator.selectOS(selectedOs);

    const optionalValues = {
      server_address: 'wazuh-ip',
    };

    commandGenerator.addOptionalParams(
      optionalValues as IOptionalParameters<TOptionalParameters>,
    );
    commandGenerator.getInstallCommand();
    expect(mockedCommandsResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        optionals: {
          server_address: optionalParams.server_address.getParamCommand({
            property: optionalParams.server_address.property,
            value: optionalValues.server_address,
            name: 'server_address',
          }),
        },
      }),
    );
  });

  it('should receive the solved optional params when the start command is called', () => {
    const commandGenerator = new CommandGenerator(
      osDefinitions,
      optionalParams,
      '5.0',
    );
    const selectedOs: TOperatingSystem = {
      name: 'linux',
      architecture: 'x64',
    };

    commandGenerator.selectOS(selectedOs);

    const optionalValues = {
      server_address: 'wazuh-ip',
    };

    commandGenerator.addOptionalParams(
      optionalValues as IOptionalParameters<TOptionalParameters>,
    );
    commandGenerator.getStartCommand();
    expect(mockedCommandsResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        optionals: {
          server_address: optionalParams.server_address.getParamCommand({
            property: optionalParams.server_address.property,
            value: optionalValues.server_address,
            name: 'server_address',
          }),
        },
      }),
    );
  });
});
