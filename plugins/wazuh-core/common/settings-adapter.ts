import { UiSettingsParams } from "opensearch-dashboards/public";
import { EConfigurationProviders, EpluginSettingType, SettingCategory, TPluginSetting } from "./constants";
import { schema } from '@osd/config-schema';

const schemaMapper = (type: typeof EpluginSettingType[keyof typeof EpluginSettingType], validate: any ): UiSettingsParams<any>['schema'] => {
    let schemaConfig
    switch (type) {
      case EpluginSettingType.text:
        schemaConfig = schema.string({
          validate: validate
        })
        break;
      case EpluginSettingType.number:
        schemaConfig = schema.number({
          validate: validate
        })
        break;
      case EpluginSettingType.editor:
        schemaConfig = schema.arrayOf(schema.string({
          validate: validate
        }))
        break;
      case EpluginSettingType.switch:
        schemaConfig = schema.boolean({
          validate: validate
        })
        break;
      default:
        schemaConfig = schema.string({
          validate: validate
        })
    }

    return schemaConfig;
  }   

export const settingsAdapter = (settings: { [key: string]: TPluginSetting }) : Record<string, UiSettingsParams> => {
    return Object.entries(settings).reduce((acc, [key, setting]) => {
      acc[key] = {
        name: setting.title,
        value: setting.defaultValue,
        description: setting.description,
        category: [SettingCategory[setting.category]
            .split(' ')
            .map((word, index) => index === 0 ? word.toLowerCase() : word)
            .join('')],
        schema: schemaMapper(setting.type, setting.validate)
      };
      return acc;
    }, {} as Record<string, UiSettingsParams>);
  };

  export const getSettingsByType = (settings: { [key: string]: TPluginSetting }, type: EConfigurationProviders) : Record<string, TPluginSetting> => {
    if (!settings || !type){
      throw new Error('Invalid settings or type');
    }
    return Object.entries(settings).reduce((acc, [key, setting]) => {
      if(setting.source === type){
        acc[key] = setting;
      }
      return acc;
    }
    , {} as Record<string, TPluginSetting>);
  }

  export const getUiSettingsDefinitions = (settings: { [key: string]: TPluginSetting }) : Record<string, UiSettingsParams> => {
    const onlyUiSettings = getSettingsByType(settings, EConfigurationProviders.PLUGIN_UI_SETTINGS);
    return settingsAdapter(onlyUiSettings);
  }