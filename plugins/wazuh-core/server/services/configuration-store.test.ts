import { ConfigurationStore } from './configuration-store';
import fs from 'fs';

function createMockLogger() {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    get: () => createMockLogger(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe(`[service] ConfigurationStore`, () => {
  // Create instance
  it.each`
    title                                               | file            | shouldThrowError
    ${'Give an error due to missing parameter of file'} | ${undefined}    | ${true}
    ${'Give an error due to missing parameter of file'} | ${''}           | ${true}
    ${'Create instance successful'}                     | ${'config.yml'} | ${false}
  `('$title', ({ file, shouldThrowError }) => {
    if (shouldThrowError) {
      expect(
        () =>
          new ConfigurationStore(createMockLogger(), {
            file,
            cache_seconds: 10,
          }),
      ).toThrow('File is not defined');
    } else {
      expect(
        () =>
          new ConfigurationStore(createMockLogger(), {
            file,
            cache_seconds: 10,
          }),
      ).not.toThrow();
    }
  });

  // Ensure the configuration file is created
  describe('Ensure the file is created', () => {
    it.each`
      title                                          | file            | createFile
      ${'Ensure the file is created'}                | ${'config.yml'} | ${false}
      ${'Ensure the file is created. Already exist'} | ${'config.yml'} | ${true}
    `('$title', ({ file, createFile }) => {
      const configurationStore = new ConfigurationStore(createMockLogger(), {
        file,
        cache_seconds: 10,
      });

      // Mock configuration
      configurationStore.setConfiguration({
        groupSettingsByCategory: () => [],
      });

      if (createFile) {
        fs.writeFileSync(configurationStore.file, '', { encoding: 'utf8' });
      }
      expect(fs.existsSync(configurationStore.file)).toBe(createFile);
      configurationStore.ensureConfigurationFileIsCreated();
      expect(fs.existsSync(configurationStore.file)).toBe(true);

      // Cleaning
      if (fs.existsSync(configurationStore.file)) {
        fs.unlinkSync(configurationStore.file);
      }
    });
  });

  // Update the configuration
  describe('Update the configuration', () => {
    it.each`
      title                         | updateSettings                      | prevContent                        | postContent
      ${'Update the configuration'} | ${{ key1: 'value' }}                | ${''}                              | ${'\nkey1: "value"'}
      ${'Update the configuration'} | ${{ key1: 'value' }}                | ${'key1: default'}                 | ${'key1: "value"'}
      ${'Update the configuration'} | ${{ key1: 1 }}                      | ${'key1: 0'}                       | ${'key1: 1'}
      ${'Update the configuration'} | ${{ key1: true }}                   | ${'key1: false'}                   | ${'key1: true'}
      ${'Update the configuration'} | ${{ key1: ['value'] }}              | ${'key1: ["default"]'}             | ${'key1: ["value"]'}
      ${'Update the configuration'} | ${{ key1: 'value' }}                | ${'key1: "default"\nkey2: 1'}      | ${'key1: "value"\nkey2: 1'}
      ${'Update the configuration'} | ${{ key2: 2 }}                      | ${'key1: "default"\nkey2: 1'}      | ${'key1: "default"\nkey2: 2'}
      ${'Update the configuration'} | ${{ key1: 'value', key2: 2 }}       | ${'key1: "default"\nkey2: 1'}      | ${'key1: "value"\nkey2: 2'}
      ${'Update the configuration'} | ${{ key1: ['value'] }}              | ${'key1: ["default"]\nkey2: 1'}    | ${'key1: ["value"]\nkey2: 1'}
      ${'Update the configuration'} | ${{ key1: ['value'], key2: false }} | ${'key1: ["default"]\nkey2: true'} | ${'key1: ["value"]\nkey2: false'}
    `('$title', async ({ prevContent, postContent, updateSettings }) => {
      const configurationStore = new ConfigurationStore(createMockLogger(), {
        file: 'config.yml',
        cache_seconds: 10,
      });

      // Mock configuration
      configurationStore.setConfiguration({
        groupSettingsByCategory: () => [],
        _settings: new Map([
          ['key1', { store: { file: { configurableManaged: true } } }],
          ['key2', { store: { file: { configurableManaged: true } } }],
        ]),
      });

      fs.writeFileSync(configurationStore.file, prevContent, {
        encoding: 'utf8',
      });

      await configurationStore.set(updateSettings);

      const content = fs.readFileSync(configurationStore.file, {
        encoding: 'utf8',
      });

      expect(content).toBe(postContent);

      // Cleaning
      if (fs.existsSync(configurationStore.file)) {
        fs.unlinkSync(configurationStore.file);
      }
    });
  });
});
