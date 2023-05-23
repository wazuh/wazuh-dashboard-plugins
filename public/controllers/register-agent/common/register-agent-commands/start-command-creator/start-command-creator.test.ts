import { StartCommandCreator } from './start-command-creator';
import { defaultPackageDefinitions } from '../definitions';
import { NoOSOptionFoundException, NoOptionFoundException } from '../exceptions';

describe('Start Command Creator', () => {

    it('should get the correct command for a given package definition', () => {
        const startCommandCreator = new StartCommandCreator(
            defaultPackageDefinitions,
            '4.4.2',
        );

        const expectedCommand = defaultPackageDefinitions[0].options[0].startCommand({
            extension: 'rpm',
            architecture: 'amd64',
            version: '4.4.2',
        })

        const command = startCommandCreator.getStartCommand(
            'linux',
            'amd64',
            'rpm',
            'yum',
        );

        expect(command).toEqual(expectedCommand);
    })

    it('should throw an error if no package definition is found for the given package extension', () => {
        const startCommandCreator = new StartCommandCreator(
            defaultPackageDefinitions,
            '4.4.2',
        );

        expect(() => {
            startCommandCreator.getStartCommand(
                'darwin',
                'amd64',
                'dmg',
                'open',
            );
        }).toThrow(NoOSOptionFoundException)
    })


    it('should throw an error if no package definition is found for the given OS', () => {
        const startCommandCreator = new StartCommandCreator(
            defaultPackageDefinitions,
            '4.4.2',
        );

        expect(() => {
            startCommandCreator.getStartCommand(
                'windows',
                'amd642',
                'msi',
                'msiexec',
            );
        }).toThrow(NoOptionFoundException)
    })

    it('should throw an error if no package definition is found for the given architecture', () => {
        const startCommandCreator = new StartCommandCreator(
            defaultPackageDefinitions,
            '4.4.2',
        );

        expect(() => {
            startCommandCreator.getStartCommand(
                'linux',
                'arm64',
                'deb',
                'apt-get',
            );
        }).toThrow(NoOptionFoundException)
    })


    it('should throw an error if no package definition is found for the given package manager', () => {
        const startCommandCreator = new StartCommandCreator(
            defaultPackageDefinitions,
            '4.4.2',
        );

        expect(() => {
            startCommandCreator.getStartCommand(
                'linux',
                'amd64',
                'rpm',
                'zypper',
            );
        }).toThrow(NoOptionFoundException)
    })

})