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
export const WAZUH_ALERTS_PREFIX = 'wazuh-alerts-';
export const WAZUH_ALERTS_PATTERN = 'wazuh-alerts-*';

// Job - Wazuh monitoring
export const WAZUH_INDEX_TYPE_MONITORING = 'monitoring';
export const WAZUH_MONITORING_PREFIX = 'wazuh-monitoring-';
export const WAZUH_MONITORING_PATTERN = 'wazuh-monitoring-*';
export const WAZUH_MONITORING_TEMPLATE_NAME = 'wazuh-agent';
export const WAZUH_MONITORING_DEFAULT_INDICES_SHARDS = 1;
export const WAZUH_MONITORING_DEFAULT_INDICES_REPLICAS = 0;
export const WAZUH_MONITORING_DEFAULT_CREATION = 'w';
export const WAZUH_MONITORING_DEFAULT_ENABLED = true;
export const WAZUH_MONITORING_DEFAULT_FREQUENCY = 900;
export const WAZUH_MONITORING_DEFAULT_CRON_FREQ = '0 * * * * *';

// Job - Wazuh statistics
export const WAZUH_INDEX_TYPE_STATISTICS = 'statistics';
export const WAZUH_STATISTICS_DEFAULT_PREFIX = 'wazuh';
export const WAZUH_STATISTICS_DEFAULT_NAME = 'statistics';
export const WAZUH_STATISTICS_PATTERN = `${WAZUH_STATISTICS_DEFAULT_PREFIX}-${WAZUH_STATISTICS_DEFAULT_NAME}-*`;
export const WAZUH_STATISTICS_TEMPLATE_NAME = `${WAZUH_STATISTICS_DEFAULT_PREFIX}-${WAZUH_STATISTICS_DEFAULT_NAME}`;
export const WAZUH_STATISTICS_DEFAULT_INDICES_SHARDS = 1;
export const WAZUH_STATISTICS_DEFAULT_INDICES_REPLICAS = 0;
export const WAZUH_STATISTICS_DEFAULT_CREATION = 'w';
export const WAZUH_STATISTICS_DEFAULT_STATUS = true;
export const WAZUH_STATISTICS_DEFAULT_FREQUENCY = 900;
export const WAZUH_STATISTICS_DEFAULT_CRON_FREQ = '0 */5 * * * *';

// Wazuh vulnerabilities
export const WAZUH_VULNERABILITIES_PATTERN = 'wazuh-states-vulnerabilities-*';
export const WAZUH_INDEX_TYPE_VULNERABILITIES = 'vulnerabilities';

// FIM
export const WAZUH_FIM_FILES_PATTERN = 'wazuh-states-fim-files-*';
export const WAZUH_FIM_REGISTRIES_PATTERN = 'wazuh-states-fim-registries-*';

// System inventory
export const WAZUH_SYSTEM_INVENTORY_HARDWARE_PATTERN =
  'wazuh-states-inventory-hardware-*';
export const WAZUH_SYSTEM_INVENTORY_HOTFIXES_PATTERN =
  'wazuh-states-inventory-hotfixes-*';
export const WAZUH_SYSTEM_INVENTORY_INTERFACES_PATTERN =
  'wazuh-states-inventory-interfaces-*';
export const WAZUH_SYSTEM_INVENTORY_NETWORKS_PATTERN =
  'wazuh-states-inventory-networks-*';
export const WAZUH_SYSTEM_INVENTORY_PACKAGES_PATTERN =
  'wazuh-states-inventory-packages-*';
export const WAZUH_SYSTEM_INVENTORY_PORTS_PATTERN =
  'wazuh-states-inventory-ports-*';
export const WAZUH_SYSTEM_INVENTORY_PROCESSES_PATTERN =
  'wazuh-states-inventory-processes-*';
export const WAZUH_SYSTEM_INVENTORY_PROTOCOLS_PATTERN =
  'wazuh-states-inventory-protocols-*';
