import { RequestHandlerContext } from 'opensearch-dashboards/server';
import type { ManageHosts } from "../../wazuh-core/server/services";
import { OpenSearchDashboardsRequest } from 'src/core/server/http';

export type UserAuthenticate = (apiHostID: string) => Promise<string>;

export type UserRequestOptions = { apiHostID: string; forceRefresh?: boolean };
export type UserRequest = (
  method: string,
  path: string,
  data: any,
  options: UserRequestOptions
) => Promise<any>;

export type AsUser = {
  authenticate: UserAuthenticate;
  request: UserRequest;
};

export type ApiClient = {
  asInternalUser: AsUser;
  asCurrentUser: AsUser;
};

type CurrentUser = {
  username?: string;
  authContext: { [key: string]: any };
};

export interface ISecurityFactory {
  platform?: string;
  getCurrentUser(
    request: OpenSearchDashboardsRequest,
    context?: RequestHandlerContext
  ): Promise<CurrentUser>;
  isAdministratorUser(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest
  ): Promise<{ administrator: any; administrator_requirements: any }>;
}

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
  validate?: (value: string) => string | undefined;
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
  _settings: Map<string, TConfigurationSetting>;
  getSettingValue(settingKey: string, value?: any): any;
  getSettingValueIfNotSet(settingKey: string, value?: any): any;
}

export type WazuhCore = {
  api: { client: ApiClient };
  dashboardSecurity: ISecurityFactory;
  configuration: IConfiguration;
  manageHosts: ManageHosts;
};
