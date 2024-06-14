import { Configuration } from './configuration';

// No operation
const noop = () => {};

const mockLogger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};

function createMockConfigurationStore() {
  return {
    setConfiguration(configuration) {
      this.configuration = configuration;
    },
    _config: {},
    set(settings) {
      this._config = {
        ...this._config,
        ...settings,
      };
      return settings || {};
    },
    get(...settings: string[]) {
      return Object.fromEntries(
        Object.entries(this._config)
          .filter(([key]) => (settings.length ? settings.includes(key) : true))
          .map(([key, value]) => [key, value]),
      );
    },
    clear(...settings: string[]) {
      (settings.length ? settings : Object.keys(this._config)).forEach(
        key =>
          typeof this._config[key] !== 'undefined' && delete this._config[key],
      );
      return settings;
    },
  };
}

const settingsSuite = {
  0: [
    [
      'text',
      {
        type: 'text',
        defaultValue: 'test',
      },
    ],
    [
      'number',
      {
        type: 'number',
        defaultValue: 1,
      },
    ],
  ],
  1: [
    [
      'text',
      {
        type: 'text',
        defaultValue: 'test',
      },
    ],
    [
      'text',
      {
        type: 'text',
        defaultValue: 'test2',
        _test_meta: {
          failOnRegister: true,
        },
      },
    ],
  ],
  1: [
    [
      'text',
      {
        type: 'text',
        defaultValue: 'test',
      },
    ],
    [
      'text',
      {
        type: 'text',
        defaultValue: 'test2',
        _test_meta: {
          failOnRegister: true,
        },
      },
    ],
    [
      'text',
      {
        type: 'text',
        defaultValue: 'test3',
        _test_meta: {
          failOnRegister: true,
        },
      },
    ],
  ],
  2: [
    [
      'text1',
      {
        type: 'text',
        defaultValue: 'defaultValue1',
      },
    ],
    [
      'text2',
      {
        type: 'text',
        defaultValue: 'defaultValue2',
      },
    ],
  ],
};

