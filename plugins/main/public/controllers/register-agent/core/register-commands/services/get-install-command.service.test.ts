import { getInstallCommandByOS } from './get-install-command.service';
import { IOSCommandsDefinition, IOSDefinition, IOptionalParameters } from '../types';
import {
  NoInstallCommandDefinitionException,
  NoPackageURLDefinitionException,
  WazuhVersionUndefinedException,
} from '../exceptions';


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

export type tOperatingSystem = ILinuxOSTypes | IMacOSTypes | IWindowsOSTypes;


export type tOptionalParameters = 'server_address' | 'agent_name' | 'agent_group' | 'protocol' | 'wazuh_password' | 'another_optional_parameter';

const validOsDefinition: IOSCommandsDefinition<tOperatingSystem, tOptionalParameters> = {
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
      '4.4',
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
    // @ts-ignore
    const osDefinition: IOSCommandsDefinition<tOperatingSystem, tOptionalParameters> = {
      architecture: 'x64',
      startCommand: props => 'start command mocked',
      urlPackage: props => 'https://package-url.com',
    };
    try {
      getInstallCommandByOS(
        osDefinition,
        'https://package-url.com',
        '4.4',
        'linux',
      );
    } catch (error) {
      expect(error).toBeInstanceOf(NoInstallCommandDefinitionException);
    }
  });
  it('should return ERROR when the OS has no package url', () => {
    try {
      getInstallCommandByOS(validOsDefinition, '', '4.4', 'linux');
    } catch (error) {
      expect(error).toBeInstanceOf(NoPackageURLDefinitionException);
    }
  });

  it('should return install command with optional parameters', () => {
    const mockedInstall  = jest.fn();
    const validOsDefinition: IOSCommandsDefinition<tOperatingSystem, tOptionalParameters> = {
      architecture: 'x64',
      installCommand: mockedInstall,
      startCommand: props => 'start command mocked',
      urlPackage: props => 'https://package-url.com',
    };

    const optionalParams: IOptionalParameters<tOptionalParameters> = {
      agent_group: 'WAZUH_GROUP=agent_group',
      agent_name: 'WAZUH_NAME=agent_name',
      protocol: 'WAZUH_PROTOCOL=UDP',
      server_address: 'WAZUH_MANAGER=server_address',
      wazuh_password: 'WAZUH_PASSWORD=1231323',
      another_optional_parameter: 'params value'
    };

    getInstallCommandByOS(
      validOsDefinition,
      'https://package-url.com',
      '4.4',
      'linux',
      optionalParams
    );
    expect(mockedInstall).toBeCalledTimes(1);
    expect(mockedInstall).toBeCalledWith(expect.objectContaining({ optionals: optionalParams }));
  })
});
