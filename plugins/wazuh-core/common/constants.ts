/*
 * Wazuh app - Wazuh Constants file
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import path from 'path';
import { version } from '../package.json';
// import { validate as validateNodeCronInterval } from 'node-cron';
import { SettingsValidator } from '../common/services/settings-validator';

// Plugin
export const PLUGIN_VERSION = version;
export const PLUGIN_VERSION_SHORT = version.split('.').splice(0, 2).join('.');

// Index patterns - Wazuh alerts
export const WAZUH_INDEX_TYPE_ALERTS = 'alerts';
export const WAZUH_ALERTS_PATTERN = 'wazuh-alerts*';

// Job - Wazuh initialize
export const WAZUH_PLUGIN_PLATFORM_TEMPLATE_NAME = 'wazuh-kibana';

// Sample data
export const WAZUH_SAMPLE_ALERT_PREFIX = 'wazuh-alerts-4.x-';
export const WAZUH_SAMPLE_ALERTS_INDEX_SHARDS = 1;
export const WAZUH_SAMPLE_ALERTS_INDEX_REPLICAS = 0;
export const WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY = 'security';
export const WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING =
  'auditing-policy-monitoring';
export const WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION = 'threat-detection';
export const WAZUH_SAMPLE_ALERTS_DEFAULT_NUMBER_ALERTS = 3000;
export const WAZUH_SAMPLE_ALERTS_CATEGORIES_TYPE_ALERTS = {
  [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY]: [
    { syscheck: true },
    { aws: true },
    { azure: true },
    { office: true },
    { gcp: true },
    { authentication: true },
    { ssh: true },
    { apache: true, alerts: 2000 },
    { web: true },
    { windows: { service_control_manager: true }, alerts: 1000 },
    { github: true },
  ],
  [WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING]: [
    { rootcheck: true },
    { audit: true },
    { virustotal: true },
    { yara: true },
  ],
  [WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION]: [
    { vulnerabilities: true },
    { docker: true },
    { mitre: true },
  ],
};

// Security
export const WAZUH_SECURITY_PLUGIN_OPENSEARCH_DASHBOARDS_SECURITY =
  'OpenSearch Dashboards Security';

export const WAZUH_SECURITY_PLUGINS = [
  WAZUH_SECURITY_PLUGIN_OPENSEARCH_DASHBOARDS_SECURITY,
];

// App configuration
export const WAZUH_CONFIGURATION_CACHE_TIME = 10000; // time in ms;

// Reserved ids for Users/Role mapping
export const WAZUH_API_RESERVED_ID_LOWER_THAN = 100;
export const WAZUH_API_RESERVED_WUI_SECURITY_RULES = [1, 2];

// Queue
export const WAZUH_QUEUE_CRON_FREQ = '*/15 * * * * *'; // Every 15 seconds

// Wazuh errors
export const WAZUH_ERROR_DAEMONS_NOT_READY = 'ERROR3099';

// Agents
export enum WAZUH_AGENTS_OS_TYPE {
  WINDOWS = 'windows',
  LINUX = 'linux',
  SUNOS = 'sunos',
  DARWIN = 'darwin',
  OTHERS = '',
}

export enum WAZUH_MODULES_ID {
  SECURITY_EVENTS = 'general',
  INTEGRITY_MONITORING = 'fim',
  AMAZON_WEB_SERVICES = 'aws',
  OFFICE_365 = 'office',
  GOOGLE_CLOUD_PLATFORM = 'gcp',
  POLICY_MONITORING = 'pm',
  SECURITY_CONFIGURATION_ASSESSMENT = 'sca',
  AUDITING = 'audit',
  VULNERABILITIES = 'vuls',
  DOCKER = 'docker',
  MITRE_ATTACK = 'mitre',
  PCI_DSS = 'pci',
  HIPAA = 'hipaa',
  NIST_800_53 = 'nist',
  TSC = 'tsc',
  VIRUSTOTAL = 'virustotal',
  GDPR = 'gdpr',
  GITHUB = 'github',
}

