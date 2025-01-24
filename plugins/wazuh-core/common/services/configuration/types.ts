import { EpluginSettingType } from '../../constants';
import { IConfigurationProvider } from './configuration-provider';

export interface ILogger {
  debug: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

export interface TConfigurationSettingOptionsPassword {
  password: {
    dual?: 'text' | 'password' | 'dual';
  };
}

export interface TConfigurationSettingOptionsTextArea {
  maxRows?: number;
  minRows?: number;
  maxLength?: number;
}

export interface TConfigurationSettingOptionsSelect {
  select: { text: string; value: any }[];
}

export interface TConfigurationSettingOptionsEditor {
  editor: {
    language: string;
  };
}

export interface TConfigurationSettingOptionsFile {
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

export interface TConfigurationSettingOptionsNumber {
  number: {
    min?: number;
    max?: number;
    integer?: boolean;
  };
}

export interface TConfigurationSettingOptionsSwitch {
  switch: {
    values: {
      disabled: { label?: string; value: any };
      enabled: { label?: string; value: any };
    };
  };
}

export enum E_PLUGIN_SETTING_TYPE {
  TEXT = 'text',
  PASSWORD = 'password',
  TEXTAREA = 'textarea',
  SWITCH = 'switch',
  NUMBER = 'number',
  EDITOR = 'editor',
  SELECT = 'select',
  FILEPICKER = 'filepicker',
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

export interface IConfiguration {
  setup: () => Promise<any>;
  start: () => Promise<any>;
  stop: () => Promise<any>;
  get: (settingsKey: string) => Promise<any>;
  getAll: () => Promise<Record<string, any>>;
}

export type TConfigurationSettings = Record<string, any>;
export type IConfigurationStore = {
  getProviderConfiguration: (key: string) => Promise<Record<string, any>>;
  registerProvider: (name: string, provider: IConfigurationProvider) => void;
  getProvider: (name: string) => IConfigurationProvider;
} & IConfiguration;
