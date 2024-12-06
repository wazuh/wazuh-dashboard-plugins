import { cloneDeep } from 'lodash';
import { EpluginSettingType } from '../constants';
import { formatLabelValuePair } from './settings';
import { formatBytes } from './file-size';

export interface Logger {
  debug: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

interface TConfigurationSettingOptionsPassword {
  password: {
    dual?: 'text' | 'password' | 'dual';
  };
}

interface TConfigurationSettingOptionsTextArea {
  maxRows?: number;
  minRows?: number;
  maxLength?: number;
}

interface TConfigurationSettingOptionsSelect {
  select: { text: string; value: any }[];
}

interface TConfigurationSettingOptionsEditor {
  editor: {
    language: string;
  };
}

interface TConfigurationSettingOptionsFile {
  file: {
    type: 'image';
    extensions?: string[];
    size?: {
      maxBytes?: number;
      minBytes?: number;
    };
    recommended?: {
      dimensions?: {
        width: number;
        height: number;
        unit: string;
      };
    };
    store?: {
      relativePathFileSystem: string;
      filename: string;
      resolveStaticURL: (filename: string) => string;
    };
  };
}

interface TConfigurationSettingOptionsNumber {
  number: {
    min?: number;
    max?: number;
    integer?: boolean;
  };
}

interface TConfigurationSettingOptionsSwitch {
  switch: {
    values: {
      disabled: { label?: string; value: any };
      enabled: { label?: string; value: any };
    };
  };
}

export interface TConfigurationSetting {
  // Define the text displayed in the UI.
  title: string;
  // Description.
  description: string;
  // Category.
  category: number;
  // Type.
  type: EpluginSettingType;
  // Default value.
  defaultValue: any;
  /* Special: This is used for the settings of customization to get the hidden default value, because the default value is empty to not to be displayed on the App Settings. */
  defaultValueIfNotSet?: any;
  // Configurable from the configuration file.
  isConfigurableFromSettings: boolean;
  // Modify the setting requires running the plugin health check (frontend).
  requiresRunningHealthCheck?: boolean;
  // Modify the setting requires reloading the browser tab (frontend).
  requiresReloadingBrowserTab?: boolean;
  // Modify the setting requires restarting the plugin platform to take effect.
  requiresRestartingPluginPlatform?: boolean;
  // Define options related to the `type`.
  options?:
    | TConfigurationSettingOptionsEditor
    | TConfigurationSettingOptionsFile
    | TConfigurationSettingOptionsNumber
    | TConfigurationSettingOptionsPassword
    | TConfigurationSettingOptionsSelect
    | TConfigurationSettingOptionsSwitch
    | TConfigurationSettingOptionsTextArea;
  store?: {
    file: {
      // Define if the setting is managed by the ConfigurationStore service
      configurableManaged?: boolean;
      // Define a text to print as the default in the configuration block
      defaultBlock?: string;
      /* Transform the value defined in the configuration file to be consumed by the Configuration
        service */
      transformFrom?: (value: any) => any;
    };
  };
  // Transform the input value. The result is saved in the form global state of Settings/Configuration
  uiFormTransformChangedInputValue?: (value: any) => any;
  // Transform the configuration value or default as initial value for the input in Settings/Configuration
  uiFormTransformConfigurationValueToInputValue?: (value: any) => any;
  // Transform the input value changed in the form of Settings/Configuration and returned in the `changed` property of the hook useForm
  uiFormTransformInputValueToConfigurationValue?: (value: any) => any;
  // Validate the value in the form of App Settings. It returns a string if there is some validation error.
  validateUIForm?: (value: any) => string | undefined;
  // Validate function creator to validate the setting in the backend.
  validate?: (schema: any) => (value: unknown) => string | undefined;
}

export type TConfigurationSettingWithKey = TConfigurationSetting & {
  key: string;
};
export interface TConfigurationSettingCategory {
  title: string;
  description?: string;
  documentationLink?: string;
  renderOrder?: number;
}
type TConfigurationSettings = Record<string, any>;

export interface IConfigurationStore {
  setup: () => Promise<any>;
  start: () => Promise<any>;
  stop: () => Promise<any>;
  get: (...settings: string[]) => Promise<TConfigurationSettings>;
  set: (settings: TConfigurationSettings) => Promise<any>;
  clear: (...settings: string[]) => Promise<any>;
  // eslint-disable-next-line no-use-before-define
  setConfiguration: (configuration: IConfiguration) => void;
}

export interface IConfiguration {
  setStore: (store: IConfigurationStore) => void;
  setup: () => Promise<any>;
  start: () => Promise<any>;
  stop: () => Promise<any>;
  register: (id: string, value: any) => void;
  get: (...settings: string[]) => Promise<TConfigurationSettings>;
  set: (settings: TConfigurationSettings) => Promise<any>;
  clear: (...settings: string[]) => Promise<any>;
  reset: (...settings: string[]) => Promise<any>;
  _settings: Map<string, Record<string, TConfigurationSetting>>;
  getSettingValue: (settingKey: string, value?: any) => any;
  getSettingValueIfNotSet: (settingKey: string, value?: any) => any;
}

export class Configuration implements IConfiguration {
  store: IConfigurationStore | null = null;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _settings: Map<string, Record<string, TConfigurationSetting>>;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _categories: Map<string, Record<string, any>>;