export const WAZUH_SYSTEM_INVENTORY_SYSTEM_PATTERN =
  'wazuh-states-inventory-system-*';

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
    { openscap: true },
    { ciscat: true },
    { virustotal: true },
    { yara: true },
  ],
  [WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION]: [
    { vulnerabilities: true },
    { osquery: true },
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

// Wazuh data path
const WAZUH_DATA_PLUGIN_PLATFORM_BASE_PATH = 'data';
export const WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH = path.join(
  __dirname,
  '../../../',
  WAZUH_DATA_PLUGIN_PLATFORM_BASE_PATH,
);
export const WAZUH_DATA_ABSOLUTE_PATH = path.join(
  WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH,
  'wazuh',
);

// Wazuh data path - config
export const WAZUH_DATA_CONFIG_DIRECTORY_PATH = path.join(
  WAZUH_DATA_ABSOLUTE_PATH,
  'config',
);
export const WAZUH_DATA_CONFIG_REGISTRY_PATH = path.join(
  WAZUH_DATA_CONFIG_DIRECTORY_PATH,
  'wazuh-registry.json',
);

export const WAZUH_DATA_CONFIG_APP_PATH = path.join(
  WAZUH_DATA_CONFIG_DIRECTORY_PATH,
  'wazuh.yml',
);

// Wazuh data path - downloads
export const WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH = path.join(
  WAZUH_DATA_ABSOLUTE_PATH,
  'downloads',
);
export const WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH = path.join(
  WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH,
  'reports',
);

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
  OPEN_SCAP = 'oscap',
  VULNERABILITIES = 'vuls',
  OSQUERY = 'osquery',
  DOCKER = 'docker',
  MITRE_ATTACK = 'mitre',
  PCI_DSS = 'pci',
  HIPAA = 'hipaa',
  NIST_800_53 = 'nist',
  TSC = 'tsc',
  CIS_CAT = 'ciscat',
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

export const AUTHORIZED_AGENTS = 'authorized-agents';

// Wazuh links
export const WAZUH_LINK_GITHUB = 'https://github.com/wazuh';
export const WAZUH_LINK_GOOGLE_GROUPS =
  'https://groups.google.com/forum/#!forum/wazuh';
export const WAZUH_LINK_SLACK = 'https://wazuh.com/community/join-us-on-slack';

export const HEALTH_CHECK = 'health-check';

// Health check
export const HEALTH_CHECK_REDIRECTION_TIME = 300; //ms

// Plugin platform settings
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
export const REPORTS_LOGO_IMAGE_ASSETS_RELATIVE_PATH =
  'images/logo_reports.png';
export const REPORTS_PRIMARY_COLOR = '#256BD1';
export const REPORTS_PAGE_FOOTER_TEXT = 'Copyright © Wazuh, Inc.';
export const REPORTS_PAGE_HEADER_TEXT = 'info@wazuh.com\nhttps://wazuh.com';

// Plugin platform
export const PLUGIN_PLATFORM_NAME = 'dashboard';
export const PLUGIN_PLATFORM_INSTALLATION_USER = 'wazuh-dashboard';
export const PLUGIN_PLATFORM_INSTALLATION_USER_GROUP = 'wazuh-dashboard';
export const PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_UPGRADE_PLATFORM =
  'upgrade-guide';
export const PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_TROUBLESHOOTING =
  'user-manual/wazuh-dashboard/troubleshooting.html';
export const PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_APP_CONFIGURATION =
  'user-manual/wazuh-dashboard/config-file.html';
export const PLUGIN_PLATFORM_URL_GUIDE =
  'https://opensearch.org/docs/2.10/about';
export const PLUGIN_PLATFORM_URL_GUIDE_TITLE = 'OpenSearch guide';

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

// Customization
export const CUSTOMIZATION_ENDPOINT_PAYLOAD_UPLOAD_CUSTOM_FILE_MAXIMUM_BYTES = 1048576;

// Plugin settings
export enum SettingCategory {
  GENERAL,
  HEALTH_CHECK,
  MONITORING,
  STATISTICS,
  VULNERABILITIES,
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
}

export type TPluginSetting = {
  // Define the text displayed in the UI.
  title: string;
  // Description.
  description: string;
  // Category.
  category: SettingCategory;
  // Type.
  type: EpluginSettingType;
  // Store
  store: {
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
  // Default value.
  defaultValue: any;
  /* Special: This is used for the settings of customization to get the hidden default value, because the default value is empty to not to be displayed on the App Settings. */
  defaultValueIfNotSet?: any;
  // Configurable from the App Settings app.
  isConfigurableFromSettings: boolean;
  // Modify the setting requires running the plugin health check (frontend).
  requiresRunningHealthCheck?: boolean;
  // Modify the setting requires reloading the browser tab (frontend).
  requiresReloadingBrowserTab?: boolean;
  // Modify the setting requires restarting the plugin platform to take effect.
  requiresRestartingPluginPlatform?: boolean;
  // Define options related to the `type`.
  options?:
    | TPluginSettingOptionsEditor
    | TPluginSettingOptionsFile
    | TPluginSettingOptionsNumber
    | TPluginSettingOptionsSelect
    | TPluginSettingOptionsSwitch
    | TPluginSettingOptionsTextArea;
  // Transform the input value. The result is saved in the form global state of Settings/Configuration
  uiFormTransformChangedInputValue?: (value: any) => any;
  // Transform the configuration value or default as initial value for the input in Settings/Configuration
  uiFormTransformConfigurationValueToInputValue?: (value: any) => any;
  // Transform the input value changed in the form of Settings/Configuration and returned in the `changed` property of the hook useForm
  uiFormTransformInputValueToConfigurationValue?: (value: any) => any;
  // Validate the value in the form of Settings/Configuration. It returns a string if there is some validation error.
  validateUIForm?: (value: any) => string | undefined;
  // Validate function creator to validate the setting in the backend.
  validate?: (value: unknown) => string | undefined;
};

export type TPluginSettingWithKey = TPluginSetting & { key: TPluginSettingKey };
export type TPluginSettingCategory = {
  title: string;
  description?: string;
  documentationLink?: string;
  renderOrder?: number;
};

export const PLUGIN_SETTINGS_CATEGORIES: {
  [category: number]: TPluginSettingCategory;
} = {
  [SettingCategory.HEALTH_CHECK]: {
    title: 'Health check',
    description: "Checks will be executed by the app's Healthcheck.",
    renderOrder: SettingCategory.HEALTH_CHECK,
  },
  [SettingCategory.GENERAL]: {
    title: 'General',
    description:
      'Basic app settings related to alerts index pattern, hide the manager alerts in the dashboards, logs level and more.',
    renderOrder: SettingCategory.GENERAL,
  },
  [SettingCategory.SECURITY]: {
    title: 'Security',
    description: 'Application security options such as unauthorized roles.',
    renderOrder: SettingCategory.SECURITY,
  },
  [SettingCategory.MONITORING]: {
    title: 'Task:Monitoring',
    description:
      'Options related to the agent status monitoring job and its storage in indexes.',
    renderOrder: SettingCategory.MONITORING,
  },
  [SettingCategory.STATISTICS]: {
    title: 'Task:Statistics',
    description:
      'Options related to the daemons manager monitoring job and their storage in indexes.',
    renderOrder: SettingCategory.STATISTICS,
  },
  [SettingCategory.VULNERABILITIES]: {
    title: 'Vulnerabilities',
    description:
      'Options related to the agent vulnerabilities monitoring job and its storage in indexes.',
    renderOrder: SettingCategory.VULNERABILITIES,
  },
  [SettingCategory.CUSTOMIZATION]: {
    title: 'Custom branding',
    description:
      'If you want to use custom branding elements such as logos, you can do so by editing the settings below.',
    documentationLink: 'user-manual/wazuh-dashboard/white-labeling.html',
    renderOrder: SettingCategory.CUSTOMIZATION,
  },
  [SettingCategory.API_CONNECTION]: {
    title: 'API connections',
    description: 'Options related to the API connections.',
    renderOrder: SettingCategory.API_CONNECTION,
  },
};

export const PLUGIN_SETTINGS: { [key: string]: TPluginSetting } = {
  'alerts.sample.prefix': {
    title: 'Sample alerts prefix',
    description:
      'Define the index name prefix of sample alerts. It must match the template used by the index pattern to avoid unknown fields in dashboards.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.text,
    defaultValue: WAZUH_SAMPLE_ALERT_PREFIX,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: true,
    validateUIForm: function (value) {
      return this.validate(value);
    },
    // Validation: https://github.com/elastic/elasticsearch/blob/v7.10.2/docs/reference/indices/create-index.asciidoc
    validate: SettingsValidator.compose(
      SettingsValidator.isString,
      SettingsValidator.isNotEmptyString,
      SettingsValidator.hasNoSpaces,
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
        '*',
      ),
    ),
  },
  'checks.api': {
    title: 'API connection',
    description: 'Enable or disable the API health check when opening the app.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.HEALTH_CHECK,
    type: EpluginSettingType.switch,
    defaultValue: true,
    isConfigurableFromSettings: true,
    options: {
      switch: {
        values: {
          disabled: { label: 'false', value: false },
          enabled: { label: 'true', value: true },
        },
      },
    },
    uiFormTransformChangedInputValue: function (
      value: boolean | string,
    ): boolean {
      return Boolean(value);
    },
    validateUIForm: function (value) {
      return this.validate(value);
    },
    validate: SettingsValidator.isBoolean,
  },
  'checks.fields': {
    title: 'Known fields',
    description:
      'Enable or disable the known fields health check when opening the app.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.HEALTH_CHECK,
    type: EpluginSettingType.switch,
    defaultValue: true,
    isConfigurableFromSettings: true,
    options: {
      switch: {
        values: {
          disabled: { label: 'false', value: false },
          enabled: { label: 'true', value: true },
        },
      },
    },
    uiFormTransformChangedInputValue: function (
      value: boolean | string,
    ): boolean {
      return Boolean(value);
    },
    validateUIForm: function (value) {
      return this.validate(value);
    },
    validate: SettingsValidator.isBoolean,
  },
  'checks.maxBuckets': {
    title: 'Set max buckets to 200000',
    description:
      'Change the default value of the plugin platform max buckets configuration.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.HEALTH_CHECK,
    type: EpluginSettingType.switch,
    defaultValue: true,
    isConfigurableFromSettings: true,
    options: {
      switch: {
        values: {
          disabled: { label: 'false', value: false },
          enabled: { label: 'true', value: true },
        },
      },
    },
    uiFormTransformChangedInputValue: function (
      value: boolean | string,
    ): boolean {
      return Boolean(value);
    },
    validateUIForm: function (value) {
      return this.validate(value);
    },
    validate: SettingsValidator.isBoolean,
  },
  'checks.metaFields': {
    title: 'Remove meta fields',
    description:
      'Change the default value of the plugin platform metaField configuration.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.HEALTH_CHECK,
    type: EpluginSettingType.switch,
    defaultValue: true,
    isConfigurableFromSettings: true,
    options: {
      switch: {
        values: {
          disabled: { label: 'false', value: false },
          enabled: { label: 'true', value: true },
        },
      },
    },
    uiFormTransformChangedInputValue: function (
      value: boolean | string,
    ): boolean {
      return Boolean(value);
    },
    validateUIForm: function (value) {
      return this.validate(value);
    },
    validate: SettingsValidator.isBoolean,
  },
  'checks.pattern': {
    title: 'Index pattern',
    description:
      'Enable or disable the index pattern health check when opening the app.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.HEALTH_CHECK,
    type: EpluginSettingType.switch,
    defaultValue: true,
    isConfigurableFromSettings: true,
    options: {
      switch: {
        values: {
          disabled: { label: 'false', value: false },
          enabled: { label: 'true', value: true },
        },
      },
    },
    uiFormTransformChangedInputValue: function (
      value: boolean | string,
    ): boolean {
      return Boolean(value);
    },
    validateUIForm: function (value) {
      return this.validate(value);
    },
    validate: SettingsValidator.isBoolean,
  },
  'checks.setup': {
    title: 'API version',
    description:
      'Enable or disable the setup health check when opening the app.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.HEALTH_CHECK,
    type: EpluginSettingType.switch,
    defaultValue: true,
    isConfigurableFromSettings: true,
    options: {
      switch: {
        values: {
          disabled: { label: 'false', value: false },
          enabled: { label: 'true', value: true },
        },
      },
    },
    uiFormTransformChangedInputValue: function (
      value: boolean | string,
    ): boolean {
      return Boolean(value);
    },
    validateUIForm: function (value) {
      return this.validate(value);
    },
    validate: SettingsValidator.isBoolean,
  },
  'checks.template': {
    title: 'Index template',
    description:
      'Enable or disable the template health check when opening the app.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.HEALTH_CHECK,
    type: EpluginSettingType.switch,
    defaultValue: true,
    isConfigurableFromSettings: true,
    options: {
      switch: {
        values: {
          disabled: { label: 'false', value: false },
          enabled: { label: 'true', value: true },
        },
      },
    },
    uiFormTransformChangedInputValue: function (
      value: boolean | string,
    ): boolean {
      return Boolean(value);
    },
    validateUIForm: function (value) {
      return this.validate(value);
    },
    validate: SettingsValidator.isBoolean,
  },
  'checks.timeFilter': {
    title: 'Set time filter to 24h',
    description:
      'Change the default value of the plugin platform timeFilter configuration.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.HEALTH_CHECK,
    type: EpluginSettingType.switch,
    defaultValue: true,
    isConfigurableFromSettings: true,
    options: {
      switch: {
        values: {
          disabled: { label: 'false', value: false },
          enabled: { label: 'true', value: true },
        },
      },
    },
    uiFormTransformChangedInputValue: function (
      value: boolean | string,
    ): boolean {
      return Boolean(value);
    },
    validateUIForm: function (value) {
      return this.validate(value);
    },
    validate: SettingsValidator.isBoolean,
  },
  'configuration.ui_api_editable': {
    title: 'Configuration UI editable',
    description:
      'Enable or disable the ability to edit the configuration from UI or API endpoints. When disabled, this can only be edited from the configuration file, the related API endpoints are disabled, and the UI is inaccessible.',
    store: {
      file: {
        configurableManaged: false,
      },
    },
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.switch,
    defaultValue: true,
    isConfigurableFromSettings: false,
    requiresRestartingPluginPlatform: true,
    options: {
      switch: {
        values: {
          disabled: { label: 'false', value: false },
          enabled: { label: 'true', value: true },
        },
      },
    },
    uiFormTransformChangedInputValue: function (
      value: boolean | string,
    ): boolean {
      return Boolean(value);
    },
    validateUIForm: function (value) {
      return this.validate(value);
    },
    validate: SettingsValidator.isBoolean,
  },
  'cron.prefix': {
    title: 'Cron prefix',
    description: 'Define the index prefix of predefined jobs.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.text,
    defaultValue: WAZUH_STATISTICS_DEFAULT_PREFIX,
    isConfigurableFromSettings: true,
    validateUIForm: function (value) {
      return this.validate(value);
    },
    // Validation: https://github.com/elastic/elasticsearch/blob/v7.10.2/docs/reference/indices/create-index.asciidoc
    validate: SettingsValidator.compose(
      SettingsValidator.isString,
      SettingsValidator.isNotEmptyString,
      SettingsValidator.hasNoSpaces,
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
        '*',
      ),
    ),
  },
  'cron.statistics.apis': {
    title: 'Includes APIs',
    description:
      'Enter the ID of the hosts you want to save data from, leave this empty to run the task on every host.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.STATISTICS,
    type: EpluginSettingType.editor,
    defaultValue: [],
    isConfigurableFromSettings: true,
    options: {
      editor: {
        language: 'json',
      },
    },
    uiFormTransformConfigurationValueToInputValue: function (value: any): any {
      return JSON.stringify(value);
    },
    uiFormTransformInputValueToConfigurationValue: function (
      value: string,
    ): any {
      try {
        return JSON.parse(value);
      } catch (error) {
        return value;
      }
    },
    validateUIForm: function (value) {
      return SettingsValidator.json(this.validate)(value);
    },
    validate: SettingsValidator.compose(
      SettingsValidator.array(
        SettingsValidator.compose(
          SettingsValidator.isString,
          SettingsValidator.isNotEmptyString,
          SettingsValidator.hasNoSpaces,
        ),
      ),
    ),
  },
  'cron.statistics.index.creation': {
    title: 'Index creation',
    description: 'Define the interval in which a new index will be created.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.STATISTICS,
    type: EpluginSettingType.select,
    options: {
      select: [
        {
          text: 'Hourly',
          value: 'h',
        },
        {
          text: 'Daily',
          value: 'd',
        },
        {
          text: 'Weekly',
          value: 'w',
        },
        {
          text: 'Monthly',
          value: 'm',
        },
      ],
    },
    defaultValue: WAZUH_STATISTICS_DEFAULT_CREATION,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: true,
    validateUIForm: function (value) {
      return this.validate(value);
    },
    validate: function (value) {
      return SettingsValidator.literal(
        this.options.select.map(({ value }) => value),
      )(value);
    },
  },
  'cron.statistics.index.name': {
    title: 'Index name',
    description:
      'Define the name of the index in which the documents will be saved.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.STATISTICS,
    type: EpluginSettingType.text,
    defaultValue: WAZUH_STATISTICS_DEFAULT_NAME,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: true,
    validateUIForm: function (value) {
      return this.validate(value);
    },
    // Validation: https://github.com/elastic/elasticsearch/blob/v7.10.2/docs/reference/indices/create-index.asciidoc
    validate: SettingsValidator.compose(
      SettingsValidator.isString,
      SettingsValidator.isNotEmptyString,
      SettingsValidator.hasNoSpaces,
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
        '*',
      ),
    ),
  },
  'cron.statistics.index.replicas': {
    title: 'Index replicas',
    description:
      'Define the number of replicas to use for the statistics indices.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.STATISTICS,
    type: EpluginSettingType.number,
    defaultValue: WAZUH_STATISTICS_DEFAULT_INDICES_REPLICAS,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: true,
    options: {
      number: {
        min: 0,
        integer: true,
      },
    },
    uiFormTransformConfigurationValueToInputValue: function (
      value: number,
    ): string {
      return String(value);
    },
    uiFormTransformInputValueToConfigurationValue: function (
      value: string,
    ): number {
      return Number(value);
    },
    validateUIForm: function (value) {
      return this.validate(
        this.uiFormTransformInputValueToConfigurationValue(value),
      );
    },
    validate: function (value) {
      return SettingsValidator.number(this.options.number)(value);
    },
  },
  'cron.statistics.index.shards': {
    title: 'Index shards',
    description:
      'Define the number of shards to use for the statistics indices.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.STATISTICS,
    type: EpluginSettingType.number,
    defaultValue: WAZUH_STATISTICS_DEFAULT_INDICES_SHARDS,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: true,
    options: {
      number: {
        min: 1,
        integer: true,
      },
    },
    uiFormTransformConfigurationValueToInputValue: function (value: number) {
      return String(value);
    },
    uiFormTransformInputValueToConfigurationValue: function (
      value: string,
    ): number {
      return Number(value);
    },
    validateUIForm: function (value) {
      return this.validate(
        this.uiFormTransformInputValueToConfigurationValue(value),
      );
    },
    validate: function (value) {
      return SettingsValidator.number(this.options.number)(value);
    },
  },
  'cron.statistics.interval': {
    title: 'Interval',
    description:
      'Define the frequency of task execution using cron schedule expressions.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.STATISTICS,
    type: EpluginSettingType.text,
    defaultValue: WAZUH_STATISTICS_DEFAULT_CRON_FREQ,
    isConfigurableFromSettings: true,
    requiresRestartingPluginPlatform: true,
    // Workaround: this need to be defined in the frontend side and backend side because an optimization error in the frontend side related to some module can not be loaded.
    // validateUIForm: function (value) {
    // },
    // validate: function (value) {
    // },
  },
  'cron.statistics.status': {
    title: 'Status',
    description: 'Enable or disable the statistics tasks.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.STATISTICS,
    type: EpluginSettingType.switch,
    defaultValue: WAZUH_STATISTICS_DEFAULT_STATUS,
    isConfigurableFromSettings: true,
    options: {
      switch: {
        values: {
          disabled: { label: 'false', value: false },
          enabled: { label: 'true', value: true },
        },
      },
    },
    uiFormTransformChangedInputValue: function (
      value: boolean | string,
    ): boolean {
      return Boolean(value);
    },
    validateUIForm: function (value) {
      return this.validate(value);
    },
    validate: SettingsValidator.isBoolean,
  },
  'customization.enabled': {
    title: 'Status',
    description: 'Enable or disable the customization.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.CUSTOMIZATION,
    type: EpluginSettingType.switch,
    defaultValue: true,
    isConfigurableFromSettings: true,
    requiresReloadingBrowserTab: true,
    options: {
      switch: {
        values: {
          disabled: { label: 'false', value: false },
          enabled: { label: 'true', value: true },
        },
      },
    },
    uiFormTransformChangedInputValue: function (
      value: boolean | string,
    ): boolean {
      return Boolean(value);
    },
    validateUIForm: function (value) {
      return this.validate(value);
    },
    validate: SettingsValidator.isBoolean,
  },
  'customization.logo.app': {
    title: 'App main logo',
    description: `This logo is used as loading indicator while the user is logging into Wazuh API.`,
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.CUSTOMIZATION,
    type: EpluginSettingType.filepicker,
    defaultValue: '',
    isConfigurableFromSettings: true,
    options: {
      file: {
        type: 'image',
        extensions: ['.jpeg', '.jpg', '.png', '.svg'],
        size: {
          maxBytes:
            CUSTOMIZATION_ENDPOINT_PAYLOAD_UPLOAD_CUSTOM_FILE_MAXIMUM_BYTES,
        },
        recommended: {
          dimensions: {
            width: 300,
            height: 70,
            unit: 'px',
          },
        },
        store: {
          relativePathFileSystem: 'public/assets/custom/images',
          filename: 'customization.logo.app',
          resolveStaticURL: (filename: string) =>
            `custom/images/${filename}?v=${Date.now()}`,
          // ?v=${Date.now()} is used to force the browser to reload the image when a new file is uploaded
        },
      },
    },
    validateUIForm: function (value) {
      return SettingsValidator.compose(
        SettingsValidator.filePickerFileSize({
          ...this.options.file.size,
          meaningfulUnit: true,
        }),
        SettingsValidator.filePickerSupportedExtensions(
          this.options.file.extensions,
        ),
      )(value);
    },
  },
  'customization.logo.healthcheck': {
    title: 'Healthcheck logo',
    description: `This logo is displayed during the Healthcheck routine of the app.`,
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.CUSTOMIZATION,
    type: EpluginSettingType.filepicker,
    defaultValue: '',
    isConfigurableFromSettings: true,
    options: {
      file: {
        type: 'image',
        extensions: ['.jpeg', '.jpg', '.png', '.svg'],
        size: {
          maxBytes:
            CUSTOMIZATION_ENDPOINT_PAYLOAD_UPLOAD_CUSTOM_FILE_MAXIMUM_BYTES,
        },
        recommended: {
          dimensions: {
            width: 300,
            height: 70,
            unit: 'px',
          },
        },
        store: {
          relativePathFileSystem: 'public/assets/custom/images',
          filename: 'customization.logo.healthcheck',
          resolveStaticURL: (filename: string) =>
            `custom/images/${filename}?v=${Date.now()}`,
          // ?v=${Date.now()} is used to force the browser to reload the image when a new file is uploaded
        },
      },
    },
    validateUIForm: function (value) {
      return SettingsValidator.compose(
        SettingsValidator.filePickerFileSize({
          ...this.options.file.size,
          meaningfulUnit: true,
        }),
        SettingsValidator.filePickerSupportedExtensions(
          this.options.file.extensions,
        ),
      )(value);
    },
  },
  'customization.logo.reports': {
    title: 'PDF reports logo',
    description: `This logo is used in the PDF reports generated by the app. It's placed at the top left corner of every page of the PDF.`,
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.CUSTOMIZATION,
    type: EpluginSettingType.filepicker,
    defaultValue: '',
    defaultValueIfNotSet: REPORTS_LOGO_IMAGE_ASSETS_RELATIVE_PATH,
    isConfigurableFromSettings: true,
    options: {
      file: {
        type: 'image',
        extensions: ['.jpeg', '.jpg', '.png'],
        size: {
          maxBytes:
            CUSTOMIZATION_ENDPOINT_PAYLOAD_UPLOAD_CUSTOM_FILE_MAXIMUM_BYTES,
        },
        recommended: {
          dimensions: {
            width: 190,
            height: 40,
            unit: 'px',
          },
        },
        store: {
          relativePathFileSystem: 'public/assets/custom/images',
          filename: 'customization.logo.reports',
          resolveStaticURL: (filename: string) => `custom/images/${filename}`,
        },
      },
    },
    validateUIForm: function (value) {
      return SettingsValidator.compose(
        SettingsValidator.filePickerFileSize({
          ...this.options.file.size,
          meaningfulUnit: true,
        }),
        SettingsValidator.filePickerSupportedExtensions(
          this.options.file.extensions,
        ),
      )(value);
    },
  },
  'customization.reports.footer': {
    title: 'Reports footer',
    description: 'Set the footer of the reports.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.CUSTOMIZATION,
    type: EpluginSettingType.textarea,
    defaultValue: '',
    defaultValueIfNotSet: REPORTS_PAGE_FOOTER_TEXT,
    isConfigurableFromSettings: true,
    options: { maxRows: 2, maxLength: 50 },
    validateUIForm: function (value) {
      return this.validate(value);
    },
    validate: function (value) {
      return SettingsValidator.compose(
        SettingsValidator.isString,
        SettingsValidator.multipleLinesString({
          maxRows: this.options?.maxRows,
          maxLength: this.options?.maxLength,
        }),
      )(value);
    },
  },
  'customization.reports.header': {
    title: 'Reports header',
    description: 'Set the header of the reports.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.CUSTOMIZATION,
    type: EpluginSettingType.textarea,
    defaultValue: '',
    defaultValueIfNotSet: REPORTS_PAGE_HEADER_TEXT,
    isConfigurableFromSettings: true,
    options: { maxRows: 3, maxLength: 40 },
    validateUIForm: function (value) {
      return this.validate(value);
    },
    validate: function (value) {
      return SettingsValidator.compose(
        SettingsValidator.isString,
        SettingsValidator.multipleLinesString({
          maxRows: this.options?.maxRows,
          maxLength: this.options?.maxLength,
        }),
      )(value);
    },
  },
  'enrollment.dns': {
    title: 'Enrollment DNS',
    description:
      'Specifies the Wazuh registration server, used for the agent enrollment.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.text,
    defaultValue: '',
    isConfigurableFromSettings: true,
    validateUIForm: function (value) {
      return this.validate(value);
    },
    validate: SettingsValidator.compose(
      SettingsValidator.isString,
      SettingsValidator.serverAddressHostnameFQDNIPv4IPv6,
    ),
  },
  'enrollment.password': {
    title: 'Enrollment password',
    description:
      'Specifies the password used to authenticate during the agent enrollment.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.text,
    defaultValue: '',
    isConfigurableFromSettings: false,
    validateUIForm: function (value) {
      return this.validate(value);
    },
    validate: SettingsValidator.compose(
      SettingsValidator.isString,
      SettingsValidator.isNotEmptyString,
    ),
  },

  'fim_files.pattern': {
    title: 'Index pattern',
    description: 'Default index pattern to use for file integrity monitoring.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.text,
    defaultValue: WAZUH_FIM_FILES_PATTERN,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: false,
    validateUIForm: function (value) {
      return this.validate(value);
    },
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
  'fim_registries.pattern': {
    title: 'Index pattern',
    description: 'Default index pattern to use for file integrity monitoring.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.text,
    defaultValue: WAZUH_FIM_REGISTRIES_PATTERN,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: false,
    validateUIForm: function (value) {
      return this.validate(value);
    },
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
  hideManagerAlerts: {
    title: 'Hide manager alerts',
    description: 'Hide the alerts of the manager in every dashboard.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.switch,
    defaultValue: false,
    isConfigurableFromSettings: true,
    requiresReloadingBrowserTab: true,
    options: {
      switch: {
        values: {
          disabled: { label: 'false', value: false },
          enabled: { label: 'true', value: true },
        },
      },
    },
    uiFormTransformChangedInputValue: function (
      value: boolean | string,
    ): boolean {
      return Boolean(value);
    },
    validateUIForm: function (value) {
      return this.validate(value);
    },
    validate: SettingsValidator.isBoolean,
  },
  hosts: {
    title: 'Server hosts',
    description: 'Configure the API connections.',
    category: SettingCategory.API_CONNECTION,
    type: EpluginSettingType.arrayOf,
    defaultValue: [],
    store: {
      file: {
        configurableManaged: false,
        defaultBlock: `# The following configuration is the default structure to define a host.
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
        transformFrom: value => {
          return value.map(hostData => {
            const key = Object.keys(hostData)?.[0];
            return { ...hostData[key], id: key };
          });
        },
      },
    },
    options: {
      arrayOf: {
        id: {
          title: 'Identifier',
          description: 'Identifier of the API connection. This must be unique.',
          type: EpluginSettingType.text,
          defaultValue: 'default',
          isConfigurableFromSettings: true,
          validateUIForm: function (value) {
            return this.validate(value);
          },
          validate: SettingsValidator.compose(
            SettingsValidator.isString,
            SettingsValidator.isNotEmptyString,
          ),
        },
        url: {
          title: 'URL',
          description: 'Server URL address',
          type: EpluginSettingType.text,
          defaultValue: 'https://localhost',
          isConfigurableFromSettings: true,
          validateUIForm: function (value) {
            return this.validate(value);
          },
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
          isConfigurableFromSettings: true,
          options: {
            number: {
              min: 0,
              max: 65535,
              integer: true,
            },
          },
          uiFormTransformConfigurationValueToInputValue: function (
            value: number,
          ) {
            return String(value);
          },
          uiFormTransformInputValueToConfigurationValue: function (
            value: string,
          ): number {
            return Number(value);
          },
          validateUIForm: function (value) {
            return this.validate(
              this.uiFormTransformInputValueToConfigurationValue(value),
            );
          },
          validate: function (value) {
            return SettingsValidator.number(this.options.number)(value);
          },
        },
        username: {
          title: 'Username',
          description: 'Server API username',
          type: EpluginSettingType.text,
          defaultValue: 'wazuh-wui',
          isConfigurableFromSettings: true,
          validateUIForm: function (value) {
            return this.validate(value);
          },
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
          isConfigurableFromSettings: true,
          validateUIForm: function (value) {
            return this.validate(value);
          },
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
          isConfigurableFromSettings: true,
          options: {
            switch: {
              values: {
                disabled: { label: 'false', value: false },
                enabled: { label: 'true', value: true },
              },
            },
          },
          uiFormTransformChangedInputValue: function (
            value: boolean | string,
          ): boolean {
            return Boolean(value);
          },
          validateUIForm: function (value) {
            return this.validate(value);
          },
          validate: SettingsValidator.isBoolean,
        },
      },
    },
    isConfigurableFromSettings: false,
    uiFormTransformChangedInputValue: function (
      value: boolean | string,
    ): boolean {
      return Boolean(value);
    },
    // TODO: add validation
    // validate: SettingsValidator.isBoolean,
    // validate: function (schema) {
    //   return schema.boolean();
    // },
  },
  'ip.ignore': {
    title: 'Index pattern ignore',
    description:
      'Disable certain index pattern names from being available in index pattern selector.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.editor,
    defaultValue: [],
    isConfigurableFromSettings: true,
    options: {
      editor: {
        language: 'json',
      },
    },
    uiFormTransformConfigurationValueToInputValue: function (value: any): any {
      return JSON.stringify(value);
    },
    uiFormTransformInputValueToConfigurationValue: function (
      value: string,
    ): any {
      try {
        return JSON.parse(value);
      } catch (error) {
        return value;
      }
    },
    // Validation: https://github.com/elastic/elasticsearch/blob/v7.10.2/docs/reference/indices/create-index.asciidoc
    validateUIForm: function (value) {
      return SettingsValidator.json(this.validate)(value);
    },
    validate: SettingsValidator.compose(
      SettingsValidator.array(
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
  'ip.selector': {
    title: 'IP selector',
    description:
      'Define if the user is allowed to change the selected index pattern directly from the top menu bar.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.switch,
    defaultValue: true,
    isConfigurableFromSettings: true,
    options: {
      switch: {
        values: {
          disabled: { label: 'false', value: false },
          enabled: { label: 'true', value: true },
        },
      },
    },
    uiFormTransformChangedInputValue: function (
      value: boolean | string,
    ): boolean {
      return Boolean(value);
    },
    validateUIForm: function (value) {
      return this.validate(value);
    },
    validate: SettingsValidator.isBoolean,
  },
  'wazuh.updates.disabled': {
    title: 'Check updates',
    description: 'Define if the check updates service is disabled.',
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.switch,
    defaultValue: false,
    store: {
      file: {
        configurableManaged: true,
      },
    },
    isConfigurableFromSettings: true,
    options: {
      switch: {
        values: {
          disabled: { label: 'false', value: false },
          enabled: { label: 'true', value: true },
        },
      },
    },
    uiFormTransformChangedInputValue: function (
      value: boolean | string,
    ): boolean {
      return Boolean(value);
    },
    validate: SettingsValidator.isBoolean,
  },
  pattern: {
    title: 'Index pattern',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    description:
      "Default index pattern to use on the app. If there's no valid index pattern, the app will automatically create one with the name indicated in this option.",
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.text,
    defaultValue: WAZUH_ALERTS_PATTERN,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: true,
    // Validation: https://github.com/elastic/elasticsearch/blob/v7.10.2/docs/reference/indices/create-index.asciidoc
    validateUIForm: function (value) {
      return this.validate(value);
    },
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
    store: {
      file: {
        configurableManaged: true,
      },
    },
    description:
      'Maximum time, in milliseconds, the app will wait for an API response when making requests to it. It will be ignored if the value is set under 1500 milliseconds.',
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.number,
    defaultValue: 20000,
    isConfigurableFromSettings: true,
    options: {
      number: {
        min: 1500,
        integer: true,
      },
    },
    uiFormTransformConfigurationValueToInputValue: function (value: number) {
      return String(value);
    },
    uiFormTransformInputValueToConfigurationValue: function (
      value: string,
    ): number {
      return Number(value);
    },
    validateUIForm: function (value) {
      return this.validate(
        this.uiFormTransformInputValueToConfigurationValue(value),
      );
    },
    validate: function (value) {
      return SettingsValidator.number(this.options.number)(value);
    },
  },
  'reports.csv.maxRows': {
    title: 'Max rows in csv reports',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    description:
      'Maximum rows that will be included in csv reports. If the number of rows exceeds this value, the report will be truncated. Setting a high value can cause instability of the report generating process.',
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.number,
    defaultValue: 10000,
    isConfigurableFromSettings: true,
    options: {
      number: {
        integer: true,
      },
    },
    uiFormTransformConfigurationValueToInputValue: function (value: number) {
      return String(value);
    },
    uiFormTransformInputValueToConfigurationValue: function (
      value: string,
    ): number {
      return Number(value);
    },
    validateUIForm: function (value) {
      return this.validate(
        this.uiFormTransformInputValueToConfigurationValue(value),
      );
    },
    validate: function (value) {
      return SettingsValidator.number(this.options.number)(value);
    },
  },
  'system_inventory_hardware.pattern': {
    title: 'Index pattern',
    description: 'Default index pattern to use for hardware inventory.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.text,
    defaultValue: WAZUH_SYSTEM_INVENTORY_HARDWARE_PATTERN,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: false,
    validateUIForm: function (value) {
      return this.validate(value);
    },
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
  'system_inventory_hotfixes.pattern': {
    title: 'Index pattern',
    description: 'Default index pattern to use for hotfixes inventory.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.text,
    defaultValue: WAZUH_SYSTEM_INVENTORY_HOTFIXES_PATTERN,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: false,
    validateUIForm: function (value) {
      return this.validate(value);
    },
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
  'system_inventory_interfaces.pattern': {
    title: 'Index pattern',
    description: 'Default index pattern to use for interfaces inventory.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.text,
    defaultValue: WAZUH_SYSTEM_INVENTORY_INTERFACES_PATTERN,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: false,
    validateUIForm: function (value) {
      return this.validate(value);
    },
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
  'system_inventory_networks.pattern': {
    title: 'Index pattern',
    description: 'Default index pattern to use for networks inventory.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.text,
    defaultValue: WAZUH_SYSTEM_INVENTORY_NETWORKS_PATTERN,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: false,
    validateUIForm: function (value) {
      return this.validate(value);
    },
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
  'system_inventory_packages.pattern': {
    title: 'Index pattern',
    description: 'Default index pattern to use for packages inventory.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.text,
    defaultValue: WAZUH_SYSTEM_INVENTORY_PACKAGES_PATTERN,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: false,
    validateUIForm: function (value) {
      return this.validate(value);
    },
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
  'system_inventory_ports.pattern': {
    title: 'Index pattern',
    description: 'Default index pattern to use for ports inventory.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.text,
    defaultValue: WAZUH_SYSTEM_INVENTORY_PORTS_PATTERN,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: false,
    validateUIForm: function (value) {
      return this.validate(value);
    },
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
  'system_inventory_processes.pattern': {
    title: 'Index pattern',
    description: 'Default index pattern to use for processes inventory.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.text,
    defaultValue: WAZUH_SYSTEM_INVENTORY_PROCESSES_PATTERN,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: false,
    validateUIForm: function (value) {
      return this.validate(value);
    },
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
  'system_inventory_protocols.pattern': {
    title: 'Index pattern',
    description: 'Default index pattern to use for protocols inventory.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.text,
    defaultValue: WAZUH_SYSTEM_INVENTORY_PROTOCOLS_PATTERN,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: false,
    validateUIForm: function (value) {
      return this.validate(value);
    },
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
  'system_inventory_system.pattern': {
    title: 'Index pattern',
    description: 'Default index pattern to use for system inventory.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.GENERAL,
    type: EpluginSettingType.text,
    defaultValue: WAZUH_SYSTEM_INVENTORY_SYSTEM_PATTERN,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: false,
    validateUIForm: function (value) {
      return this.validate(value);
    },
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
  'wazuh.monitoring.creation': {
    title: 'Index creation',
    description:
      'Define the interval in which a new wazuh-monitoring index will be created.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.MONITORING,
    type: EpluginSettingType.select,
    options: {
      select: [
        {
          text: 'Hourly',
          value: 'h',
        },
        {
          text: 'Daily',
          value: 'd',
        },
        {
          text: 'Weekly',
          value: 'w',
        },
        {
          text: 'Monthly',
          value: 'm',
        },
      ],
    },
    defaultValue: WAZUH_MONITORING_DEFAULT_CREATION,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: true,
    validateUIForm: function (value) {
      return this.validate(value);
    },
    validate: function (value) {
      return SettingsValidator.literal(
        this.options.select.map(({ value }) => value),
      )(value);
    },
  },
  'wazuh.monitoring.enabled': {
    title: 'Status',
    description:
      'Enable or disable the wazuh-monitoring index creation and/or visualization.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.MONITORING,
    type: EpluginSettingType.switch,
    defaultValue: WAZUH_MONITORING_DEFAULT_ENABLED,
    isConfigurableFromSettings: true,
    requiresRestartingPluginPlatform: true,
    options: {
      switch: {
        values: {
          disabled: { label: 'false', value: false },
          enabled: { label: 'true', value: true },
        },
      },
    },
    uiFormTransformChangedInputValue: function (
      value: boolean | string,
    ): boolean {
      return Boolean(value);
    },
    validateUIForm: function (value) {
      return this.validate(value);
    },
    validate: SettingsValidator.isBoolean,
  },
  'wazuh.monitoring.frequency': {
    title: 'Frequency',
    description:
      'Frequency, in seconds, of API requests to get the state of the agents and create a new document in the wazuh-monitoring index with this data.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.MONITORING,
    type: EpluginSettingType.number,
    defaultValue: WAZUH_MONITORING_DEFAULT_FREQUENCY,
    isConfigurableFromSettings: true,
    requiresRestartingPluginPlatform: true,
    options: {
      number: {
        min: 60,
        integer: true,
      },
    },
    uiFormTransformConfigurationValueToInputValue: function (value: number) {
      return String(value);
    },
    uiFormTransformInputValueToConfigurationValue: function (
      value: string,
    ): number {
      return Number(value);
    },
    validateUIForm: function (value) {
      return this.validate(
        this.uiFormTransformInputValueToConfigurationValue(value),
      );
    },
    validate: function (value) {
      return SettingsValidator.number(this.options.number)(value);
    },
  },
  'wazuh.monitoring.pattern': {
    title: 'Index pattern',
    description: 'Default index pattern to use for Wazuh monitoring.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.MONITORING,
    type: EpluginSettingType.text,
    defaultValue: WAZUH_MONITORING_PATTERN,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: true,
    validateUIForm: function (value) {
      return this.validate(value);
    },
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
  'wazuh.monitoring.replicas': {
    title: 'Index replicas',
    description:
      'Define the number of replicas to use for the wazuh-monitoring-* indices.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.MONITORING,
    type: EpluginSettingType.number,
    defaultValue: WAZUH_MONITORING_DEFAULT_INDICES_REPLICAS,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: true,
    options: {
      number: {
        min: 0,
        integer: true,
      },
    },
    uiFormTransformConfigurationValueToInputValue: function (value: number) {
      return String(value);
    },
    uiFormTransformInputValueToConfigurationValue: function (
      value: string,
    ): number {
      return Number(value);
    },
    validateUIForm: function (value) {
      return this.validate(
        this.uiFormTransformInputValueToConfigurationValue(value),
      );
    },
    validate: function (value) {
      return SettingsValidator.number(this.options.number)(value);
    },
  },
  'wazuh.monitoring.shards': {
    title: 'Index shards',
    description:
      'Define the number of shards to use for the wazuh-monitoring-* indices.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.MONITORING,
    type: EpluginSettingType.number,
    defaultValue: WAZUH_MONITORING_DEFAULT_INDICES_SHARDS,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: true,
    options: {
      number: {
        min: 1,
        integer: true,
      },
    },
    uiFormTransformConfigurationValueToInputValue: function (value: number) {
      return String(value);
    },
    uiFormTransformInputValueToConfigurationValue: function (
      value: string,
    ): number {
      return Number(value);
    },
    validateUIForm: function (value) {
      return this.validate(
        this.uiFormTransformInputValueToConfigurationValue(value),
      );
    },
    validate: function (value) {
      return SettingsValidator.number(this.options.number)(value);
    },
  },
  'vulnerabilities.pattern': {
    title: 'Index pattern',
    description: 'Default index pattern to use for vulnerabilities.',
    store: {
      file: {
        configurableManaged: true,
      },
    },
    category: SettingCategory.VULNERABILITIES,
    type: EpluginSettingType.text,
    defaultValue: WAZUH_VULNERABILITIES_PATTERN,
    isConfigurableFromSettings: true,
    requiresRunningHealthCheck: false,
    validateUIForm: function (value) {
      return this.validate(value);
    },
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

// Module Security configuration assessment
export const MODULE_SCA_CHECK_RESULT_LABEL = {
  passed: 'Passed',
  failed: 'Failed',
  'not applicable': 'Not applicable',
};

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
