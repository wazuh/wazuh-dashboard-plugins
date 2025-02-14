import {
  IOSCommandsDefinition,
  IOSDefinition,
  IOptionalParameters,
} from '../types';
import {
  NoInstallCommandDefinitionException,
  NoPackageURLDefinitionException,
  WazuhVersionUndefinedException,
} from '../exceptions';
import { getInstallCommandByOS } from './get-install-command.service';

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

export type TOptionalParameters =
  | 'server_address'
  | 'agent_name'
  | 'username'
  | 'password'
  | 'verificationMode'
  | 'enrollmentKey'
  | 'another_optional_parameter';

const validOsDefinition: IOSCommandsDefinition<
  TOperatingSystem,
  TOptionalParameters
> = {
  architecture: 'x64',
  installCommand: props => 'install command mocked',
  startCommand: props => 'start command mocked',
  urlPackage: props => 'https://package-url.com',
};

describe('getInstallCommandByOS', () => {
  it('should return the correct install command for each OS', () => {
    const installCommand = getInstallCommandByOS(
      validOsDefinition,
      'https://package-url.com',
      '5.0',
      'linux',
    );

    expect(installCommand).toBe('install command mocked');
  });

  it('should return ERROR when the version is not received', () => {
    try {
      getInstallCommandByOS(
        validOsDefinition,
        'https://package-url.com',
        '',
        'linux',
      );
    } catch (error) {
      expect(error).toBeInstanceOf(WazuhVersionUndefinedException);
    }
  });
  it('should return ERROR when the OS has no install command', () => {
    const osDefinition: IOSCommandsDefinition<
      TOperatingSystem,
      TOptionalParameters
    > = {
      architecture: 'x64',
      startCommand: props => 'start command mocked',
      urlPackage: props => 'https://package-url.com',
    };

    try {
      getInstallCommandByOS(
        osDefinition,
        'https://package-url.com',
        '5.0',
        'linux',
      );
    } catch (error) {
      expect(error).toBeInstanceOf(NoInstallCommandDefinitionException);
    }
  });
  it('should return ERROR when the OS has no package url', () => {
    try {
      getInstallCommandByOS(validOsDefinition, '', '5.0', 'linux');
    } catch (error) {
      expect(error).toBeInstanceOf(NoPackageURLDefinitionException);
    }
  });

  it('should return install command with optional parameters', () => {
    const mockedInstall = jest.fn();
    const validOsDefinition: IOSCommandsDefinition<
      TOperatingSystem,
      TOptionalParameters
    > = {
      architecture: 'x64',
      installCommand: mockedInstall,
      startCommand: props => 'start command mocked',
      urlPackage: props => 'https://package-url.com',
    };
    const optionalParams: IOptionalParameters<TOptionalParameters> = {
      username: "--user 'user'",
      agent_name: "--name 'agent_name'",
      server_address: "--url 'server_address'",
      password: "--password '1231323'",
      verificationMode: "--verification-mode '1231323'",
      enrollmentKey: "--key '1231323'",
      another_optional_parameter: 'params value',
    };

    getInstallCommandByOS(
      validOsDefinition,
      'https://package-url.com',
      '5.0',
      'linux',
      optionalParams,
    );
    expect(mockedInstall).toBeCalledTimes(1);
    expect(mockedInstall).toBeCalledWith(
      expect.objectContaining({ optionals: optionalParams }),
    );
  });
});
