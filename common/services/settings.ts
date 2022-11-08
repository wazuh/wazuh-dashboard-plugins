import {
  PLUGIN_SETTINGS,
  PLUGIN_SETTINGS_CATEGORIES,
  TPluginSetting,
  TPluginSettingKey,
  TPluginSettingWithKey
} from '../constants';
import { formatBytes } from './file-size';

/**
 * Look for a configuration category setting by its name
 * @param categoryTitle
 * @returns category settings
 */
export function getCategorySettingByTitle(categoryTitle: string): any {
  return Object.entries(PLUGIN_SETTINGS_CATEGORIES).find(([key, category]) => category?.title == categoryTitle)?.[1];
}

/**
 * Get the default value of the plugin setting.
 * @param setting setting key
 * @returns setting default value. It returns `defaultValueIfNotSet` or `defaultValue`.
 */
export function getSettingDefaultValue(settingKey: string): any {
	return typeof PLUGIN_SETTINGS[settingKey].defaultValueIfNotSet !== 'undefined'
		? PLUGIN_SETTINGS[settingKey].defaultValueIfNotSet
		: PLUGIN_SETTINGS[settingKey].defaultValue;
};

/**
 * Get the default settings configuration. key-value pair
 * @returns an object with key-value pairs whose value is the default one
 */
export function getSettingsDefault() : {[key in TPluginSettingKey]: unknown}   {
	return Object.entries(PLUGIN_SETTINGS).reduce((accum, [pluginSettingID, pluginSettingConfiguration]) => ({
		...accum,
		[pluginSettingID]: pluginSettingConfiguration.defaultValue
	}), {});
};

/**
 * Get the settings grouped by category
 * @returns an object whose keys are the categories and its value is an array of setting of that category
 */
export function getSettingsByCategories() : {[key: string]: TPluginSetting[]}  {
	return Object.entries(PLUGIN_SETTINGS).reduce((accum, [pluginSettingID, pluginSettingConfiguration]) => ({
		...accum,
		[pluginSettingConfiguration.category]: [...(accum[pluginSettingConfiguration.category] || []), { ...pluginSettingConfiguration, key: pluginSettingID }]
	}), {});
};

/**
 * Get the plugin settings as an array
 * @returns an array of plugin setting denifitions including the key
 */
export function getSettingsDefaultList(): TPluginSettingWithKey[] {
	return Object.entries(PLUGIN_SETTINGS).reduce((accum, [pluginSettingID, pluginSettingConfiguration]) => ([
		...accum,
		{ ...pluginSettingConfiguration, key: pluginSettingID }
	]), []);
};

/**
 * Format the plugin setting value received in the backend to store in the plugin configuration file (.yml).
 * @param value plugin setting value sent to the endpoint
 * @returns valid value to .yml
 */
export function formatSettingValueToFile(value: any) {
	const formatter = formatSettingValueToFileType[typeof value] || formatSettingValueToFileType.default;
	return formatter(value);
};

const formatSettingValueToFileType = {
	string: (value: string): string => `"${value.replace(/"/,'\\"').replace(/\n/g,'\\n')}"`, // Escape the " character and new line
	object: (value: any): string => JSON.stringify(value),
	default: (value: any): any => value
};

/**
 * Group the settings by category
 * @param settings
 * @returns
 */
export function groupSettingsByCategory(settings: TPluginSettingWithKey[]){
	const settingsSortedByCategories = settings
		.sort((settingA, settingB) => settingA.key?.localeCompare?.(settingB.key))
		.reduce((accum, pluginSettingConfiguration) => ({
			...accum,
			[pluginSettingConfiguration.category]: [
				...(accum[pluginSettingConfiguration.category] || []),
				{ ...pluginSettingConfiguration }
			]
		}), {});

	return Object.entries(settingsSortedByCategories)
		.map(([category, settings]) => ({ category, settings }))
		.filter(categoryEntry => categoryEntry.settings.length);
};

/**
 * Get the plugin setting description composed.
 * @param options
 * @returns
 */
 export function getPluginSettingDescription({description, options}: TPluginSetting): string{
	return [
		description,
		...(options?.select ? [`Allowed values: ${options.select.map(({text, value}) => formatLabelValuePair(text, value)).join(', ')}.`] : []),
		...(options?.switch ? [`Allowed values: ${['enabled', 'disabled'].map(s => formatLabelValuePair(options.switch.values[s].label, options.switch.values[s].value)).join(', ')}.`] : []),
		...(options?.number && 'min' in options.number ? [`Minimum value: ${options.number.min}.`] : []),
		...(options?.number && 'max' in options.number ? [`Maximum value: ${options.number.max}.`] : []),
		// File extensions
		...(options?.file?.extensions ? [`Supported extensions: ${options.file.extensions.join(', ')}.`] : []),
		// File recommended dimensions
		...(options?.file?.recommended?.dimensions ? [`Recommended dimensions: ${options.file.recommended.dimensions.width}x${options.file.recommended.dimensions.height}${options.file.recommended.dimensions.unit || ''}.`] : []),
		// File size
		...((options?.file?.size && typeof options.file.size.minBytes !== 'undefined') ? [`Minimum file size: ${formatBytes(options.file.size.minBytes)}.`] : []),
		...((options?.file?.size && typeof options.file.size.maxBytes !== 'undefined') ? [`Maximum file size: ${formatBytes(options.file.size.maxBytes)}.`] : []),
		// Multi line text
		...((options?.maxRows && typeof options.maxRows !== 'undefined' ? [`Maximum amount of lines: ${options.maxRows}.`] : [])),
		...((options?.minRows && typeof options.minRows !== 'undefined' ? [`Minimum amount of lines: ${options.minRows}.`] : [])),
		...((options?.maxLength && typeof options.maxLength !== 'undefined' ? [`Maximum lines length is ${options.maxLength} characters.`] : [])),
	].join(' ');
};

/**
 * Format the pair value-label to display the pair. If label and the string of value are equals, only displays the value, if not, displays both.
 * @param value
 * @param label
 * @returns
 */
export function formatLabelValuePair(label, value){
	return label !== `${value}`
		? `${value} (${label})`
		: `${value}`
};

/**
 * Get the configuration value if the customization is enabled.
 * @param configuration JSON object from `wazuh.yml`
 * @param settingKey key of the setting
 * @returns 
 */
export function getCustomizationSetting(configuration: {[key: string]: any }, settingKey: string): any {
  const isCustomizationEnabled = typeof configuration['customization.enabled'] === 'undefined'
    ? getSettingDefaultValue('customization.enabled')
    : configuration['customization.enabled'];
  const defaultValue = getSettingDefaultValue(settingKey);

	if ( isCustomizationEnabled && settingKey.startsWith('customization') && settingKey !== 'customization.enabled'){
		return (typeof configuration[settingKey] !== 'undefined' ? resolveEmptySetting(settingKey, configuration[settingKey]) : defaultValue);
	}else{
		return defaultValue;
	};
};

/**
 * Returns the default value if not set when the setting is an empty string
 * @param settingKey plugin setting
 * @param value value of the plugin setting
 * @returns 
 */
function resolveEmptySetting(settingKey: string, value : unknown){
	return typeof value === 'string' && value.length === 0 && PLUGIN_SETTINGS[settingKey].defaultValueIfNotSet
		? getSettingDefaultValue(settingKey)
		: value;
};