  constructor(
    private readonly logger: Logger,
    store: IConfigurationStore,
  ) {
    this._settings = new Map();
    this._categories = new Map();
    this.setStore(store);
  }

  setStore(store: IConfigurationStore) {
    this.store = store;
    this.store.setConfiguration(this);
  }

  async setup(dependencies: any = {}) {
    return this.store.setup(dependencies);
  }

  async start(dependencies: any = {}) {
    return this.store.start(dependencies);
  }

  async stop(dependencies: any = {}) {
    return this.store.stop(dependencies);
  }

  /**
   * Register a setting
   * @param id
   * @param value
   */
  register(id: string, value: any) {
    if (this._settings.has(id)) {
      const message = `Setting ${id} exists`;

      this.logger.error(message);
      throw new Error(message);
    } else {
      // Enhance the setting
      const enhancedValue = value;

      // Enhance the description
      enhancedValue._description = value.description;
      enhancedValue.description = this.enhanceSettingDescription(value);
      // Register the setting
      this._settings.set(id, enhancedValue);
      this.logger.debug(`Registered ${id}`);
    }
  }

  private checkRequirementsOnUpdatedSettings(settings: string[]) {
    return {
      requiresRunningHealthCheck: settings.some(
        key => this._settings.get(key)?.requiresRunningHealthCheck,
      ),
      requiresReloadingBrowserTab: settings.some(
        key => this._settings.get(key)?.requiresReloadingBrowserTab,
      ),
      requiresRestartingPluginPlatform: settings.some(
        key => this._settings.get(key)?.requiresRestartingPluginPlatform,
      ),
    };
  }

  /**
   * Special: Get the value for a setting from a value or someone of the default values. This is used for the settings of customization to get the hidden default value, because the default value is empty to not to be displayed on the App Settings
   * It retunts defaultValueIfNotSet or defaultValue
   * @param settingKey
   * @param value
   * @returns
   */
  getSettingValueIfNotSet(settingKey: string, value?: any) {
    this.logger.debug(
      `Getting value for [${settingKey}]: stored [${JSON.stringify(value)}]`,
    );

    if (!this._settings.has(settingKey)) {
      throw new Error(`${settingKey} is not registered`);
    }

    if (value !== undefined) {
      return value;
    }

    const setting = this._settings.get(settingKey);
    const finalValue =
      setting.defaultValueIfNotSet === undefined
        ? setting.defaultValue
        : setting.defaultValueIfNotSet;

    this.logger.debug(
      `Value for [${settingKey}]: [${JSON.stringify(finalValue)}]`,
    );

    return finalValue;
  }

  /**
   * Get the value for a setting from a value or someone of the default values:
   * It returns defaultValue
   * @param settingKey
   * @param value
   * @returns
   */
  getSettingValue(settingKey: string, value?: any) {
    this.logger.debug(
      `Getting value for [${settingKey}]: stored [${JSON.stringify(value)}]`,
    );

    if (!this._settings.has(settingKey)) {
      throw new Error(`${settingKey} is not registered`);
    }

    if (value !== undefined) {
      return value;
    }

    const setting = this._settings.get(settingKey);
    const finalValue = setting.defaultValue;

    this.logger.debug(
      `Value for [${settingKey}]: [${JSON.stringify(finalValue)}]`,
    );

    return finalValue;
  }

  /**
   * Get the value for all settings or a subset of them
   * @param rest
   * @returns
   */
  async get(...settings: string[]) {
    this.logger.debug(
      settings.length > 0
        ? `Getting settings [${settings.join(',')}]`
        : 'Getting settings',
    );

    const stored = await this.store.get(...settings);

    this.logger.debug(`configuration stored: ${JSON.stringify({ stored })}`);

    const result =
      settings && settings.length === 1
        ? this.getSettingValue(settings[0], stored[settings[0]])
        : Object.fromEntries(
            (settings.length > 1 ? settings : [...this._settings.keys()]).map(
              key => [key, this.getSettingValue(key, stored[key])],
            ),
          );

    // Clone the result. This avoids the object reference can be changed when managing the result.
    return cloneDeep(result);
  }

