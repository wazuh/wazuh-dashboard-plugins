import {
  formatLabelValuePair,
  formatSettingValueToFile,
  getCustomizationSetting,
} from './settings';

describe('[settings] Methods', () => {
  describe('formatLabelValuePair: Format the label-value pairs used to display the allowed values', () => {
    it.each`
      label          | value   | expected
      ${'TestLabel'} | ${true} | ${'true (TestLabel)'}
      ${'true'}      | ${true} | ${'true'}
    `(
      `label: $label | value: $value | expected: $expected`,
      ({ label, expected, value }) => {
        expect(formatLabelValuePair(label, value)).toBe(expected);
      },
    );
  });

  describe('formatSettingValueToFile: Format setting values to save in the configuration file', () => {
    it.each`
      input                 | expected
      ${'test'}             | ${'"test"'}
      ${'test space'}       | ${'"test space"'}
      ${'test\nnew line'}   | ${'"test\\nnew line"'}
      ${''}                 | ${'""'}
      ${1}                  | ${1}
      ${true}               | ${true}
      ${false}              | ${false}
      ${['test1']}          | ${'["test1"]'}
      ${['test1', 'test2']} | ${'["test1","test2"]'}
    `(`input: $input | expected: $expected`, ({ input, expected }) => {
      expect(formatSettingValueToFile(input)).toBe(expected);
    });
  });

  describe('getCustomizationSetting: Get the value for the "customization." settings depending on the "customization.enabled" setting', () => {
    it.each`
      customizationEnabled | settingKey                        | configValue               | expected
      ${true}              | ${'customization.logo.app'}       | ${'custom-image-app.png'} | ${'custom-image-app.png'}
      ${true}              | ${'customization.logo.app'}       | ${''}                     | ${''}
      ${false}             | ${'customization.logo.app'}       | ${'custom-image-app.png'} | ${''}
      ${false}             | ${'customization.logo.app'}       | ${''}                     | ${''}
      ${true}              | ${'customization.reports.footer'} | ${'Custom footer'}        | ${'Custom footer'}
      ${true}              | ${'customization.reports.footer'} | ${''}                     | ${'Copyright © 2023 Wazuh, Inc.'}
      ${false}             | ${'customization.reports.footer'} | ${'Custom footer'}        | ${'Copyright © 2023 Wazuh, Inc.'}
      ${false}             | ${'customization.reports.footer'} | ${''}                     | ${'Copyright © 2023 Wazuh, Inc.'}
      ${false}             | ${'customization.reports.footer'} | ${''}                     | ${'Copyright © 2023 Wazuh, Inc.'}
      ${true}              | ${'customization.reports.header'} | ${'Custom header'}        | ${'Custom header'}
      ${true}              | ${'customization.reports.header'} | ${''}                     | ${'info@wazuh.com\nhttps://wazuh.com'}
      ${false}             | ${'customization.reports.header'} | ${'Custom header'}        | ${'info@wazuh.com\nhttps://wazuh.com'}
      ${false}             | ${'customization.reports.header'} | ${''}                     | ${'info@wazuh.com\nhttps://wazuh.com'}
    `(
      `customizationEnabled: $customizationEnabled | settingKey: $settingKey | configValue: $configValue | expected: $expected`,
      ({ configValue, customizationEnabled, expected, settingKey }) => {
        const configuration = {
          'customization.enabled': customizationEnabled,
          [settingKey]: configValue,
        };
        expect(getCustomizationSetting(configuration, settingKey)).toBe(
          expected,
        );
      },
    );
  });
});
