import { UiSettingsParams } from 'opensearch-dashboards/public';
import { schema, Schema } from '@osd/config-schema';
import {
  NumberOptions,
  TypeOptions,
} from 'packages/osd-config-schema/target/types/types';
import {
  EConfigurationProviders,
  EpluginSettingType,
  SettingCategory,
  TPluginSetting,
} from './constants';

/**
 * Transform the plugin setting type to the schema type
 * @param type
 * @param validate
 * @returns
 */
const schemaMapper = (setting: TPluginSetting) => {
  if (!setting) {
    // ToDo: Create custom error and implement error handling
    throw new Error('Invalid setting');
  }

  const type = setting.type;
  const validate = setting.validate;
  let schemaConfig;
  const schemaDef = {
    validate: validate,
  } as TypeOptions<any>;

  switch (type) {
    case EpluginSettingType.objectOf: {
      if (!setting?.options?.objectOf) {
        // ToDo: Create custom error and implement error handling
        throw new Error('Invalid objectOf setting');
      }

      const options = setting?.options
        ?.objectOf as TPlugginSettingOptionsObjectOf;
      const mappedSchema = {};

      for (const key of Object.keys(options)) {
        mappedSchema[key] = schemaMapper(options[key] as TPluginSetting);
      }

      const innerSchema = schema.object(mappedSchema);

      schemaConfig = schema.recordOf(schema.string(), innerSchema);
      break;
    }

    case EpluginSettingType.text: {
      schemaConfig = schema.string(schemaDef);
      break;
    }

    case EpluginSettingType.number: {
      // add options for min and max
      const numberOptions: NumberOptions = {
        min: setting?.options?.number?.min,
        max: setting?.options?.number?.max,
        validate: validate,
      };

      schemaConfig = schema.number(numberOptions);

      break;
    }

    case EpluginSettingType.editor: {
      schemaConfig = schema.arrayOf(schema.string(schemaDef));
      break;
    }

    case EpluginSettingType.switch: {
      schemaConfig = schema.boolean(schemaDef);
      break;
    }

    default: {
      schemaConfig = schema.string(schemaDef);
    }
  }

  return schemaConfig;
};

export const uiSettingsAdapter = (
  settings: Record<string, TPluginSetting>,
): Record<string, UiSettingsParams> => {
  const result: Record<string, UiSettingsParams> = {};

  for (const [key, setting] of Object.entries(settings)) {
    result[key] = {
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
  }

  return result;
};

export const configSettingsAdapter = (
  settings: Record<string, TPluginSetting>,
) => {
  const config = {};

  for (const [key, setting] of Object.entries(settings)) {
    config[key] = schemaMapper(setting);
  }

  return config as Schema;
};

export const getSettingsByType = (
  settings: Record<string, TPluginSetting>,
  type: EConfigurationProviders,
): Record<string, TPluginSetting> => {
  if (!settings || !type) {
    // ToDo: Create custom error and implement error handling
    throw new Error('Invalid settings or type');
  }

  const filteredSettings: Record<string, TPluginSetting> = {};

  for (const [key, setting] of Object.entries(settings)) {
    if (setting.source === type) {
      filteredSettings[key] = setting;
    }
  }

  return filteredSettings;
};

export const getUiSettingsDefinitions = (
  settings: Record<string, TPluginSetting>,
): Record<string, UiSettingsParams> => {
  const onlyUiSettings = getSettingsByType(
    settings,
    EConfigurationProviders.PLUGIN_UI_SETTINGS,
  );

  return uiSettingsAdapter(onlyUiSettings);
};

export const getConfigSettingsDefinitions = (
  settings: Record<string, TPluginSetting>,
) => {
  const onlyConfigSettings = getSettingsByType(
    settings,
    EConfigurationProviders.INITIALIZER_CONTEXT,
  );

  return configSettingsAdapter(onlyConfigSettings);
};
