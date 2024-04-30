import { enhanceConfiguration } from './enhance-configuration';
import { Configuration } from '../../common/services/configuration';

const noop = () => undefined;
const mockLogger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};

const mockConfigurationStore = {
  get: jest.fn(),
  set: jest.fn(),
  setConfiguration(configuration) {
    this.configuration = configuration;
  },
};

const configuration = new Configuration(mockLogger, mockConfigurationStore);
enhanceConfiguration(configuration);

[
  { key: 'customization.enabled', type: 'switch', defaultValue: true },
  {
    key: 'customization.test',
    type: 'text',
    defaultValueIfNotSet: 'Default customization value',
  },
].forEach(({ key, ...rest }) => configuration.register(key, rest));

describe('enhanceConfiguration', () => {
  it('ensure the .getCustomizationSetting is defined and is a function', () => {
    expect(configuration.getCustomizationSetting).toBeDefined();
    expect(typeof configuration.getCustomizationSetting).toBe('function');
  });
});

describe('enhanceConfiguration', () => {
  it.each`
    enabledCustomization | customize       | expectedSettingValue
    ${true}              | ${'Customized'} | ${'Customized'}
    ${true}              | ${''}           | ${'Default customization value'}
    ${false}             | ${'Customized'} | ${'Default customization value'}
  `(
    'call to .getCustomizationSetting returns the expected value',
    async ({ enabledCustomization, customize, expectedSettingValue }) => {
      mockConfigurationStore.get.mockImplementation((...settings) => {
        return Object.fromEntries(
          settings.map(key => {
            if (key === 'customization.enabled') {
              return [key, enabledCustomization];
            }
            return [key, customize];
          }),
        );
      });
      expect(
        await configuration.getCustomizationSetting('customization.test'),
      ).toEqual({ 'customization.test': expectedSettingValue });
    },
  );
});
