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
  isConfigurableFromFile: boolean;
  // Configurable from the UI (Settings/Configuration).
  isConfigurableFromUI: boolean;
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
  persistence?: {
    savedObject?: {
      mapping: any;
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
  clean: (...settings: string[]) => Promise<any>;
}

export interface IConfiguration {
  setStore(store: IConfigurationStore): void;
  setup(): Promise<any>;
  start(): Promise<any>;
  stop(): Promise<any>;
  register(id: string, value: any): void;
  get(...settings: string[]): Promise<TConfigurationSettings>;
  set(settings: TConfigurationSettings): Promise<any>;
  clean(...settings: string[]): Promise<any>;
  reset(...settings: string[]): Promise<any>;
}

export class Configuration implements IConfiguration {
  public _settings: Map<
    string,
    {
      [key: string]: TConfigurationSetting;
    }
  >;
  constructor(private logger: ILogger, private store: IConfigurationStore) {
    this._settings = new Map();
  }
  setStore(store: IConfigurationStore) {
    this.store = store;
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

  private getSettingValue(settingKey: string, value: any) {
    if (!this._settings.has(settingKey)) {
      throw new Error(`${settingKey} is not registered`);
    }
    if (typeof value !== 'undefined') {
      return value;
    }
    const setting = this._settings.get(settingKey);
    return typeof setting.defaultValueIfNotSet !== 'undefined'
      ? setting.defaultValueIfNotSet
      : setting.defaultValue;
  }
  /**
   * Get all settings or a subset of them
   * @param rest
   * @returns
   */
  async get(...settings: string[]) {
    const stored = await this.store.get(...settings);
    this.logger.debug(`wazuh configuration: ${JSON.stringify({ stored })}`);

    return settings && settings.length === 1
      ? this.getSettingValue(settings[0], stored[settings[0]])
      : (settings.length > 1
          ? settings
          : Array.from(this._settings.keys())
        ).reduce(
          (accum, settingKey) => ({
            ...accum,
            [settingKey]: this.getSettingValue(settingKey, stored[settingKey]),
          }),
          {},
        );
  }
  /**
   * Set a subset of settings
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
    return await this.store.set(settings);
  }

  /**
   * Clean the settings or a subset of them
   * @param rest
   * @returns
   */
  async clean(...settings: string[]) {
    if (settings) {
      this.logger.debug(`Clean settings: ${settings.join(', ')}`);
      const response = await this.store.clean(...settings);
      this.logger.info('Settings were cleaned');
      return response;
    } else {
      return await this.clean();
    }
  }

  async reset(...settings: string[]) {
    if (settings) {
      this.logger.debug(`Reset settings: ${settings.join(', ')}`);
      const updatedSettings = settings.reduce((accum, settingKey: string) => {
        const setting = this._settings.get(settingKey);
        return {
          ...accum,
          [settingKey]:
            typeof setting.defaultValueIfNotSet !== 'undefined'
              ? setting.defaultValueIfNotSet
              : setting.defaultValue,
        };
      }, {});
      const response = await this.store.set(updatedSettings);
      this.logger.info('Settings were reset');
      return response;
    } else {
      return await this.reset(...this._settings.keys());
    }
  }
}
