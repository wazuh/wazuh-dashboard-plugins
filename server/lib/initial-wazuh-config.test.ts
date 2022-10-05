import { PLUGIN_SETTINGS_CATEGORIES } from '../../common/constants';
import {
	header,
	hostsConfiguration,
	initialWazuhConfig,
	printSetting,
	printSettingCategory,
	printSettingValue,
	printSection,
} from './initial-wazuh-config';
import { getSettingsDefaultList, groupSettingsByCategory } from '../../common/services/settings';

describe('[configuration-file] Default configuration file content', () => {

	it('Include the header', () => {
		expect(initialWazuhConfig).toContain(header);
	});

	it('Include all the expected categories and settings', () => {

		const pluginSettingsConfigurationFile = getSettingsDefaultList()
  			.filter(categorySetting => categorySetting.isConfigurableFromFile);

		const pluginSettingsConfigurationFileGroupByCategory = groupSettingsByCategory(pluginSettingsConfigurationFile);

		pluginSettingsConfigurationFileGroupByCategory.forEach(({category,  settings}) => {
			// Category
			expect(initialWazuhConfig).toContain(printSettingCategory(PLUGIN_SETTINGS_CATEGORIES[category]));

			// Category settings
			settings.forEach(setting => {
				expect(initialWazuhConfig).toContain(printSetting(setting));
			});
		});
		
	});

	it('Include the host configuration', () => {
		expect(initialWazuhConfig).toContain(hostsConfiguration);
	});	
});

describe('[configuration-file] Methods', () => {

	it.each`
	text      | options 
	${'Test'} | ${{}}
	${'Test'} | ${{ maxLength: 60, prefix: '# '}}
	${'Test'} | ${{ maxLength: 60, fill: '-', prefix: '# '}}
	`('printSection: $options', ({text, options}) => {
		const result = printSection(text, options);
		expect(result).toHaveLength(options?.maxLength ?? 80);
		options.prefix && expect(result).toMatch(new RegExp(`^${options.prefix}`));
		expect(result).toMatch(new RegExp(`${options?.fill ?? ' '}$`));
		expect(result).toContain(`${' '.repeat(options.spaceAround | 1)}${text}${' '.repeat(options.spaceAround | 1)}`);
	});

	it.each`
	input                                                 | expected 
	${{title: 'Test', description: 'Test description'}}   | ${'# ------------------------------------ Test ------------------------------------\n#\n# Test description'}
	${{title: 'Test 2', description: 'Test description'}} | ${'# ----------------------------------- Test 2 -----------------------------------\n#\n# Test description'}
	${{title: 'Test 2', description: 'Test description'}} | ${'# ----------------------------------- Test 2 -----------------------------------\n#\n# Test description'}
	`('printSettingValue: input: $input , expected: $expected', ({input, expected}) => {
		const result = printSettingCategory(input);
		expect(result).toBe(expected);
	});

	it.each(
		[
			{
				input: {key: 'test', description: 'Test description', defaultValue: 0},
				expected: '# Test description\n# test: 0'
			},
			{
				input: {key: 'test', description: 'Test description. Test description. Test description. Test description. Test description. Test description. Test description. Test description. Test description. Test description. Test description. ', defaultValue: 0},
				expected: '# Test description. Test description. Test description. Test description. Test\n# description. Test description. Test description. Test description. Test\n# description. Test description. Test description.\n# test: 0'
			},
			{
				input: {key: 'test', description: 'Test description', defaultValue: 0, options: {select: [{text: 'Option1', value: 'option'},{text: 'Option2', value: 'option2'}]}},
				expected: '# Test description Allowed values: option (Option1), option2 (Option2).\n# test: 0'
			},
			{
				input: {key: 'test', description: 'Test description', defaultValue: 0, options: {switch: {values: { disabled: {label: 'Enabled', value: 'disabled'}, enabled: {label: 'Enabled', value: 'enabled'}, }}}},
				expected: '# Test description Allowed values: enabled (Enabled), disabled (Enabled).\n# test: 0'
			}
	
		]
	)('printSetting: input: $input , expected: $expected', ({input, expected}) => {
		const result = printSetting(input);
		expect(result).toMatch(expected);
	});

	it.each`
	input             | expected 
	${4}              | ${4}
	${''}             | ${"''"}
	${'test'}         | ${'test'}
	${{key: 'value'}} | ${'{\"key\":\"value\"}'}
	${[]}             | ${"[]"}
	${''}             | ${"''"}
	`('printSettingValue: input: $input , expected: $expected', ({input, expected}) => {
		expect(printSettingValue(input)).toBe(expected);
	});
});
