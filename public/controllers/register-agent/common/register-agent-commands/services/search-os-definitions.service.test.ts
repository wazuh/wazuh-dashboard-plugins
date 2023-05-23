import { NoOSOptionFoundException, NoOptionFoundException } from '../exceptions';
import { OSDefinition } from '../types';
import {
    searchOSDefinitions,
    validateOSDefinitionHasDuplicatedOptions,
    validateOSDefinitionsDuplicated,
} from './search-os-definitions.service';

const mockedInstallCommand = (props: any) => 'install command mocked';
const mockedStartCommand = (props: any) => 'start command mocked';
const mockedUrlPackage = (props: any) => 'https://package-url.com';

const validOSDefinitions: OSDefinition[] = [
    {
        name: 'linux',
        options: [
            {
                extension: 'deb',
                architecture: 'x64',
                packageManager: 'aix',
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
                packageManager: 'aix',
                installCommand: mockedInstallCommand,
                startCommand: mockedStartCommand,
                urlPackage: mockedUrlPackage,
            }
        ]
    }
];

describe('search OS definitions services', () => {
    describe('searchOSDefinitions', () => {


        it('should return the OS definition if the OS name is found', () => {
                const result = searchOSDefinitions(validOSDefinitions, {
                        osName: 'linux',
                        architecture: 'x64',
                        extension: 'deb',
                        packageManager: 'aix',
                });
                expect(result).toMatchObject(validOSDefinitions[0].options[0])
        })

        it('should throw an error if the OS name is not found', () => {
                expect(() => searchOSDefinitions(validOSDefinitions, {
                        osName: 'invalid-os',
                        architecture: 'x64',
                        extension: 'deb',
                        packageManager: 'aix',
                })).toThrow(NoOSOptionFoundException);
        })

        it('should throw an error if the OS name is found but the architecture is not found', () => {
                expect(() => searchOSDefinitions(validOSDefinitions, {
                        osName: 'linux',
                        architecture: 'invalid-architecture',
                        extension: 'deb',
                        packageManager: 'aix',
                })).toThrow(NoOptionFoundException);
        })
    });

    describe('validateOSDefinitionsDuplicated', () => {
        it('should not throw an error if there are no duplicated OS definitions', () => {
            const osDefinitions: OSDefinition[] = [
                {
                    name: 'linux',
                    options: [
                        {
                            extension: 'deb',
                            architecture: 'x64',
                            packageManager: 'aix',
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
                            packageManager: 'aix',
                            installCommand: mockedInstallCommand,
                            startCommand: mockedStartCommand,
                            urlPackage: mockedUrlPackage,
                        },
                    ],
                },
            ];

            expect(() => validateOSDefinitionsDuplicated(osDefinitions)).not.toThrow();
        });

        it('should throw an error if there are duplicated OS definitions', () => {
            const osDefinition: OSDefinition = {
                name: 'linux',
                options: [
                    {
                        extension: 'deb',
                        architecture: 'x64',
                        packageManager: 'aix',
                        installCommand: mockedInstallCommand,
                        startCommand: mockedStartCommand,
                        urlPackage: mockedUrlPackage,
                    },
                ],
            };
            const osDefinitions: OSDefinition[] = [
                osDefinition,
                osDefinition,
            ];

            expect(() => validateOSDefinitionsDuplicated(osDefinitions)).toThrow();
        });

    });

    describe('validateOSDefinitionHasDuplicatedOptions', () => {

        it('should not throw an error if there are no duplicated OS definitions with different options', () => {
            expect(() => validateOSDefinitionHasDuplicatedOptions(validOSDefinitions)).not.toThrow();
        })

        it('should throw an error if there are duplicated OS definitions with different options', () => {
            const osDefinitions: OSDefinition[] = [
                {
                    name: 'linux',
                    options: [
                        {
                            extension: 'deb',
                            architecture: 'x64',
                            packageManager: 'aix',
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
                            packageManager: 'aix',
                            installCommand: mockedInstallCommand,
                            startCommand: mockedStartCommand,
                            urlPackage: mockedUrlPackage,
                        },
                        {
                            extension: 'deb',
                            architecture: 'x64',
                            packageManager: 'aix',
                            installCommand: mockedInstallCommand,
                            startCommand: mockedStartCommand,
                            urlPackage: mockedUrlPackage,
                        },
                    ],
                },
            ];

            expect(() => validateOSDefinitionHasDuplicatedOptions(osDefinitions)).toThrow();
        });
    });
});
