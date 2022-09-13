import { EpluginSettingType, PLUGIN_SETTINGS, TpluginSetting } from '../constants';

/**
 * Get the default value of the plugin setting
 * @param setting setting key
 * @returns setting default value
 */
export function getSettingDefaultValue(setting: string) {
	return typeof PLUGIN_SETTINGS[setting].defaultHidden !== 'undefined'
		? PLUGIN_SETTINGS[setting].defaultHidden
		: PLUGIN_SETTINGS[setting].default;
};

export function getSettingsDefault() {
	return Object.entries(PLUGIN_SETTINGS).reduce((accum, [pluginSettingID, pluginSettingConfiguration]) => ({
		...accum,
		[pluginSettingID]: pluginSettingConfiguration.default
	}), {});
};

export function getSettingsByCategories() {
	return Object.entries(PLUGIN_SETTINGS).reduce((accum, [pluginSettingID, pluginSettingConfiguration]) => ({
		...accum,
		[pluginSettingConfiguration.category]: [...(accum[pluginSettingConfiguration.category] || []), { ...pluginSettingConfiguration, key: pluginSettingID }]
	}), {});
};

export function getSettingsDefaultList() {
	return Object.entries(PLUGIN_SETTINGS).reduce((accum, [pluginSettingID, pluginSettingConfiguration]) => ([
		...accum,
		{ ...pluginSettingConfiguration, key: pluginSettingID }
	]), []);
};

/**
 * 
 * @param pluginSetting Plugin setting definition
 * @param fromValue value of the form
 * @returns Transform the form value to the type of the setting expected
 */
 export function formatSettingValueFromForm(pluginSettingKey: string, formValue: any) {
	const { type } = PLUGIN_SETTINGS[pluginSettingKey];
	return formatSettingValueFromFormType[type](formValue);
};

const formatSettingValueFromFormType = {
	[EpluginSettingType.text]: (value: string): string => value,
	[EpluginSettingType.textarea]: (value: string): string => value,
	[EpluginSettingType.number]: (value: string): number => Number(value),
	[EpluginSettingType.switch]: (value: string): boolean => Boolean(value),
	[EpluginSettingType.editor]: (value: any): any => value, // Array form transforms the value. It is coming a valid JSON.
	[EpluginSettingType.select]: (value: any): any => value,
};