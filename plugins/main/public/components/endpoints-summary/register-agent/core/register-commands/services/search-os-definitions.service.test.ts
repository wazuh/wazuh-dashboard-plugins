import {
  NoOSOptionFoundException,
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

const validOSDefinitions: IOSDefinition<tOperatingSystem,tOptionalParamsNames>[] = [
  {
    name: 'linux',
    options: [
      {
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
      });
      expect(result).toMatchObject(validOSDefinitions[0].options[0]);
    });

    it('should throw an error if the OS name is not found', () => {
      expect(() =>
        searchOSDefinitions(validOSDefinitions, {
          // @ts-ignore
          name: 'invalid-os',
          architecture: 'x64',
        }),
      ).toThrow(NoOSOptionFoundException);
    });
    
  });

  describe('validateOSDefinitionsDuplicated', () => {
    it('should not throw an error if there are no duplicated OS definitions', () => {
      const osDefinitions: IOSDefinition<tOperatingSystem,tOptionalParamsNames>[] = [
        {
          name: 'linux',
          options: [
            {
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
              architecture: 'x64',
              installCommand: mockedInstallCommand,
              startCommand: mockedStartCommand,
              urlPackage: mockedUrlPackage,
            },
            {
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
