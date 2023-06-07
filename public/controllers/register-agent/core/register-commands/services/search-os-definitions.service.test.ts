import {
  NoOSOptionFoundException,
  NoOptionFoundException,
} from '../exceptions';
import { IOSDefinition } from '../types';
import {
  searchOSDefinitions,
  validateOSDefinitionHasDuplicatedOptions,
  validateOSDefinitionsDuplicated,
} from './search-os-definitions.service';

const mockedInstallCommand = (props: any) => 'install command mocked';
const mockedStartCommand = (props: any) => 'start command mocked';
const mockedUrlPackage = (props: any) => 'https://package-url.com';

type tOptionalParamsNames = 'optional1' | 'optional2';

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

const validOSDefinitions: IOSDefinition<tOperatingSystem,tOptionalParamsNames>[] = [
  {
    name: 'linux',
    options: [
      {
        extension: 'deb',
        architecture: 'x64',
        installCommand: mockedInstallCommand,
        startCommand: mockedStartCommand,
        urlPackage: mockedUrlPackage,
      },
    ],
  },
  {
    name: 'windows',
    options: [
      {
        extension: 'msi',
        architecture: 'x64',
        installCommand: mockedInstallCommand,
        startCommand: mockedStartCommand,
        urlPackage: mockedUrlPackage,
      },
    ],
  },
];

describe('search OS definitions services', () => {
  describe('searchOSDefinitions', () => {
    it('should return the OS definition if the OS name is found', () => {
      const result = searchOSDefinitions(validOSDefinitions, {
        name: 'linux',
        architecture: 'x64',
        extension: 'deb',
      });
      expect(result).toMatchObject(validOSDefinitions[0].options[0]);
    });

    it('should throw an error if the OS name is not found', () => {
      expect(() =>
        searchOSDefinitions(validOSDefinitions, {
          // @ts-ignore
          name: 'invalid-os',
          architecture: 'x64',
          extension: 'deb',
        }),
      ).toThrow(NoOSOptionFoundException);
    });

    it('should throw an error if the OS name is found but the architecture is not found', () => {
      expect(() =>
        searchOSDefinitions(validOSDefinitions, {
          name: 'linux',
          architecture: 'invalid-architecture',
          extension: 'deb',
        }),
      ).toThrow(NoOptionFoundException);
    });
  });

  describe('validateOSDefinitionsDuplicated', () => {
    it('should not throw an error if there are no duplicated OS definitions', () => {
      const osDefinitions: IOSDefinition<tOperatingSystem,tOptionalParamsNames>[] = [
        {
          name: 'linux',
          options: [
            {
              extension: 'deb',
              architecture: 'x64',
              installCommand: mockedInstallCommand,
              startCommand: mockedStartCommand,
              urlPackage: mockedUrlPackage,
            },
          ],
        },
        {
          name: 'windows',
          options: [
            {
              extension: 'msi',
              architecture: 'x64',
              installCommand: mockedInstallCommand,
              startCommand: mockedStartCommand,
              urlPackage: mockedUrlPackage,
            },
          ],
        },
      ];

      expect(() =>
        validateOSDefinitionsDuplicated(osDefinitions),
      ).not.toThrow();
    });

    it('should throw an error if there are duplicated OS definitions', () => {
      const osDefinition: IOSDefinition<tOperatingSystem,tOptionalParamsNames> = {
        name: 'linux',
        options: [
          {
            extension: 'deb',
            architecture: 'x64',
            // @ts-ignore
            packageManager: 'aix',
            installCommand: mockedInstallCommand,
            startCommand: mockedStartCommand,
            urlPackage: mockedUrlPackage,
          },
        ],
      };
      const osDefinitions: IOSDefinition<tOperatingSystem,tOptionalParamsNames>[] = [osDefinition, osDefinition];

      expect(() => validateOSDefinitionsDuplicated(osDefinitions)).toThrow();
    });
  });

  describe('validateOSDefinitionHasDuplicatedOptions', () => {
    it('should not throw an error if there are no duplicated OS definitions with different options', () => {
      expect(() =>
        validateOSDefinitionHasDuplicatedOptions(validOSDefinitions),
      ).not.toThrow();
    });

    it('should throw an error if there are duplicated OS definitions with different options', () => {
      const osDefinitions: IOSDefinition<tOperatingSystem,tOptionalParamsNames>[] = [
        {
          name: 'linux',
          options: [
            {
              extension: 'deb',
              architecture: 'x64',
              installCommand: mockedInstallCommand,
              startCommand: mockedStartCommand,
              urlPackage: mockedUrlPackage,
            },
          ],
        },
        {
          name: 'linux',
          options: [
            {
              extension: 'deb',
              architecture: 'x64',
              installCommand: mockedInstallCommand,
              startCommand: mockedStartCommand,
              urlPackage: mockedUrlPackage,
            },
            {
              extension: 'deb',
              architecture: 'x64',
              installCommand: mockedInstallCommand,
              startCommand: mockedStartCommand,
              urlPackage: mockedUrlPackage,
            },
          ],
        },
      ];

      expect(() =>
        validateOSDefinitionHasDuplicatedOptions(osDefinitions),
      ).toThrow();
    });
  });
});