describe('Configuration service', () => {
  it.each`
    settings
    ${settingsSuite[0]}
    ${settingsSuite[1]}
  `(
    `settings are registered or throwing errors if they are registered previously`,
    ({ settings }) => {
      const configurationStore = createMockConfigurationStore();
      const configuration = new Configuration(mockLogger, configurationStore);

      settings.forEach(([key, value]) => {
        if (value?._test_meta?.failOnRegister) {
          expect(() => configuration.register(key, value)).toThrow(
            `Setting ${key} exists`,
          );
        } else {
          configuration.register(key, value);
          expect(configuration._settings.get(key) === value).toBeTruthy();
        }
      });
    },
  );

  it.each`
    title                                                           | settings
    ${'get setting defaultValue1'}                                  | ${[{ key: 'text1', value: 'defaultValue1', store: undefined }]}
    ${'get setting defaultValue2'}                                  | ${[{ key: 'text2', value: 'defaultValue2', store: undefined }]}
    ${'get multiple settings combining without stored values'}      | ${[{ key: 'text1', value: 'defaultValue1', store: undefined }, { key: 'text2', value: 'defaultValue2', store: undefined }]}
    ${'get multiple settings combining stored values and defaults'} | ${[{ key: 'text1', value: 'defaultValue1', store: undefined }, { key: 'text2', value: 'storedValue', store: 'storedValue' }]}
  `('$title ', async ({ settings }) => {
    const configurationStore = createMockConfigurationStore();
    const configuration = new Configuration(mockLogger, configurationStore);

    settingsSuite[2].forEach(([key, value]) =>
      configuration.register(key, value),
    );

    // Redefine the stored value
    configurationStore._config = settings.reduce(
      (accum, { key, store }) => ({
        ...accum,
        ...(store ? { [key]: store } : {}),
      }),
      {},
    );

    if (settings.length === 1) {
      // Get a setting
      const { key, value } = settings[0];
      expect(await configuration.get(key)).toBe(value);
    } else if (settings.length > 1) {
      // Get more than one setting
      expect(
        await configuration.get(...settings.map(({ key }) => key)),
      ).toEqual(
        settings.reduce(
          (accum, { key, value }) => ({ ...accum, [key]: value }),
          {},
        ),
      );
    }
  });

  it.each`
    title | settings
    ${'set setting storedValue1'} | ${[{
    key: 'text1',
    initialValue: 'defaultValue1',
    finalValue: 'storedValue1',
    store: 'storedValue1',
  }, {
    key: 'text2',
    initialValue: 'defaultValue2',
    finalValue: 'defaultValue2',
    store: undefined,
  }]}
  `(
    'register setting, set the stored values and check each modified setting has the expected value',
    async ({ settings }) => {
      const configurationStore = createMockConfigurationStore();
      const configuration = new Configuration(mockLogger, configurationStore);

      settingsSuite[2].forEach(([key, value]) => {
        configuration.register(key, value);
      });

      settings.forEach(async ({ key, initialValue }) => {
        expect(await configuration.get(key)).toBe(initialValue);
      });

      const storeNewConfiguration = Object.fromEntries(
        settings
          .filter(({ store }) => store)
          .map(({ key, store }) => [key, store]),
      );

      await configuration.set(storeNewConfiguration);

      settings.forEach(async ({ key, finalValue }) => {
        expect(await configuration.get(key)).toBe(finalValue);
      });
    },
  );

  it.each`
    title | settings
    ${'clean all settings'} | ${[{
    key: 'text1',
    initialValue: 'defaultValue1',
    afterSetValue: 'storedValue1',
    afterCleanValue: 'defaultValue1',
    store: 'storedValue1',
    clear: true,
  }, {
    key: 'text2',
    initialValue: 'defaultValue2',
    afterSetValue: 'defaultValue2',
    afterCleanValue: 'defaultValue1',
    store: undefined,
    clear: false,
  }]}
  `(
    'register setting, set the stored values, check each modified setting has the expected value and clear someone values and check again the setting value',
    async ({ settings }) => {
      const configurationStore = createMockConfigurationStore();
      const configuration = new Configuration(mockLogger, configurationStore);

      settingsSuite[2].forEach(([key, value]) => {
        configuration.register(key, value);
      });

      settings.forEach(async ({ key, initialValue }) => {
        expect(await configuration.get(key)).toBe(initialValue);
      });

      const storeNewConfiguration = Object.fromEntries(
        settings
          .filter(({ store }) => store)
          .map(({ key, store }) => [key, store]),
      );

      await configuration.set(storeNewConfiguration);

      settings.forEach(async ({ key, afterSetValue }) => {
        expect(await configuration.get(key)).toBe(afterSetValue);
      });

      const cleanSettings = settings
        .filter(({ clear }) => clear)
        .map(({ key }) => key);

      await configuration.clear(cleanSettings);
    },
  );

  it.each`
    title | settings | clearSpecificSettings
    ${'clean all settings'} | ${[{
    key: 'text1',
    initialValue: 'defaultValue1',
    afterSetValue: 'storedValue1',
    afterCleanValue: 'defaultValue1',
    store: 'storedValue1',
    clear: true,
  }, {
    key: 'text2',
    initialValue: 'defaultValue2',
    afterSetValue: 'defaultValue2',
    afterCleanValue: 'defaultValue2',
    store: undefined,
    clear: false,
  }]} | ${true}
    ${'clean all settings'} | ${[{
    key: 'text1',
    initialValue: 'defaultValue1',
    afterSetValue: 'storedValue1',
    afterCleanValue: 'defaultValue1',
    store: 'storedValue1',
    clear: true,
  }, {
    key: 'text2',
    initialValue: 'defaultValue2',
    afterSetValue: 'defaultValue2',
    afterCleanValue: 'defaultValue2',
    store: undefined,
    clear: false,
  }]} | ${false}
  `(
    'register setting, set the stored values, check each modified setting has the expected value and clear someone values and check again the setting value',
    async ({ settings, clearSpecificSettings }) => {
      const configurationStore = createMockConfigurationStore();
      const configuration = new Configuration(mockLogger, configurationStore);

      settingsSuite[2].forEach(([key, value]) => {
        configuration.register(key, value);
      });

      settings.forEach(async ({ key, initialValue }) => {
        expect(await configuration.get(key)).toBe(initialValue);
      });

      const storeNewConfiguration = Object.fromEntries(
        settings
          .filter(({ store }) => store)
          .map(({ key, store }) => [key, store]),
      );

      await configuration.set(storeNewConfiguration);

      settings.forEach(async ({ key, afterSetValue }) => {
        expect(await configuration.get(key)).toBe(afterSetValue);
      });

      if (!clearSpecificSettings) {
        await configuration.clear();
      } else {
        const cleanSettings = settings
          .filter(({ clear }) => clear)
          .map(({ key }) => key);

        await configuration.clear(cleanSettings);
      }

      settings.forEach(async ({ key, afterCleanValue }) => {
        expect(await configuration.get(key)).toBe(afterCleanValue);
      });
    },
  );

  it.each`
    title | settings | clearSpecificSettings
    ${'clean all settings'} | ${[{
    key: 'text1',
    initialValue: 'defaultValue1',
    afterSetValue: 'storedValue1',
    afterCleanValue: 'defaultValue1',
    store: 'storedValue1',
    clear: true,
  }, {
    key: 'text2',
    initialValue: 'defaultValue2',
    afterSetValue: 'defaultValue2',
    afterCleanValue: 'defaultValue2',
    store: undefined,
    clear: false,
  }]} | ${true}
    ${'clean all settings'} | ${[{
    key: 'text1',
    initialValue: 'defaultValue1',
    afterSetValue: 'storedValue1',
    afterCleanValue: 'defaultValue1',
    store: 'storedValue1',
    clear: true,
  }, {
    key: 'text2',
    initialValue: 'defaultValue2',
    afterSetValue: 'defaultValue2',
    afterCleanValue: 'defaultValue2',
    store: undefined,
    clear: false,
  }]} | ${false}
  `(
    'register setting, set the stored values, check each modified setting has the expected value and clear someone values and check again the setting value',
    async ({ settings, clearSpecificSettings }) => {
      const configurationStore = createMockConfigurationStore();
      const configuration = new Configuration(mockLogger, configurationStore);

      settingsSuite[2].forEach(([key, value]) => {
        configuration.register(key, value);
      });

      settings.forEach(async ({ key, initialValue }) => {
        expect(await configuration.get(key)).toBe(initialValue);
      });

      const storeNewConfiguration = Object.fromEntries(
        settings
          .filter(({ store }) => store)
          .map(({ key, store }) => [key, store]),
      );

      await configuration.set(storeNewConfiguration);

      settings.forEach(async ({ key, afterSetValue }) => {
        expect(await configuration.get(key)).toBe(afterSetValue);
      });

      if (!clearSpecificSettings) {
        await configuration.clear();
      } else {
        const cleanSettings = settings
          .filter(({ clear }) => clear)
          .map(({ key }) => key);

        await configuration.clear(cleanSettings);
      }

      settings.forEach(async ({ key, afterCleanValue }) => {
        expect(await configuration.get(key)).toBe(afterCleanValue);
      });
    },
  );

  // TODO: add test for reset
});