export enum WAZUH_MENU_MANAGEMENT_SECTIONS_ID {
  MANAGEMENT = 'management',
  ADMINISTRATION = 'administration',
  RULESET = 'ruleset',
  RULES = 'rules',
  DECODERS = 'decoders',
  CDB_LISTS = 'lists',
  GROUPS = 'groups',
  CONFIGURATION = 'configuration',
  STATUS_AND_REPORTS = 'statusReports',
  STATUS = 'status',
  CLUSTER = 'monitoring',
  LOGS = 'logs',
  REPORTING = 'reporting',
  STATISTICS = 'statistics',
}

export enum WAZUH_MENU_TOOLS_SECTIONS_ID {
  API_CONSOLE = 'devTools',
  RULESET_TEST = 'logtest',
}

export enum WAZUH_MENU_SECURITY_SECTIONS_ID {
  USERS = 'users',
  ROLES = 'roles',
  POLICIES = 'policies',
  ROLES_MAPPING = 'roleMapping',
}

export enum WAZUH_MENU_SETTINGS_SECTIONS_ID {
  SETTINGS = 'settings',
  API_CONFIGURATION = 'api',
  MODULES = 'modules',
  SAMPLE_DATA = 'sample_data',
  CONFIGURATION = 'configuration',
  LOGS = 'logs',
  MISCELLANEOUS = 'miscellaneous',
  ABOUT = 'about',
}

// Wazuh links
export const WAZUH_LINK_GITHUB = 'https://github.com/wazuh';
export const WAZUH_LINK_GOOGLE_GROUPS =
  'https://groups.google.com/forum/#!forum/wazuh';
export const WAZUH_LINK_SLACK = 'https://wazuh.com/community/join-us-on-slack';

export const HEALTH_CHECK = 'health-check';

// Health check
export const HEALTH_CHECK_REDIRECTION_TIME = 300; //ms

// Plugin platform settings
// TODO: remove these platform settings and migrate to the dashboard core
// Default timeFilter set by the app
export const WAZUH_PLUGIN_PLATFORM_SETTING_TIME_FILTER = {
  from: 'now-24h',
  to: 'now',
};
export const PLUGIN_PLATFORM_SETTING_NAME_TIME_FILTER =
  'timepicker:timeDefaults';

// Default maxBuckets set by the app
export const WAZUH_PLUGIN_PLATFORM_SETTING_MAX_BUCKETS = 200000;
export const PLUGIN_PLATFORM_SETTING_NAME_MAX_BUCKETS = 'timeline:max_buckets';

// Default metaFields set by the app
export const WAZUH_PLUGIN_PLATFORM_SETTING_METAFIELDS = ['_source', '_index'];
export const PLUGIN_PLATFORM_SETTING_NAME_METAFIELDS = 'metaFields';

// Logger
export const UI_LOGGER_LEVELS = {
  WARNING: 'WARNING',
  INFO: 'INFO',
  ERROR: 'ERROR',
};

export const UI_TOAST_COLOR = {
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
};

// Assets
export const ASSETS_BASE_URL_PREFIX = '/plugins/wazuh/assets/';
export const ASSETS_PUBLIC_URL = '/plugins/wazuh/public/assets/';

// Reports
export const REPORTS_PRIMARY_COLOR = '#256BD1';

// Plugin platform
export const PLUGIN_PLATFORM_NAME = 'dashboard';
export const PLUGIN_PLATFORM_INSTALLATION_USER = 'wazuh-dashboard';
export const PLUGIN_PLATFORM_INSTALLATION_USER_GROUP = 'wazuh-dashboard';
export const PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_UPGRADE_PLATFORM =
  'upgrade-guide';
export const PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_APP_CONFIGURATION =
  'user-manual/wazuh-dashboard/settings.html';

export const PLUGIN_PLATFORM_REQUEST_HEADERS = {
  'osd-xsrf': 'kibana',
};

