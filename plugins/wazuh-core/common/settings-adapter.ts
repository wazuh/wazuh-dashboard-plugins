import { UiSettingsParams } from 'opensearch-dashboards/public';
import {
  EConfigurationProviders,
  EpluginSettingType,
  SettingCategory,
  TPlugginSettingOptionsObjectOf,
  TPluginSetting,
} from './constants';
import { schema, Schema, Type } from '@osd/config-schema';
import { TypeOptions } from 'packages/osd-config-schema/target/types/types';

/**
 * Transform the plugin setting type to the schema type
 * @param type
 * @param validate
 * @returns
 */
const schemaMapper = (setting: TPluginSetting) => {
  if (!setting) {
    throw new Error('Invalid setting');
  }
  const type = setting.type;
  const validate = setting.validate;
  let schemaConfig;
  const schemaDef = {
    validate: validate,
  } as TypeOptions<any>;
  switch (type) {
    case EpluginSettingType.objectOf:
      if (!setting?.options?.objectOf) {
        throw new Error('Invalid objectOf setting');
      }
      const options = setting?.options
        ?.objectOf as TPlugginSettingOptionsObjectOf;
      const innerSchema = schema.object({
        // loop options objectOf and create the schema
        ...Object.keys(options).reduce((acc, key) => {
          acc[key] = schemaMapper(options[key] as TPluginSetting);
          return acc;
        }, {}),
      });

      schemaConfig = schema.recordOf(schema.string(), innerSchema);
      break;
    case EpluginSettingType.text:
      schemaConfig = schema.string(schemaDef);
      break;
    case EpluginSettingType.number:
      schemaConfig = schema.number(schemaDef);
      break;
    case EpluginSettingType.editor:
      schemaConfig = schema.arrayOf(schema.string(schemaDef));
      break;
    case EpluginSettingType.switch:
      schemaConfig = schema.boolean(schemaDef);
      break;
    default:
      schemaConfig = schema.string(schemaDef);
  }

  return schemaConfig;
};

export const uiSettingsAdapter = (settings: {
  [key: string]: TPluginSetting;
}): Record<string, UiSettingsParams> => {
  return Object.entries(settings).reduce(
    (acc, [key, setting]) => {
      acc[key] = {
        name: setting.title,
        value: setting.defaultValue,
        description: setting.description,
        category: [
          SettingCategory[setting.category]
            .split(' ')
            .map((word, index) => (index === 0 ? word.toLowerCase() : word))
            .join(''),
        ],
        schema: schemaMapper(setting),
      };
      return acc;
    },
    {} as Record<string, UiSettingsParams>,
  );
};

export const configSettingsAdapter = (settings: {
  [key: string]: TPluginSetting;
}) => {
  const config = Object.entries(settings).reduce((acc, [key, setting]) => {
    acc[key] = schemaMapper(setting);
    return acc as Schema;
  }, {});
  return config;
};

export const getSettingsByType = (
  settings: { [key: string]: TPluginSetting },
  type: EConfigurationProviders,
): Record<string, TPluginSetting> => {
  if (!settings || !type) {
    throw new Error('Invalid settings or type');
  }
  return Object.entries(settings).reduce(
    (acc, [key, setting]) => {
      if (setting.source === type) {
        acc[key] = setting;
      }
      return acc;
    },
    {} as Record<string, TPluginSetting>,
  );
};

export const getUiSettingsDefinitions = (settings: {
  [key: string]: TPluginSetting;
}): Record<string, UiSettingsParams> => {
  const onlyUiSettings = getSettingsByType(
    settings,
    EConfigurationProviders.PLUGIN_UI_SETTINGS,
  );
  return uiSettingsAdapter(onlyUiSettings);
};

export const getConfigSettingsDefinitions = (settings: {
  [key: string]: TPluginSetting;
}) => {
  const onlyConfigSettings = getSettingsByType(
    settings,
    EConfigurationProviders.INITIALIZER_CONTEXT,
  );
  return configSettingsAdapter(onlyConfigSettings);
};
