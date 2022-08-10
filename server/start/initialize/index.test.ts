import fs from 'fs';
import md5 from 'md5';
import { execSync } from 'child_process';
import path from 'path';
import { jobInitializeRun } from './index';
import { createDataDirectoryIfNotExists, createDirectoryIfNotExists } from '../../lib/filesystem';
import { WAZUH_DATA_ABSOLUTE_PATH, WAZUH_DATA_CONFIG_DIRECTORY_PATH, WAZUH_DATA_CONFIG_REGISTRY_PATH } from '../../../common/constants';
import packageInfo from '../../../package.json';

function mockContextCreator(loggerLevel: string) {
  const logs = [];
  const levels = ['debug', 'info', 'warn', 'error'];

  function createLogger(level: string) {
    return jest.fn(function (message: string) {
      const levelLogIncluded: number = levels.findIndex((level) => level === loggerLevel);
      levelLogIncluded > -1
        && levels.slice(levelLogIncluded).includes(level)
        && logs.push({ level, message });
    });
  };

  const ctx = {
    wazuh: {
      logger: {
        info: createLogger('info'),
        warn: createLogger('warn'),
        error: createLogger('error'),
        debug: createLogger('debug')
      },
    },
    server: {
        config: {
            kibana: {
                index: '.kibana'
            }
        }
    },
    core: {
        elasticsearch: {
            client: {
                asInternalUser: {
                    indices: {
                        exists: jest.fn(() => ({body: true}))
                    }
                }
            }
        }
    },
    /* Mocked logs getter. It is only for testing purpose.*/
    _getLogs(logLevel: string) {
      return logLevel ? logs.filter(({ level }) => level === logLevel) : logs;
    }
  }
  return ctx;
};

jest.mock('../../lib/logger', () => ({
  log: jest.fn()
}));

jest.mock('../../lib/get-configuration', () => ({
    getConfiguration: () => ({pattern: 'wazuh-alerts-*'})
}));

beforeAll(() => {
  // Create <PLUGIN_PLATFORM_PATH>/data/wazuh directory.
  createDataDirectoryIfNotExists();
  // Create <PLUGIN_PLATFORM_PATH>/data/wazuh/config directory.
  createDirectoryIfNotExists(WAZUH_DATA_CONFIG_DIRECTORY_PATH);
});

afterAll(() => {
  // Remove <PLUGIN_PLATFORM_PATH>/data/wazuh directory.
  execSync(`rm -rf ${WAZUH_DATA_ABSOLUTE_PATH}`);
});

describe("[initialize] `wazuh-registry.json` not created", () => {
    let mockContext = mockContextCreator('debug');
    afterEach(() => {
        // Remove <PLUGIN_PLATFORM_PATH>/data/wazuh/config/wazuh-registry file.
        execSync(`rm ${WAZUH_DATA_ABSOLUTE_PATH}/config/wazuh-registry.json || echo ""`);
    });

  it("Create registry file with plugin data and empty hosts", async () => {
    // Migrate the directories
    await jobInitializeRun(mockContext);
    const contentRegistry = JSON.parse(fs.readFileSync(WAZUH_DATA_CONFIG_REGISTRY_PATH, 'utf8'));
    
    expect(contentRegistry.name).toMatch('Wazuh App');
    expect(contentRegistry['app-version']).toMatch(packageInfo.version);
    expect(contentRegistry['revision']).toMatch(packageInfo.revision);
    expect(typeof contentRegistry.installationDate).toBe('string');
    expect(typeof contentRegistry.lastRestart).toBe('string');
    expect(Object.keys(contentRegistry.hosts)).toHaveLength(0);
  });
});