  /**
   * Set a the value for a subset of settings
   * @param settings
   * @returns
   */
  async set(settings: Record<string, any>) {
    const settingsAreRegistered = Object.entries(settings)
      .map(([key]) =>
        this._settings.has(key) ? null : `${key} is not registered`,
      )
      .filter(Boolean);

    if (settingsAreRegistered.length > 0) {
      throw new Error(`${settingsAreRegistered.join(', ')} are not registered`);
    }

    const validationErrors = Object.entries(settings)
      .map(([key, value]) => {
        const validationError = this._settings.get(key)?.validate?.(value);

        return validationError
          ? `setting [${key}]: ${validationError}`
          : undefined;
      })
      .filter(Boolean);

    if (validationErrors.length > 0) {
      throw new Error(`Validation errors: ${validationErrors.join('\n')}`);
    }

    const responseStore = await this.store.set(settings);

    return {
      requirements: this.checkRequirementsOnUpdatedSettings(
        Object.keys(responseStore),
      ),
      update: responseStore,
    };
  }

  /**
   * Clean the values for all settings or a subset of them
   * @param rest
   * @returns
   */
  async clear(...settings: string[]) {
    if (settings.length > 0) {
      this.logger.debug(`Clean settings: ${settings.join(', ')}`);

      const responseStore = await this.store.clear(...settings);

      this.logger.info('Settings were cleared');

      return {
        requirements: this.checkRequirementsOnUpdatedSettings(
          Object.keys(responseStore),
        ),
        update: responseStore,
      };
    } else {
      return await this.clear(...this._settings.keys());
    }
  }

  /**
   * Reset the values for all settings or a subset of them
   * @param settings
   * @returns
   */
  async reset(...settings: string[]) {
    if (settings.length > 0) {
      this.logger.debug(`Reset settings: ${settings.join(', ')}`);

      const updatedSettings = Object.fromEntries(
        settings.map((settingKey: string) => [
          settingKey,
          this.getSettingValue(settingKey),
        ]),
      );
      const responseStore = await this.store.set(updatedSettings);

      this.logger.info('Settings were reset');

      return {
        requirements: this.checkRequirementsOnUpdatedSettings(
          Object.keys(responseStore),
        ),
        update: responseStore,
      };
    } else {
      return await this.reset(...this._settings.keys());
    }
  }

  registerCategory({ id, ...rest }) {
    if (this._categories.has(id)) {
      this.logger.error(`Registered category [${id}]`);
      throw new Error(`Category exists [${id}]`);
    }

    this._categories.set(id, rest);
    this.logger.debug(`Registered category [${id}]`);
  }

  getUniqueCategories() {
    return [
      ...new Set(
        [...this._settings.entries()]
          .filter(
            ([, { isConfigurableFromSettings }]) => isConfigurableFromSettings,
          )
          .map(([, { category }]) => category),
      ),
    ]
      .map(categoryID => this._categories.get(String(categoryID)))
      .sort((categoryA, categoryB) => {
        if (categoryA.title > categoryB.title) {
          return 1;
        } else if (categoryA.title < categoryB.title) {
          return -1;
        }

        return 0;
      });
  }

  private enhanceSettingDescription(setting: TConfigurationSetting) {
    const { description, options } = setting;

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
      ...(options?.file?.size && options.file.size.minBytes !== undefined
        ? [`Minimum file size: ${formatBytes(options.file.size.minBytes)}.`]
        : []),
      ...(options?.file?.size && options.file.size.maxBytes !== undefined
        ? [`Maximum file size: ${formatBytes(options.file.size.maxBytes)}.`]
        : []),
      // Multi line text
      ...(options?.maxRows && options.maxRows !== undefined
        ? [`Maximum amount of lines: ${options.maxRows}.`]
        : []),
      ...(options?.minRows && options.minRows !== undefined
        ? [`Minimum amount of lines: ${options.minRows}.`]
        : []),
      ...(options?.maxLength && options.maxLength !== undefined
        ? [`Maximum lines length is ${options.maxLength} characters.`]
        : []),
    ].join(' ');
  }

  groupSettingsByCategory(
    settings: string[] | null = null,
    filterFunction:
      | ((setting: TConfigurationSettingWithKey) => boolean)
      | null = null,
  ) {
    const settingsMapped = (
      settings && Array.isArray(settings)
        ? [...this._settings.entries()].filter(([key]) =>
            settings.includes(key),
          )
        : [...this._settings.entries()]
    ).map(([key, value]) => ({
      ...value,
      key,
    }));
    const settingsSortedByCategories = (
      filterFunction
        ? settingsMapped.filter(element => filterFunction(element))
        : settingsMapped
    )
      .sort((settingA, settingB) => settingA.key?.localeCompare?.(settingB.key))
      // eslint-disable-next-line unicorn/no-array-reduce
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
  }
}
