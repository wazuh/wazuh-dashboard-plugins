import { CommandCreator } from './command-creator';
import { IOSDefinition } from '../types';

describe('Command Creator', () => {
  it('should create an valid instance', () => {
    const osDefinitions: IOSDefinition[] = [
      {
        name: 'linux',
        options: [
          {
            architecture: 'x64',
            extension: 'deb',
            installCommand: props => '',
            startCommand: props => '',
            urlPackage: props => '',
          },
        ],
      },
      {
        name: 'windows',
        options: [
          {
            architecture: 'x64',
            extension: 'msi',
            installCommand: props => '',
            startCommand: props => '',
            urlPackage: props => '',
          },
        ],
      },
    ];

    const commandCreator = new CommandCreator(osDefinitions, {}, '4.4');
  });

  it('should return an ERROR when the os definitions received has a os with options duplicated', () => {});

  it('should return an ERROR when the os definitions received has a os with options duplicated', () => {});

  it('should return the install command for the os selected', () => {});

  it('should return the start command for the os selected', () => {});

  it('should return all the commands for the os selected', () => {});
});
