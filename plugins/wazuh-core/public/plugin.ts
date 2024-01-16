import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
import { WazuhCorePluginSetup, WazuhCorePluginStart } from './types';
import { setCore, setUiSettings } from './plugin-services';
import * as utils from './utils';
import { API_USER_STATUS_RUN_AS } from '../common/api-user-status-run-as';
import { Configuration } from '../common/services/configuration';
import { ConfigurationStore } from './utils/configuration-store';
import {
  PLUGIN_SETTINGS,
  PLUGIN_SETTINGS_CATEGORIES,
} from '../common/constants';
import { formatBytes } from '../common/services/file-size';
import { formatLabelValuePair } from '../common/services/settings';

export class WazuhCorePlugin
  implements Plugin<WazuhCorePluginSetup, WazuhCorePluginStart>
{
  _internal: { [key: string]: any } = {};
  services: { [key: string]: any } = {};
  public setup(core: CoreSetup): WazuhCorePluginSetup {
    // TODO: change to noop
    const logger = {
      info: console.log,
      error: console.error,
      debug: console.debug,
      warn: console.warn,
    };
    this._internal.configurationStore = new ConfigurationStore(logger);
    this.services.configuration = new Configuration(
      logger,
      this._internal.configurationStore,
    );

    Object.entries(PLUGIN_SETTINGS).forEach(([key, value]) =>
      this.services.configuration.register(key, value),
    );

    // Extend the configuration instance to define the categories
    this.services.configuration.registerCategory = function ({ id, ...rest }) {
      if (!this._categories) {
        this._categories = new Map();
      }
      if (this._categories.has(id)) {
        this.logger.error(`Registered category ${id}`);
        throw new Error(`Category ${id} exists`);
      }
      this._categories.set(id, rest);
      this.logger.debug(`Registered category ${id}`);
    };

    this.services.configuration.getUniqueCategories = function () {
      return [
        ...new Set(
          Array.from(this._settings.entries())
            .filter(([, { isConfigurableFromUI }]) => isConfigurableFromUI)
            .map(([, { category }]) => category),
        ),
      ].map(categoryID => this._categories.get(String(categoryID)));
    };

    this.services.configuration.getSettingDescription = function (key: string) {
      const { description, options } = this._settings.get(key);
      return [
        description,
        ...(options?.select
          ? [
              `Allowed values: ${options.select
                .map(({ text, value }) => formatLabelValuePair(text, value))
                .join(', ')}.`,
            ]
          : []),
        ...(options?.switch
          ? [
              `Allowed values: ${['enabled', 'disabled']
                .map(s =>
                  formatLabelValuePair(
                    options.switch.values[s].label,
                    options.switch.values[s].value,
                  ),
                )
                .join(', ')}.`,
            ]
          : []),
        ...(options?.number && 'min' in options.number
          ? [`Minimum value: ${options.number.min}.`]
          : []),
        ...(options?.number && 'max' in options.number
          ? [`Maximum value: ${options.number.max}.`]
          : []),
        // File extensions
        ...(options?.file?.extensions
          ? [`Supported extensions: ${options.file.extensions.join(', ')}.`]
          : []),
        // File recommended dimensions
        ...(options?.file?.recommended?.dimensions
          ? [
              `Recommended dimensions: ${
                options.file.recommended.dimensions.width
              }x${options.file.recommended.dimensions.height}${
                options.file.recommended.dimensions.unit || ''
              }.`,
            ]
          : []),
        // File size
        ...(options?.file?.size &&
        typeof options.file.size.minBytes !== 'undefined'
          ? [`Minimum file size: ${formatBytes(options.file.size.minBytes)}.`]
          : []),
        ...(options?.file?.size &&
        typeof options.file.size.maxBytes !== 'undefined'
          ? [`Maximum file size: ${formatBytes(options.file.size.maxBytes)}.`]
          : []),
        // Multi line text
        ...(options?.maxRows && typeof options.maxRows !== 'undefined'
          ? [`Maximum amount of lines: ${options.maxRows}.`]
          : []),
        ...(options?.minRows && typeof options.minRows !== 'undefined'
          ? [`Minimum amount of lines: ${options.minRows}.`]
          : []),
        ...(options?.maxLength && typeof options.maxLength !== 'undefined'
          ? [`Maximum lines length is ${options.maxLength} characters.`]
          : []),
      ].join(' ');
    };

    //  Group the settings by category
    this.services.configuration.groupSettingsByCategory = function (_settings) {
      const settings = (
        _settings && Array.isArray(_settings)
          ? Array.from(this._settings.entries()).filter(([key]) =>
              _settings.includes(key),
            )
          : Array.from(this._settings.entries())
      ).map(([key, value]) => ({
        ...value,
        key,
      }));

      const settingsSortedByCategories = settings
        .sort((settingA, settingB) =>
          settingA.key?.localeCompare?.(settingB.key),
        )
        .reduce(
          (accum, pluginSettingConfiguration) => ({
            ...accum,
            [pluginSettingConfiguration.category]: [
              ...(accum[pluginSettingConfiguration.category] || []),
              { ...pluginSettingConfiguration },
            ],
          }),
          {},
        );

      return Object.entries(settingsSortedByCategories)
        .map(([category, settings]) => ({
          category: this._categories.get(String(category)),
          settings,
        }))
        .filter(categoryEntry => categoryEntry.settings.length);
    };

    // Add categories to the configuration
    Object.entries(PLUGIN_SETTINGS_CATEGORIES).forEach(([key, value]) => {
      this.services.configuration.registerCategory({ ...value, id: key });
    });

    return {
      ...this.services,
      utils,
      API_USER_STATUS_RUN_AS,
    };
  }

  public start(core: CoreStart): WazuhCorePluginStart {
    setCore(core);
    setUiSettings(core.uiSettings);

    return {
      ...this.services,
      utils,
      API_USER_STATUS_RUN_AS,
    };
  }

  public stop() {}
}
