import { InstallCommandConstructor } from './install-command-constructor';
import { defaultPackageDefinitions } from '../definitions';


describe('InstallCommandConstructor', () => {
    describe('constructor', () => {
        it('should create an instance of InstallCommandConstructor', () => {
            const installCommandConstructor = new InstallCommandConstructor(defaultPackageDefinitions, '4.4.2');
            expect(installCommandConstructor).toBeInstanceOf(InstallCommandConstructor);
        });
    });

    describe('get install command', () => {
        it('should get the correct command for a given package definition', () => {
            const installCommandConstructor = new InstallCommandConstructor(defaultPackageDefinitions, '4.4.2');
            const expectedCommand = `sudo yum install -y https://package-url.com`;
            const command = installCommandConstructor.getInstallCommand("linux", "amd64", "rpm", "yum", "https://package-url.com")
            expect(command).toEqual(expectedCommand);
        });

        it('should throw an error if the package definition is not found', () => {
            const installCommandConstructor = new InstallCommandConstructor(defaultPackageDefinitions, '4.4.2');
            expect(() => {
                installCommandConstructor.getInstallCommand("invalid-os", "amd64", "rpm", "yum", "https://package-url.com")
            }).toThrowError('Package definition not found for os: invalid-os, arch: amd64, packageType: rpm, packageManager: yum');
        });

        it('should throw an error if the package manager is not supported', () => {
            const installCommandConstructor = new InstallCommandConstructor(defaultPackageDefinitions, '4.4.2');
            expect(() => {
                installCommandConstructor.getInstallCommand("linux", "amd64", "rpm", "invalid-package-manager", "https://package-url.com")
            }).toThrowError('Package manager not supported: invalid-package-manager');
        });

        it('should throw an error if the package type is not supported', () => {
            const installCommandConstructor = new InstallCommandConstructor(defaultPackageDefinitions, '4.4.2');
            expect(() => {
                installCommandConstructor.getInstallCommand("linux", "amd64", "invalid-package-type", "yum", "https://package-url.com")
            }).toThrowError('Package type not supported: invalid-package-type');
        });

        it('should throw an error if the package definition is missing the packageUrl', () => {
            const installCommandConstructor = new InstallCommandConstructor(defaultPackageDefinitions, '4.4.2');
            expect(() => {
                installCommandConstructor.getInstallCommand("linux", "amd64", "rpm", "yum", "")
            }).toThrowError('Package definition is missing packageUrl');
        });
    });
});
