import { InstallCommandCreator } from './install-command-creator';
import { defaultPackageDefinitions } from '../definitions';
import {
  NoOSOptionFoundException,
  NoOptionFoundException,
  NoPackageURLDefinitionException,
} from '../exceptions';

describe('InstallCommandCreator', () => {
  describe('get install command', () => {

    it('should create an instance of InstallCommandCreator', () => {
      const installCommandCreator = new InstallCommandCreator(
        defaultPackageDefinitions,
        '4.4.2',
      );
      expect(installCommandCreator).toBeInstanceOf(InstallCommandCreator);
    });
    
    it('should get the correct command for a given package definition', () => {
      const installCommandCreator = new InstallCommandCreator(
        defaultPackageDefinitions,
        '4.4.2',
      );
      const expectedCommand = `sudo yum install -y https://package-url.com`;
      const command = installCommandCreator.getInstallCommand(
        'linux',
        'amd64',
        'rpm',
        'yum',
        'https://package-url.com',
      );
      expect(command).toEqual(expectedCommand);
    });

    it('should throw an error if the package definition is not found', () => {
      const installCommandCreator = new InstallCommandCreator(
        defaultPackageDefinitions,
        '4.4.2',
      );
      expect(() => {
        installCommandCreator.getInstallCommand(
          'invalid-os',
          'amd64',
          'rpm',
          'yum',
          'https://package-url.com',
        );
      }).toThrow(NoOSOptionFoundException);
    });

    it('should throw an error if the package manager is not supported', () => {
      const installCommandCreator = new InstallCommandCreator(
        defaultPackageDefinitions,
        '4.4.2',
      );
      expect(() => {
        installCommandCreator.getInstallCommand(
          'linux',
          'amd64',
          'rpm',
          'invalid-package-manager',
          'https://package-url.com',
        );
      }).toThrow(NoOptionFoundException);
    });

    it('should throw an error if the package type is not supported', () => {
      const installCommandCreator = new InstallCommandCreator(
        defaultPackageDefinitions,
        '4.4.2',
      );
      expect(() => {
        installCommandCreator.getInstallCommand(
          'linux',
          'amd64',
          'invalid-package-type',
          'yum',
          'https://package-url.com',
        );
      }).toThrow(NoOptionFoundException);
    });

    it('should throw an error if the package definition is missing the packageUrl', () => {
      const installCommandCreator = new InstallCommandCreator(
        defaultPackageDefinitions,
        '4.4.2',
      );
      expect(() => {
        installCommandCreator.getInstallCommand(
          'linux',
          'amd64',
          'rpm',
          'yum',
          '',
        );
      }).toThrow(NoPackageURLDefinitionException);
    });
  });
});