describe("[initialize] `wazuh-registry.json` created", () => {
    let testID = 0;
    const contentRegistryFile = [
        {
          before: {
              name: 'Wazuh App',
              'app-version': packageInfo.version,
              revision: packageInfo.revision,
              installationDate: '2022-07-25T13:55:04.363Z',
              lastRestart: '2022-07-25T13:55:04.363Z',
              hosts: {}
          },
          after: {
              name: 'Wazuh App',
              'app-version': packageInfo.version,
              revision: packageInfo.revision,
              installationDate: '2022-07-25T13:55:04.363Z',
              lastRestart: '2022-07-25T13:55:04.363Z',
              hosts: {}
          }
        },
        {
          before: {
              name: 'Wazuh App',
              'app-version': '0.0.0',
              revision: '0',
              installationDate: '2022-07-25T13:55:04.363Z',
              lastRestart: '2022-07-25T13:55:04.363Z',
              hosts: {}
          },
          after: {
              name: 'Wazuh App',
              'app-version': packageInfo.version,
              revision: packageInfo.revision,
              installationDate: '2022-07-25T13:55:04.363Z',
              lastRestart: '2022-07-25T13:55:04.363Z',
              hosts: {}
          }
        },
        {
          before: {
              name: 'Wazuh App',
              'app-version': '0.0.0',
              revision: '0',
              installationDate: '2022-07-25T13:55:04.363Z',
              lastRestart: '2022-07-25T13:55:04.363Z',
              hosts: {
                default: {
                  extensions: {
                    pci: true,
                    gdpr: true,
                    hipaa: true,
                    nist: true,
                    tsc: true,
                    audit: true,
                    oscap: false,
                    ciscat: false,
                    aws: false,
                    office: false,
                    github: false,
                    gcp: false,
                    virustotal: false,
                    osquery: false,
                    docker: false
                  }
                }
              }
          },
          after: {
              name: 'Wazuh App',
              'app-version': packageInfo.version,
              revision: packageInfo.revision,
              installationDate: '2022-07-25T13:55:04.363Z',
              lastRestart: '2022-07-25T13:55:04.363Z',
              hosts: {
                default: {
                  extensions: {
                    pci: true,
                    gdpr: true,
                    hipaa: true,
                    nist: true,
                    tsc: true,
                    audit: true,
                    oscap: false,
                    ciscat: false,
                    aws: false,
                    office: false,
                    github: false,
                    gcp: false,
                    virustotal: false,
                    osquery: false,
                    docker: false
                  }
                }
              }
          }
        },
        {
          before: {
              name: 'Wazuh App',
              'app-version': '0.0.0',
              revision: '0',
              installationDate: '2022-07-25T13:55:04.363Z',
              lastRestart: '2022-07-25T13:55:04.363Z',
              hosts: {
                default: {
                  extensions: {
                    pci: true,
                    gdpr: true,
                    hipaa: true,
                    nist: true,
                    tsc: true,
                    audit: true,
                    oscap: false,
                    ciscat: false,
                    aws: true,
                    office: true,
                    github: true,
                    gcp: true,
                    virustotal: false,
                    osquery: false
                  }
                }
              }
          },
          after: {
              name: 'Wazuh App',
              'app-version': packageInfo.version,
              revision: packageInfo.revision,
              installationDate: '2022-07-25T13:55:04.363Z',
              lastRestart: '2022-07-25T13:55:04.363Z',
              hosts: {
                default: {
                  extensions: {
                    pci: true,
                    gdpr: true,
                    hipaa: true,
                    nist: true,
                    tsc: true,
                    audit: true,
                    oscap: false,
                    ciscat: false,
                    aws: true,
                    office: true,
                    github: true,
                    gcp: true,
                    virustotal: false,
                    osquery: false,
                    docker: false
                  }
                }
              }
          }
        },
        {
          before: {
              name: 'Wazuh App',
              'app-version': '0.0.0',
              revision: '0',
              installationDate: '2022-07-25T13:55:04.363Z',
              lastRestart: '2022-07-25T13:55:04.363Z',
              hosts: {
                default: {
                  extensions: {
                    pci: true,
                    gdpr: true,
                    hipaa: true,
                    nist: true,
                    tsc: true,
                    audit: true,
                    oscap: false,
                    ciscat: false,
                    aws: true,
                    gcp: true,
                    virustotal: false,
                    osquery: false
                  }
                }
              }
          },
          after: {
              name: 'Wazuh App',
              'app-version': packageInfo.version,
              revision: packageInfo.revision,
              installationDate: '2022-07-25T13:55:04.363Z',
              lastRestart: '2022-07-25T13:55:04.363Z',
              hosts: {
                default: {
                  extensions: {
                    pci: true,
                    gdpr: true,
                    hipaa: true,
                    nist: true,
                    tsc: true,
                    audit: true,
                    oscap: false,
                    ciscat: false,
                    aws: true,
                    office: false,
                    github: false,
                    gcp: true,
                    virustotal: false,
                    osquery: false,
                    docker: false
                  }
                }
              }
          }
        },
    ];

    beforeEach(() => {
        // Remove <PLUGIN_PLATFORM_PATH>/data/wazuh/config/wazuh-registry.json.
        execSync(`rm ${WAZUH_DATA_ABSOLUTE_PATH}/config/wazuh-registry.json || echo ""`);
        // Create the wazuh-registry.json file.
        fs.writeFileSync(WAZUH_DATA_CONFIG_REGISTRY_PATH, JSON.stringify(contentRegistryFile[testID].before), 'utf8');
        testID++;
    });
    
    it.each`
        titleTest                                                                                                     | contentRegistryFile
        ${'Registry file is not rebuilt due version and revision match'}                                              | ${JSON.stringify(contentRegistryFile[0].after)}
        ${'Registry file is rebuilt due to version/revision changed'}                                                 | ${JSON.stringify(contentRegistryFile[1].after)}
        ${'Registry file is rebuilt due to version/revision changed and keeps the extensions (no modified)'}          | ${JSON.stringify(contentRegistryFile[2].after)}
        ${'Registry file is rebuilt due to version/revision changed and keeps the extensions (modified)'}             | ${JSON.stringify(contentRegistryFile[3].after)}
        ${'Registry file is rebuilt due to version/revision changed and adds missing extensions with default values'} | ${JSON.stringify(contentRegistryFile[4].after)}
    `(`$titleTest:
      content: $contentRegistryFile`, async ({ contentRegistryFile: content }) => {
      const mockContext = mockContextCreator('debug');
      
      const contentRegistryExpected = JSON.parse(content);
      await jobInitializeRun(mockContext);
      const contentRegistryFile = JSON.parse(fs.readFileSync(WAZUH_DATA_CONFIG_REGISTRY_PATH, 'utf8'));
      
      expect(contentRegistryFile.name).toMatch('Wazuh App');
      expect(contentRegistryFile['app-version']).toMatch(contentRegistryExpected['app-version']);
      expect(contentRegistryFile['revision']).toMatch(contentRegistryExpected.revision);
      expect(typeof contentRegistryFile.installationDate).toBe('string');
      expect(typeof contentRegistryFile.lastRestart).toBe('string');
      expect(Object.keys(contentRegistryFile.hosts)).toHaveLength(Object.keys(contentRegistryExpected.hosts).length);

      if ( Object.keys(contentRegistryFile.hosts).length ){
        Object.entries(contentRegistryFile.hosts).forEach(([hostID, hostData]) => {
          if(hostData.extensions){
            Object.entries(hostData.extensions).forEach(([extensionID, extensionEnabled]) => {
              expect(extensionEnabled).toBe(contentRegistryExpected.hosts[hostID].extensions[extensionID])
            });
          };
        });
      };
    });
  });
