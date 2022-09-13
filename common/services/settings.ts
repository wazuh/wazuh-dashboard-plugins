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