// Plugin app
export const PLUGIN_APP_NAME = 'Dashboard';

// UI
export const UI_COLOR_STATUS = {
  success: '#007871',
  danger: '#BD271E',
  warning: '#FEC514',
  disabled: '#646A77',
  info: '#6092C0',
  default: '#000000',
} as const;

export const API_NAME_AGENT_STATUS = {
  ACTIVE: 'active',
  DISCONNECTED: 'disconnected',
  PENDING: 'pending',
  NEVER_CONNECTED: 'never_connected',
} as const;

export const UI_COLOR_AGENT_STATUS = {
  [API_NAME_AGENT_STATUS.ACTIVE]: UI_COLOR_STATUS.success,
  [API_NAME_AGENT_STATUS.DISCONNECTED]: UI_COLOR_STATUS.danger,
  [API_NAME_AGENT_STATUS.PENDING]: UI_COLOR_STATUS.warning,
  [API_NAME_AGENT_STATUS.NEVER_CONNECTED]: UI_COLOR_STATUS.disabled,
  default: UI_COLOR_STATUS.default,
} as const;

export const UI_LABEL_NAME_AGENT_STATUS = {
  [API_NAME_AGENT_STATUS.ACTIVE]: 'Active',
  [API_NAME_AGENT_STATUS.DISCONNECTED]: 'Disconnected',
  [API_NAME_AGENT_STATUS.PENDING]: 'Pending',
  [API_NAME_AGENT_STATUS.NEVER_CONNECTED]: 'Never connected',
  default: 'Unknown',
} as const;

export const UI_ORDER_AGENT_STATUS = [
  API_NAME_AGENT_STATUS.ACTIVE,
  API_NAME_AGENT_STATUS.DISCONNECTED,
  API_NAME_AGENT_STATUS.PENDING,
  API_NAME_AGENT_STATUS.NEVER_CONNECTED,
];

export const AGENT_SYNCED_STATUS = {
  SYNCED: 'synced',
  NOT_SYNCED: 'not synced',
};

// The status code can be seen here https://github.com/wazuh/wazuh/blob/686068a1f05d806b2e3b3d633a765320ae7ae114/src/wazuh_db/wdb.h#L55-L61

export const AGENT_STATUS_CODE = [
  {
    STATUS_CODE: 0,
    STATUS_DESCRIPTION: 'Agent is connected',
  },
  {
    STATUS_CODE: 1,
    STATUS_DESCRIPTION: 'Invalid agent version',
  },
  {
    STATUS_CODE: 2,
    STATUS_DESCRIPTION: 'Error retrieving version',
  },
  {
    STATUS_CODE: 3,
    STATUS_DESCRIPTION: 'Shutdown message received',
  },
  {
    STATUS_CODE: 4,
    STATUS_DESCRIPTION: 'Disconnected because no keepalive received',
  },
  {
    STATUS_CODE: 5,
    STATUS_DESCRIPTION: 'Connection reset by manager',
  },
];

// Documentation
export const DOCUMENTATION_WEB_BASE_URL = 'https://documentation.wazuh.com';

// Default Elasticsearch user name context
export const ELASTIC_NAME = 'elastic';

// Default Wazuh indexer name
export const WAZUH_INDEXER_NAME = 'indexer';

// Not timeFieldName on index pattern
export const NOT_TIME_FIELD_NAME_INDEX_PATTERN =
  'not_time_field_name_index_pattern';

export enum EConfigurationProviders {
  INITIALIZER_CONTEXT = 'initializerContext',
  PLUGIN_UI_SETTINGS = 'uiSettings',
}

// Plugin settings
export enum SettingCategory {
  GENERAL,
  HEALTH_CHECK,
  SECURITY,
  CUSTOMIZATION,
  API_CONNECTION,
}

type TPluginSettingOptionsTextArea = {
  maxRows?: number;
  minRows?: number;
  maxLength?: number;
};

type TPluginSettingOptionsSelect = {
  select: { text: string; value: any }[];
};

