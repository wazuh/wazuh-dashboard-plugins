import { cloneDeep } from 'lodash';

export interface ILogger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

type TConfigurationSettingOptionsPassword = {
  password: {
    dual?: 'text' | 'password' | 'dual';
  };
};

type TConfigurationSettingOptionsTextArea = {
  maxRows?: number;
  minRows?: number;
  maxLength?: number;
};

type TConfigurationSettingOptionsSelect = {
  select: { text: string; value: any }[];
};

type TConfigurationSettingOptionsEditor = {
  editor: {
    language: string;
  };
};

type TConfigurationSettingOptionsFile = {
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
};

type TConfigurationSettingOptionsNumber = {
  number: {
    min?: number;
    max?: number;
    integer?: boolean;
  };
};

type TConfigurationSettingOptionsSwitch = {
  switch: {
    values: {
      disabled: { label?: string; value: any };
      enabled: { label?: string; value: any };
    };
  };
};

export enum EpluginSettingType {
  text = 'text',
  password = 'password',
  textarea = 'textarea',
  switch = 'switch',
  number = 'number',
  editor = 'editor',
  select = 'select',
  filepicker = 'filepicker',
}

export type TConfigurationSetting = {
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
  // Default value if it is not set. It has preference over `default`.
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
    savedObject?: {
      mapping: any;
      get?: (value: any, configuration: any) => any;
      set?: (value: any, configuration: any) => any;
    };
  };
  // Transform the input value. The result is saved in the form global state of Settings/Configuration
  uiFormTransformChangedInputValue?: (value: any) => any;
  // Transform the configuration value or default as initial value for the input in Settings/Configuration
  uiFormTransformConfigurationValueToInputValue?: (value: any) => any;
  // Transform the input value changed in the form of Settings/Configuration and returned in the `changed` property of the hook useForm
  uiFormTransformInputValueToConfigurationValue?: (value: any) => any;
  // Validate the value in the form of Settings/Configuration. It returns a string if there is some validation error.
  validate?: (value: any) => string | undefined;
  // Validate function creator to validate the setting in the backend. It uses `schema` of the `@kbn/config-schema` package.
  validateBackend?: (schema: any) => (value: unknown) => string | undefined;
};

export type TConfigurationSettingWithKey = TConfigurationSetting & {
  key: string;
};
export type TConfigurationSettingCategory = {
  title: string;
  description?: string;
  documentationLink?: string;
  renderOrder?: number;
};

type TConfigurationSettings = { [key: string]: any };
export interface IConfigurationStore {
  setup: () => Promise<any>;
  start: () => Promise<any>;
  stop: () => Promise<any>;
  get: (...settings: string[]) => Promise<TConfigurationSettings>;
  set: (settings: TConfigurationSettings) => Promise<any>;
  clear: (...settings: string[]) => Promise<any>;
  setConfiguration: (configuration: IConfiguration) => void;
}

export interface IConfiguration {
  setStore(store: IConfigurationStore): void;
  setup(): Promise<any>;
  start(): Promise<any>;
  stop(): Promise<any>;
  register(id: string, value: any): void;
  get(...settings: string[]): Promise<TConfigurationSettings>;
  set(settings: TConfigurationSettings): Promise<any>;
  clear(...settings: string[]): Promise<any>;
  reset(...settings: string[]): Promise<any>;
  _settings: Map<
    string,
    {
      [key: string]: TConfigurationSetting;
    }
  >;
  getSettingValue(settingKey: string, value?: any): any;
}

export class Configuration implements IConfiguration {
  private store: IConfigurationStore;
  constructor(private logger: ILogger, store: IConfigurationStore) {
    this._settings = new Map();
    this.setStore(store);
  }
  setStore(store: IConfigurationStore) {
    this.store = store;
    this.store.setConfiguration(this);
  }
  async setup() {
    return this.store.setup(Object.fromEntries(this._settings.entries()));
  }
  async start() {
    return this.store.start(Object.fromEntries(this._settings.entries()));
  }
  async stop() {
    return this.store.stop(Object.fromEntries(this._settings.entries()));
  }
  /**
   * Register a setting
   * @param id
   * @param value
   */
  register(id: string, value: any) {
    if (!this._settings.has(id)) {
      this._settings.set(id, value);
      this.logger.debug(`Registered ${id}`);
    } else {
      const message = `Setting ${id} exists`;
      this.logger.error(message);
      throw new Error(message);
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
   * Get the value for a setting from a value or someone of the default values:
   * defaultValueIfNotSet or defaultValue
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
    if (typeof value !== 'undefined') {
      return value;
    }
    const setting = this._settings.get(settingKey);
    const finalValue =
      typeof setting.defaultValueIfNotSet !== 'undefined'
        ? setting.defaultValueIfNotSet
        : setting.defaultValue;
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
    const stored = await this.store.get(...settings);
    this.logger.debug(`configuration stored: ${JSON.stringify({ stored })}`);

    const result =
      settings && settings.length === 1
        ? this.getSettingValue(settings[0], stored[settings[0]])
        : (settings.length > 1
            ? settings
            : Array.from(this._settings.keys())
          ).reduce(
            (accum, key) => ({
              ...accum,
              [key]: this.getSettingValue(key, stored[key]),
            }),
            {},
          );

    // Clone the result. This avoids the object reference can be changed when managing the result.
    return cloneDeep(result);
  }
  /**
   * Set a the value for a subset of settings
   * @param settings
   * @returns
   */
  async set(settings: { [key: string]: any }) {
    const settingsAreRegistered = Object.entries(settings)
      .map(([key]) =>
        this._settings.has(key) ? null : `${key} is not registered`,
      )
      .filter(value => value);
    if (settingsAreRegistered.length) {
      throw new Error(`${settingsAreRegistered.join(', ')} are not registered`);
    }

    const validationErrors = Object.entries(settings)
      .map(([key, value]) => {
        const validationError = this._settings.get(key)?.validate?.(value);
        return validationError
          ? `setting [${key}]: ${validationError}`
          : undefined;
      })
      .filter(value => value);
    if (validationErrors.length) {
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
    if (settings.length) {
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
      return await this.clear(...Array.from(this._settings.keys()));
    }
  }

  /**
   * Reset the values for all settings or a subset of them
   * @param settings
   * @returns
   */
  async reset(...settings: string[]) {
    if (settings.length) {
      this.logger.debug(`Reset settings: ${settings.join(', ')}`);
      const updatedSettings = settings.reduce((accum, settingKey: string) => {
        return {
          ...accum,
          [settingKey]: this.getSettingValue(settingKey),
        };
      }, {});
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
}