type TPluginSettingOptionsEditor = {
  editor: {
    language: string;
  };
};

type TPluginSettingOptionsFile = {
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

type TPluginSettingOptionsNumber = {
  number: {
    min?: number;
    max?: number;
    integer?: boolean;
  };
};

type TPluginSettingOptionsSwitch = {
  switch: {
    values: {
      disabled: { label?: string; value: any };
      enabled: { label?: string; value: any };
    };
  };
};

export enum EpluginSettingType {
  text = 'text',
  textarea = 'textarea',
  switch = 'switch',
  number = 'number',
  editor = 'editor',
  select = 'select',
  filepicker = 'filepicker',
  password = 'password',
  arrayOf = 'arrayOf',
  custom = 'custom',
  objectOf = 'objectOf',
}

interface TPluginSettingOptionsObjectOf {
  /* eslint-disable no-use-before-define */
  objectOf: Record<string, TPluginSetting>;
}

interface TPluginSettingOptionsArrayOf {
  arrayOf: TPluginSetting;
}

type TPlugingSettingOptions =
  | TPluginSettingOptionsTextArea
  | TPluginSettingOptionsSelect
  | TPluginSettingOptionsEditor
  | TPluginSettingOptionsFile
  | TPluginSettingOptionsNumber
  | TPluginSettingOptionsSwitch
  | TPluginSettingOptionsObjectOf
  | TPluginSettingOptionsArrayOf;

interface TPluginSetting {
  // Define the text displayed in the UI.
  title: string;
  // Description.
  description: string;
  // Category.
  category: SettingCategory;
  // Type.
  type: EpluginSettingType;
  source: EConfigurationProviders;
  options?: TPlugingSettingOptions;
  // Default value.
  defaultValue: any;
  validate?: (value: any) => string | undefined;
}

export const PLUGIN_SETTINGS: Record<string, TPluginSetting> = {
  'enrollment.dns': {
    title: 'Enrollment DNS',
    description:
      'Specifies the Wazuh registration server, used for the agent enrollment.',
    source: EConfigurationProviders.PLUGIN_UI_SETTINGS,
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.text,
    defaultValue: '',
    validate: SettingsValidator.compose(
      SettingsValidator.isString,
      SettingsValidator.serverAddressHostnameFQDNIPv4IPv6,
    ),
  },
  hideManagerAlerts: {
    title: 'Hide manager alerts',
    description: 'Hide the alerts of the manager in every dashboard.',
    source: EConfigurationProviders.PLUGIN_UI_SETTINGS,
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.switch,
    defaultValue: false,
    validate: SettingsValidator.isBoolean,
  },
  /* `# The following configuration is the default structure to define a host.
#
# hosts:
#   # Host ID / name,
#   - env-1:
#       # Host URL
#       url: https://env-1.example
#       # Host / API port
#       port: 55000
#       # Host / API username
#       username: wazuh-wui
#       # Host / API password
#       password: wazuh-wui
#       # Use RBAC or not. If set to true, the username must be "wazuh-wui".
#       run_as: true
#   - env-2:
#       url: https://env-2.example
#       port: 55000
#       username: wazuh-wui
#       password: wazuh-wui
#       run_as: true

hosts:
  - default:
      url: https://localhost
      port: 55000
      username: wazuh-wui
      password: wazuh-wui
      run_as: false`,
  */
  hosts: {
    title: 'Server hosts',
    description: 'Configure the API connections.',
    source: EConfigurationProviders.INITIALIZER_CONTEXT,
    category: SettingCategory.API_CONNECTION,
    type: EpluginSettingType.objectOf,
    defaultValue: [],
    options: {
      objectOf: {
        url: {
          title: 'URL',
          description: 'Server URL address',
          type: EpluginSettingType.text,
          defaultValue: 'https://localhost',
          validate: SettingsValidator.compose(
            SettingsValidator.isString,
            SettingsValidator.isNotEmptyString,
          ),
        },
        port: {
          title: 'Port',
          description: 'Port',
          type: EpluginSettingType.number,
          defaultValue: 55000,
          options: {
            number: {
              min: 0,
              max: 65535,
              integer: true,
            },
          },
          validate: function (value) {
            return SettingsValidator.number(this.options?.number)(value);
          },
        },
        username: {
          title: 'Username',
          description: 'Server API username',
          type: EpluginSettingType.text,
          defaultValue: 'wazuh-wui',
          validate: SettingsValidator.compose(
            SettingsValidator.isString,
            SettingsValidator.isNotEmptyString,
          ),
        },
        password: {
          title: 'Password',
          description: "User's Password",
          type: EpluginSettingType.password,
          defaultValue: 'wazuh-wui',
          validate: SettingsValidator.compose(
            SettingsValidator.isString,
            SettingsValidator.isNotEmptyString,
          ),
        },
        run_as: {
          title: 'Run as',
          description: 'Use the authentication context.',
          type: EpluginSettingType.switch,
          defaultValue: false,
          options: {
            switch: {
              values: {
                disabled: { label: 'false', value: false },
                enabled: { label: 'true', value: true },
              },
            },
          },
          validate: SettingsValidator.isBoolean,
        },
      },
    },
  },
  'ip.ignore': {
    title: 'Index pattern ignore',
    description:
      'Disable certain index pattern names from being available in index pattern selector.',
    source: EConfigurationProviders.PLUGIN_UI_SETTINGS,
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.editor,
    defaultValue: [],
    validate: SettingsValidator.compose(
      SettingsValidator.stringAsList(
        SettingsValidator.compose(
          SettingsValidator.isString,
          SettingsValidator.isNotEmptyString,
          SettingsValidator.hasNoSpaces,
          SettingsValidator.noLiteralString('.', '..'),
          SettingsValidator.noStartsWithString('-', '_', '+', '.'),
          SettingsValidator.hasNotInvalidCharacters(
            '\\',
            '/',
            '?',
            '"',
            '<',
            '>',
            '|',
            ',',
            '#',
          ),
        ),
      ),
    ),
  },
  'wazuh.updates.disabled': {
    title: 'Check updates',
    description: 'Define if the check updates service is disabled.',
    source: EConfigurationProviders.PLUGIN_UI_SETTINGS,
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.switch,
    defaultValue: false,
    validate: SettingsValidator.isBoolean,
  },
  pattern: {
    title: 'Index pattern',
    description:
      "Default index pattern to use on the app. If there's no valid index pattern, the app will automatically create one with the name indicated in this option.",
    source: EConfigurationProviders.PLUGIN_UI_SETTINGS,
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.text,
    defaultValue: WAZUH_ALERTS_PATTERN,
    // Validation: https://github.com/elastic/elasticsearch/blob/v7.10.2/docs/reference/indices/create-index.asciidoc
    validate: SettingsValidator.compose(
      SettingsValidator.isString,
      SettingsValidator.isNotEmptyString,
      SettingsValidator.hasNoSpaces,
      SettingsValidator.noLiteralString('.', '..'),
      SettingsValidator.noStartsWithString('-', '_', '+', '.'),
      SettingsValidator.hasNotInvalidCharacters(
        '\\',
        '/',
        '?',
        '"',
        '<',
        '>',
        '|',
        ',',
        '#',
      ),
    ),
  },
  timeout: {
    title: 'Request timeout',
    description:
      'Maximum time, in milliseconds, the app will wait for an API response when making requests to it. It will be ignored if the value is set under 1500 milliseconds.',
    source: EConfigurationProviders.PLUGIN_UI_SETTINGS,
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.number,
    defaultValue: 20000,
    options: {
      number: {
        min: 1500,
        integer: true,
      },
    },
    validate: function (value) {
      return SettingsValidator.number(this.options?.number)(value);
    },
  },
  'reports.csv.maxRows': {
    title: 'Max rows in csv reports',
    description:
      'Maximum rows that will be included in csv reports. If the number of rows exceeds this value, the report will be truncated. Setting a high value can cause instability of the report generating process.',
    source: EConfigurationProviders.PLUGIN_UI_SETTINGS,
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.number,
    defaultValue: 10000,
    options: {
      number: {
        min: 0,
        integer: true,
      },
    },
    validate: function (value) {
      return SettingsValidator.number(this.options?.number)(value);
    },
  },
};

export type TPluginSettingKey = keyof typeof PLUGIN_SETTINGS;

export enum HTTP_STATUS_CODES {
  CONTINUE = 100,
  SWITCHING_PROTOCOLS = 101,
  PROCESSING = 102,
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NON_AUTHORITATIVE_INFORMATION = 203,
  NO_CONTENT = 204,
  RESET_CONTENT = 205,
  PARTIAL_CONTENT = 206,
  MULTI_STATUS = 207,
  MULTIPLE_CHOICES = 300,
  MOVED_PERMANENTLY = 301,
  MOVED_TEMPORARILY = 302,
  SEE_OTHER = 303,
  NOT_MODIFIED = 304,
  USE_PROXY = 305,
  TEMPORARY_REDIRECT = 307,
  PERMANENT_REDIRECT = 308,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  PAYMENT_REQUIRED = 402,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  PROXY_AUTHENTICATION_REQUIRED = 407,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  GONE = 410,
  LENGTH_REQUIRED = 411,
  PRECONDITION_FAILED = 412,
  REQUEST_TOO_LONG = 413,
  REQUEST_URI_TOO_LONG = 414,
  UNSUPPORTED_MEDIA_TYPE = 415,
  REQUESTED_RANGE_NOT_SATISFIABLE = 416,
  EXPECTATION_FAILED = 417,
  IM_A_TEAPOT = 418,
  INSUFFICIENT_SPACE_ON_RESOURCE = 419,
  METHOD_FAILURE = 420,
  MISDIRECTED_REQUEST = 421,
  UNPROCESSABLE_ENTITY = 422,
  LOCKED = 423,
  FAILED_DEPENDENCY = 424,
  PRECONDITION_REQUIRED = 428,
  TOO_MANY_REQUESTS = 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE = 431,
  UNAVAILABLE_FOR_LEGAL_REASONS = 451,
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
  HTTP_VERSION_NOT_SUPPORTED = 505,
  INSUFFICIENT_STORAGE = 507,
  NETWORK_AUTHENTICATION_REQUIRED = 511,
}

// Search bar

// This limits the results in the API request
export const SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT = 30;
// This limits the suggestions for the token of type value displayed in the search bar
export const SEARCH_BAR_WQL_VALUE_SUGGESTIONS_DISPLAY_COUNT = 10;
/* Time in milliseconds to debounce the analysis of search bar. This mitigates some problems related
to changes running in parallel */
export const SEARCH_BAR_DEBOUNCE_UPDATE_TIME = 400;

// Plugin settings
export const WAZUH_CORE_ENCRYPTION_PASSWORD = 'secretencryptionkey!';

// Configuration backend service
export const WAZUH_CORE_CONFIGURATION_INSTANCE = 'wazuh-dashboard';
export const WAZUH_CORE_CONFIGURATION_CACHE_SECONDS = 10;

// API connection permissions
export const WAZUH_ROLE_ADMINISTRATOR_ID = 1;

// ID used to refer the createOsdUrlStateStorage state
export const OSD_URL_STATE_STORAGE_ID = 'state:storeInSessionStorage';

// TODO: review if required
// uiSettings

export const HIDE_MANAGER_ALERTS_SETTING = 'hideManagerAlerts';
export const ENROLLMENT_DNS = 'enrollment.dns';
export const ENROLLMENT_PASSWORD = 'enrollment.password';
export const IP_IGNORE = 'ip.ignore';
export const WAZUH_UPDATES_DISABLED = 'wazuh.updates.disabled';
export const REQUEST_TIMEOUT = 'timeout';
