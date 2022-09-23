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
import { validate as validateNodeCronInterval } from 'node-cron';
import { composeValidate, validateBooleanIs, validateJSONArrayOfStrings, validateLiteral, validateNumber, validateStringMultipleLines, validateStringNoEmpty, validateStringNoSpaces } from './services/settings-validate';

// Plugin
export const PLUGIN_VERSION = version;
export const PLUGIN_VERSION_SHORT = version.split('.').splice(0,2).join('.');

// Index patterns - Wazuh alerts
export const WAZUH_INDEX_TYPE_ALERTS = 'alerts';
export const WAZUH_ALERTS_PREFIX = 'wazuh-alerts-';
export const WAZUH_ALERTS_PATTERN = 'wazuh-alerts-*';

// Job - Wazuh monitoring
export const WAZUH_INDEX_TYPE_MONITORING = "monitoring";
export const WAZUH_MONITORING_PREFIX = "wazuh-monitoring-";
export const WAZUH_MONITORING_PATTERN = "wazuh-monitoring-*";
export const WAZUH_MONITORING_TEMPLATE_NAME = "wazuh-agent";
export const WAZUH_MONITORING_DEFAULT_INDICES_SHARDS = 1;
export const WAZUH_MONITORING_DEFAULT_INDICES_REPLICAS = 0;
export const WAZUH_MONITORING_DEFAULT_CREATION = 'w';
export const WAZUH_MONITORING_DEFAULT_ENABLED = true;
export const WAZUH_MONITORING_DEFAULT_FREQUENCY = 900;
export const WAZUH_MONITORING_DEFAULT_CRON_FREQ = '0 * * * * *';

// Job - Wazuh statistics
export const WAZUH_INDEX_TYPE_STATISTICS = "statistics";
export const WAZUH_STATISTICS_DEFAULT_PREFIX = "wazuh";
export const WAZUH_STATISTICS_DEFAULT_NAME = "statistics";
export const WAZUH_STATISTICS_PATTERN = `${WAZUH_STATISTICS_DEFAULT_PREFIX}-${WAZUH_STATISTICS_DEFAULT_NAME}-*`;
export const WAZUH_STATISTICS_TEMPLATE_NAME = `${WAZUH_STATISTICS_DEFAULT_PREFIX}-${WAZUH_STATISTICS_DEFAULT_NAME}`;
export const WAZUH_STATISTICS_DEFAULT_INDICES_SHARDS = 1;
export const WAZUH_STATISTICS_DEFAULT_INDICES_REPLICAS = 0;
export const WAZUH_STATISTICS_DEFAULT_CREATION = 'w';
export const WAZUH_STATISTICS_DEFAULT_STATUS = true;
export const WAZUH_STATISTICS_DEFAULT_FREQUENCY = 900;
export const WAZUH_STATISTICS_DEFAULT_CRON_FREQ = '0 */5 * * * *';

// Job - Wazuh initialize
export const WAZUH_PLUGIN_PLATFORM_TEMPLATE_NAME = 'wazuh-kibana';

// Permissions
export const WAZUH_ROLE_ADMINISTRATOR_ID = 1;
export const WAZUH_ROLE_ADMINISTRATOR_NAME = 'administrator';

// Sample data
export const WAZUH_SAMPLE_ALERT_PREFIX = 'wazuh-alerts-4.x-';
export const WAZUH_SAMPLE_ALERTS_INDEX_SHARDS = 1;
export const WAZUH_SAMPLE_ALERTS_INDEX_REPLICAS = 0;
export const WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY = 'security';
export const WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING = 'auditing-policy-monitoring';
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
    { github: true }
  ],
  [WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING]: [
    { rootcheck: true },
    { audit: true },
    { openscap: true },
    { ciscat: true },
  ],
  [WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION]: [
    { vulnerabilities: true },
    { virustotal: true },
    { osquery: true },
    { docker: true },
    { mitre: true },
  ],
};

// Security
export const WAZUH_SECURITY_PLUGIN_XPACK_SECURITY = 'X-Pack Security';
export const WAZUH_SECURITY_PLUGIN_OPEN_DISTRO_FOR_ELASTICSEARCH = 'Open Distro for Elasticsearch';

export const WAZUH_SECURITY_PLUGINS = [
  WAZUH_SECURITY_PLUGIN_XPACK_SECURITY,
  WAZUH_SECURITY_PLUGIN_OPEN_DISTRO_FOR_ELASTICSEARCH,
];

// App configuration
export const WAZUH_CONFIGURATION_CACHE_TIME = 10000; // time in ms;

// Reserved ids for Users/Role mapping
export const WAZUH_API_RESERVED_ID_LOWER_THAN = 100;

// Wazuh data path
const WAZUH_DATA_PLUGIN_PLATFORM_BASE_PATH = 'data';
export const WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH = path.join(
  __dirname,
  '../../../',
  WAZUH_DATA_PLUGIN_PLATFORM_BASE_PATH
);
export const WAZUH_DATA_ABSOLUTE_PATH = path.join(WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH, 'wazuh');

// Wazuh data path - config
export const WAZUH_DATA_CONFIG_DIRECTORY_PATH = path.join(WAZUH_DATA_ABSOLUTE_PATH, 'config');
export const WAZUH_DATA_CONFIG_APP_PATH = path.join(WAZUH_DATA_CONFIG_DIRECTORY_PATH, 'wazuh.yml');
export const WAZUH_DATA_CONFIG_REGISTRY_PATH = path.join(
  WAZUH_DATA_CONFIG_DIRECTORY_PATH,
  'wazuh-registry.json'
);

// Wazuh data path - logs
export const MAX_MB_LOG_FILES = 100;
export const WAZUH_DATA_LOGS_DIRECTORY_PATH = path.join(WAZUH_DATA_ABSOLUTE_PATH, 'logs');
export const WAZUH_DATA_LOGS_PLAIN_FILENAME = 'wazuhapp-plain.log';
export const WAZUH_DATA_LOGS_PLAIN_PATH = path.join(
  WAZUH_DATA_LOGS_DIRECTORY_PATH,
  WAZUH_DATA_LOGS_PLAIN_FILENAME
);
export const WAZUH_DATA_LOGS_RAW_FILENAME = 'wazuhapp.log';
export const WAZUH_DATA_LOGS_RAW_PATH = path.join(
  WAZUH_DATA_LOGS_DIRECTORY_PATH,
  WAZUH_DATA_LOGS_RAW_FILENAME
);

// Wazuh data path - UI logs
export const WAZUH_UI_LOGS_PLAIN_FILENAME = 'wazuh-ui-plain.log';
export const WAZUH_UI_LOGS_RAW_FILENAME = 'wazuh-ui.log';
export const WAZUH_UI_LOGS_PLAIN_PATH = path.join(
  WAZUH_DATA_LOGS_DIRECTORY_PATH,
  WAZUH_UI_LOGS_PLAIN_FILENAME
);
export const WAZUH_UI_LOGS_RAW_PATH = path.join(WAZUH_DATA_LOGS_DIRECTORY_PATH, WAZUH_UI_LOGS_RAW_FILENAME);

// Wazuh data path - downloads
export const WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH = path.join(WAZUH_DATA_ABSOLUTE_PATH, 'downloads');
export const WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH = path.join(
  WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH,
  'reports'
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
  GITHUB = 'github'
};

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
};

export enum WAZUH_MENU_TOOLS_SECTIONS_ID {
  API_CONSOLE = 'devTools',
  RULESET_TEST = 'logtest',
};

export enum WAZUH_MENU_SECURITY_SECTIONS_ID {
  USERS = 'users',
  ROLES = 'roles',
  POLICIES = 'policies',
  ROLES_MAPPING = 'roleMapping',
};

export enum WAZUH_MENU_SETTINGS_SECTIONS_ID {
  SETTINGS = 'settings',
  API_CONFIGURATION = 'api',
  MODULES = 'modules',
  SAMPLE_DATA = 'sample_data',
  CONFIGURATION = 'configuration',
  LOGS = 'logs',
  MISCELLANEOUS = 'miscellaneous',
  ABOUT = 'about',
};

export const AUTHORIZED_AGENTS = 'authorized-agents';

// Wazuh links
export const WAZUH_LINK_GITHUB = 'https://github.com/wazuh';
export const WAZUH_LINK_GOOGLE_GROUPS = 'https://groups.google.com/forum/#!forum/wazuh';
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
export const PLUGIN_PLATFORM_SETTING_NAME_TIME_FILTER = 'timepicker:timeDefaults';

// Default maxBuckets set by the app
export const WAZUH_PLUGIN_PLATFORM_SETTING_MAX_BUCKETS = 200000;
export const PLUGIN_PLATFORM_SETTING_NAME_MAX_BUCKETS = 'timelion:max_buckets';

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
export const REPORTS_LOGO_IMAGE_ASSETS_RELATIVE_PATH = 'images/logo_reports.png';
export const REPORTS_PRIMARY_COLOR = '#256BD1';
export const REPORTS_PAGE_FOOTER_TEXT = 'Copyright © 2022 Wazuh, Inc.';
export const REPORTS_PAGE_HEADER_TEXT = 'info@wazuh.com\nhttps://wazuh.com';

// Plugin platform
export const PLUGIN_PLATFORM_NAME = 'Kibana';
export const PLUGIN_PLATFORM_BASE_INSTALLATION_PATH = '/usr/share/kibana/data/wazuh/';
export const PLUGIN_PLATFORM_INSTALLATION_USER = 'kibana';
export const PLUGIN_PLATFORM_INSTALLATION_USER_GROUP = 'kibana';
export const PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_UPGRADE_PLATFORM = 'upgrade-guide';
export const PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_TROUBLESHOOTING = 'user-manual/elasticsearch/troubleshooting.html';
export const PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_APP_CONFIGURATION = 'user-manual/wazuh-dashboard/config-file.html';
export const PLUGIN_PLATFORM_URL_GUIDE = 'https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html';
export const PLUGIN_PLATFORM_URL_GUIDE_TITLE = 'Elastic guide';
export const PLUGIN_PLATFORM_REQUEST_HEADERS = {
  'kbn-xsrf': 'kibana'
};

// UI
export const API_NAME_AGENT_STATUS = {
  ACTIVE: 'active',
  DISCONNECTED: 'disconnected',
  PENDING: 'pending',
  NEVER_CONNECTED: 'never_connected',
} as const;

export const UI_COLOR_AGENT_STATUS = {
  [API_NAME_AGENT_STATUS.ACTIVE]: '#007871',
  [API_NAME_AGENT_STATUS.DISCONNECTED]: '#BD271E',
  [API_NAME_AGENT_STATUS.PENDING]: '#FEC514',
  [API_NAME_AGENT_STATUS.NEVER_CONNECTED]: '#646A77',
  default: '#000000'
} as const;

export const UI_LABEL_NAME_AGENT_STATUS = {
  [API_NAME_AGENT_STATUS.ACTIVE]: 'Active',
  [API_NAME_AGENT_STATUS.DISCONNECTED]: 'Disconnected',
  [API_NAME_AGENT_STATUS.PENDING]: 'Pending',
  [API_NAME_AGENT_STATUS.NEVER_CONNECTED]: 'Never connected',
  default: 'Unknown'
} as const;

export const UI_ORDER_AGENT_STATUS = [
  API_NAME_AGENT_STATUS.ACTIVE,
  API_NAME_AGENT_STATUS.DISCONNECTED,
  API_NAME_AGENT_STATUS.PENDING,
  API_NAME_AGENT_STATUS.NEVER_CONNECTED
]

export const AGENT_SYNCED_STATUS = {
  SYNCED: 'synced',
  NOT_SYNCED: 'not synced',
}

// Documentation
export const DOCUMENTATION_WEB_BASE_URL = "https://documentation.wazuh.com";

// Default Elasticsearch user name context
export const ELASTIC_NAME = 'elastic';


// Plugin settings
export enum SettingCategory{
  HEALTH_CHECK,
  GENERAL,
  EXTENSIONS,
  MONITORING,
  STATISTICS,
  SECURITY,
  CUSTOMIZATION,
};

type TPluginSettingOptionsSelect = {
	select: {text: string, value: any}[]
};

type TPluginSettingOptionsNumber = {
	number: {
		min?: number
		max?: number
	}
};

type TPluginSettingOptionsEditor = {
	editor: {
		language: string
	}
};

type TPluginSettingOptionsSwitch = {
	switch: {
		values: {
			disabled: {label?: string, value: any},
			enabled: {label?: string, value: any},
		}
	}
};

export enum EpluginSettingType{
	text = 'text',
	textarea = 'textarea',
	switch = 'switch',
	number = 'number',
	editor = 'editor',
	select = 'select',
};

export type TPluginSetting = {
	// Define the text displayed in the UI.
	title: string
	// Description.
	description: string
	// Category.
	category: SettingCategory
	// Type.
	type: EpluginSettingType
	// Default value.
	defaultValue: any
	// Default value if it is not set. It has preference over `default`.
	defaultValueIfNotSet?: any
	// Configurable from the configuration file.
	isConfigurableFromFile: boolean
	// Configurable from the UI (Settings/Configuration).
	isConfigurableFromUI: boolean
	// Modify the setting requires running the plugin health check (frontend).
	requiresRunningHealthCheck?: boolean
	// Modify the setting requires reloading the browser tab (frontend).
	requiresReloadingBrowserTab?: boolean
	// Modify the setting requires restarting the plugin platform to take effect.
	requiresRestartingPluginPlatform?: boolean
	// Define options related to the `type`.
	options?: TPluginSettingOptionsNumber | TPluginSettingOptionsEditor | TPluginSettingOptionsSelect | TPluginSettingOptionsSwitch
	// Transform the input value. The result is saved in the form global state of Settings/Configuration
	uiFormTransformChangedInputValue?: (value: any) => any
	// Transform the configuration value or default as initial value for the input in Settings/Configuration
	uiFormTransformConfigurationValueToInputValue?: (value: any) => any
	// Transform the input value changed in the form of Settings/Configuration and returned in the `changed` property of the hook useForm
	uiFormTransformInputValueToConfigurationValue?: (value: any) => any
	// Validate the value in the form of Settings/Configuration. It returns a string if there is some validation error. 
	validate?: (value: any) => string | undefined
	// Validate function creator to validate the setting in the backend. It uses `schema` of the `@kbn/config-schema` package.
	validateBackend?: (schema: any) => (value: unknown) => string | undefined
};

export type TPluginSettingWithKey = TPluginSetting & { key: TPluginSettingKey };


export const PLUGIN_SETTINGS_CATEGORIES = {
  [SettingCategory.HEALTH_CHECK]: {
    title: 'Health check',
    description: "Define which checks will be executed by the App's HealthCheck. Allowed values are: true, false"
  },
  [SettingCategory.GENERAL]: {
    title: 'General',
    description: "General settings."
  },
  [SettingCategory.EXTENSIONS]: {
    title: 'Extensions',
    description: "Extensions."
  },
  [SettingCategory.SECURITY]: {
    title: 'Security',
    description: "Security."
  },
  [SettingCategory.MONITORING]: {
    title: 'Task:Monitoring',
    description: "Monitoring."
  },
  [SettingCategory.STATISTICS]: {
    title: 'Task:Statistics',
    description: "Statistics."
  },
  [SettingCategory.CUSTOMIZATION]: {
    title: 'Customization',
    description: "Customization."
  }
};

export const PLUGIN_SETTINGS = {
	"alerts.sample.prefix": {
		title: "Sample alerts prefix",
		description: "Define the index name prefix of sample alerts. It must match the template used by the index pattern to avoid unknown fields in dashboards.",
		category: SettingCategory.GENERAL,
		type: EpluginSettingType.text,
		defaultValue: WAZUH_SAMPLE_ALERT_PREFIX,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		requiresRunningHealthCheck: true,
		validate: composeValidate(validateStringNoEmpty, validateStringNoSpaces),
		validateBackend: function(schema){
			return schema.string({validate: this.validate});
		},
	},
	"checks.api": {
		title: "API connection",
		description: "Enable or disable the API health check when opening the app.",
		category: SettingCategory.HEALTH_CHECK,
		type: EpluginSettingType.switch,
		defaultValue: true,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"checks.fields": {
		title: "Known fields",
		description: "Enable or disable the known fields health check when opening the app.",
		category: SettingCategory.HEALTH_CHECK,
		type: EpluginSettingType.switch,
		defaultValue: true,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"checks.maxBuckets": {
		title: "Set max buckets to 200000",
		description: "Change the default value of the plugin platform max buckets configuration.",
		category: SettingCategory.HEALTH_CHECK,
		type: EpluginSettingType.switch,
		defaultValue: true,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			},
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"checks.metaFields": {
		title: "Remove meta fields",
		description: "Change the default value of the plugin platform metaField configuration.",
		category: SettingCategory.HEALTH_CHECK,
		type: EpluginSettingType.switch,
		defaultValue: true,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"checks.pattern": {
		title: "Index pattern",
		description: "Enable or disable the index pattern health check when opening the app.",
		category: SettingCategory.HEALTH_CHECK,
		type: EpluginSettingType.switch,
		defaultValue: true,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"checks.setup": {
		title: "API version",
		description: "Enable or disable the setup health check when opening the app.",
		category: SettingCategory.HEALTH_CHECK,
		type: EpluginSettingType.switch,
		defaultValue: true,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"checks.template": {
		title: "Index template",
		description: "Enable or disable the template health check when opening the app.",
		category: SettingCategory.HEALTH_CHECK,
		type: EpluginSettingType.switch,
		defaultValue: true,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"checks.timeFilter": {
		title: "Set time filter to 24h",
		description: "Change the default value of the plugin platform timeFilter configuration.",
		category: SettingCategory.HEALTH_CHECK,
		type: EpluginSettingType.switch,
		defaultValue: true,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"cron.prefix": {
		title: "Cron prefix",
		description: "Define the index prefix of predefined jobs.",
		category: SettingCategory.GENERAL,
		type: EpluginSettingType.text,
		defaultValue: WAZUH_STATISTICS_DEFAULT_PREFIX,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		validate: composeValidate(validateStringNoEmpty, validateStringNoSpaces),
		validateBackend: function(schema){
			return schema.string({validate: this.validate});
		},
	},
	"cron.statistics.apis": {
		title: "Includes APIs",
		description: "Enter the ID of the hosts you want to save data from, leave this empty to run the task on every host.",
		category: SettingCategory.STATISTICS,
		type: EpluginSettingType.editor,
		defaultValue: [],
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		options: {
			editor: {
				language: 'json'
			}
		},
		uiFormTransformConfigurationValueToInputValue: function(value : any): any{
			return JSON.stringify(value);
		},
		uiFormTransformInputValueToConfigurationValue: function(value: string): any{
			try{
				return JSON.parse(value);
			}catch(error){
				return value;
			};
		},
		validate: validateJSONArrayOfStrings,
		validateBackend: function(schema){
			return schema.arrayOf(schema.string({validate: composeValidate(validateStringNoEmpty, validateStringNoSpaces)}));
		},
	},
	"cron.statistics.index.creation": {
		title: "Index creation",
		description: "Define the interval in which a new index will be created.",
		category: SettingCategory.STATISTICS,
		type: EpluginSettingType.select,
		options: {
			select: [
				{
					text: "Hourly",
					value: "h"
				},
				{
					text: "Daily",
					value: "d"
				},
				{
					text: "Weekly",
					value: "w"
				},
				{
					text: "Monthly",
					value: "m"
				}
			]
		},
		defaultValue: WAZUH_STATISTICS_DEFAULT_CREATION,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		requiresRunningHealthCheck: true,
		validate: function (value){
			return validateLiteral(this.options.select.map(({value}) => value))(value)
		},
		validateBackend: function(schema){
			return schema.oneOf(this.options.select.map(({value}) => schema.literal(value)));
		},
	},
	"cron.statistics.index.name": {
		title: "Index name",
		description: "Define the name of the index in which the documents will be saved.",
		category: SettingCategory.STATISTICS,
		type: EpluginSettingType.text,
		defaultValue: WAZUH_STATISTICS_DEFAULT_NAME,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		requiresRunningHealthCheck: true,
		validate: composeValidate(validateStringNoEmpty, validateStringNoSpaces),
		validateBackend: function(schema){
			return schema.string({validate: this.validate});
		},
	},
	"cron.statistics.index.replicas": {
		title: "Index replicas",
		description: "Define the number of replicas to use for the statistics indices.",
		category: SettingCategory.STATISTICS,
		type: EpluginSettingType.number,
		defaultValue: WAZUH_STATISTICS_DEFAULT_INDICES_REPLICAS,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		requiresRunningHealthCheck: true,
		options: {
			number: {
				min: 0
			}
		},
		validate: function(value){
			return validateNumber(this.options.number)(value)
		},
		validateBackend: function(schema){
			return schema.number({validate: this.validate.bind(this)});
		},
	},
	"cron.statistics.index.shards": {
		title: "Index shards",
		description: "Define the number of shards to use for the statistics indices.",
		category: SettingCategory.STATISTICS,
		type: EpluginSettingType.number,
		defaultValue: WAZUH_STATISTICS_DEFAULT_INDICES_SHARDS,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		requiresRunningHealthCheck: true,
		options: {
			number: {
				min: 1
			}
		},
		validate: function(value){
			return validateNumber(this.options.number)(value)
		},
		validateBackend: function(schema){
			return schema.number({validate: this.validate.bind(this)});
		},
	},
	"cron.statistics.interval": {
		title: "Interval",
		description: "Define the frequency of task execution using cron schedule expressions.",
		category: SettingCategory.STATISTICS,
		type: EpluginSettingType.text,
		defaultValue: WAZUH_STATISTICS_DEFAULT_CRON_FREQ,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		requiresRestartingPluginPlatform: true,
		validate: function(value: string){
			return validateNodeCronInterval(value) ? undefined : "Interval is not valid."
		},
		validateBackend: function(schema){
			return schema.string({validate: this.validate});
		},
	},
	"cron.statistics.status": {
		title: "Status",
		description: "Enable or disable the statistics tasks.",
		category: SettingCategory.STATISTICS,
		type: EpluginSettingType.switch,
		defaultValue: WAZUH_STATISTICS_DEFAULT_STATUS,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"customization.logo.app": {
		title: "Logo App",
		description: `Customize the logo displayed in the plugin menu.`,
		category: SettingCategory.CUSTOMIZATION,
		type: EpluginSettingType.text,
		defaultValue: "",
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
	},
	"customization.logo.healthcheck": {
		title: "Logo Health Check",
		description: `Customize the logo displayed in the plugin health check.`,
		category: SettingCategory.CUSTOMIZATION,
		type: EpluginSettingType.text,
		defaultValue: "",
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
	},
	"customization.logo.reports": {
		title: "Logo Reports",
		description: `Customize the logo displayed in the PDF reports.`,
		category: SettingCategory.CUSTOMIZATION,
		type: EpluginSettingType.text,
		defaultValue: "",
    	defaultValueIfNotSet: REPORTS_LOGO_IMAGE_ASSETS_RELATIVE_PATH,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
	},
	"customization.logo.sidebar": {
		title: "Logo Sidebar",
		description: `Customize the logo of the category that belongs the plugin.`,
		category: SettingCategory.CUSTOMIZATION,
		type: EpluginSettingType.text,
		defaultValue: "",
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		requiresReloadingBrowserTab: true,
	},
	"customization.reports.footer": {
		title: "Reports footer",
		description: "Set the footer of the reports.",
		category: SettingCategory.CUSTOMIZATION,
		type: EpluginSettingType.textarea,
		default: "",
    	defaultHidden: REPORTS_PAGE_FOOTER_TEXT,
		configurableFile: true,
		configurableUI: true,
		validate: validateStringMultipleLines({max: 2}),
		validateBackend: function(schema){
			return schema.string({minLength: 1, validate: this.validate});
		},
	},
	"customization.reports.header": {
		title: "Reports header",
		description: "Set the header of the reports.",
		category: SettingCategory.CUSTOMIZATION,
		type: EpluginSettingType.textarea,
		default: "",
    	defaultHidden: REPORTS_PAGE_HEADER_TEXT,
		configurableFile: true,
		configurableUI: true,
		validate: validateStringMultipleLines({max: 4}),
		validateBackend: function(schema){
			return schema.string({minLength: 1, validate: this.validate});
		},
	},
	"disabled_roles": {
		title: "Disables roles",
		description: "Disabled the plugin visibility for users with the roles.",
		category: SettingCategory.SECURITY,
		type: EpluginSettingType.editor,
		defaultValue: [],
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		options: {
			editor: {
				language: 'json'
			}
		},
		uiFormTransformConfigurationValueToInputValue: function(value : any): any{
			return JSON.stringify(value);
		},
		uiFormTransformInputValueToConfigurationValue: function(value: string): any{
			try{
				return JSON.parse(value);
			}catch(error){
				return value;
			};
		},
		validate: validateJSONArrayOfStrings,
		validateBackend: function(schema){
			return schema.arrayOf(schema.string({validate: composeValidate(validateStringNoEmpty, validateStringNoSpaces)}));
		},
	},
	"enrollment.dns": {
		title: "Enrollment DNS",
		description: "Specifies the Wazuh registration server, used for the agent enrollment.",
		category: SettingCategory.GENERAL,
		type: EpluginSettingType.text,
		defaultValue: "",
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		validate: validateStringNoSpaces,
		validateBackend: function(schema){
			return schema.string({validate: this.validate});
		},
	},
	"enrollment.password": {
		title: "Enrollment Password",
		description: "Specifies the password used to authenticate during the agent enrollment.",
		category: SettingCategory.GENERAL,
		type: EpluginSettingType.text,
		defaultValue: "",
		isConfigurableFromFile: true,
		isConfigurableFromUI: false,
		validate: validateStringNoEmpty,
		validateBackend: function(schema){
			return schema.string({validate: this.validate});
		},
	},
	"extensions.audit": {
		title: "System auditing",
		description: "Enable or disable the Audit tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		defaultValue: true,
		isConfigurableFromFile: true,
		isConfigurableFromUI: false,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"extensions.aws": {
		title: "Amazon AWS",
		description: "Enable or disable the Amazon (AWS) tab on Overview.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		defaultValue: false,
		isConfigurableFromFile: true,
		isConfigurableFromUI: false,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"extensions.ciscat": {
		title: "CIS-CAT",
		description: "Enable or disable the CIS-CAT tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		defaultValue: false,
		isConfigurableFromFile: true,
		isConfigurableFromUI: false,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"extensions.docker": {
		title: "Docker Listener",
		description: "Enable or disable the Docker listener tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		defaultValue: false,
		isConfigurableFromFile: true,
		isConfigurableFromUI: false,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"extensions.gcp": {
		title: "Google Cloud platform",
		description: "Enable or disable the Google Cloud Platform tab on Overview.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		defaultValue: false,
		isConfigurableFromFile: true,
		isConfigurableFromUI: false,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"extensions.gdpr": {
		title: "GDPR",
		description: "Enable or disable the GDPR tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		defaultValue: true,
		isConfigurableFromFile: true,
		isConfigurableFromUI: false,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"extensions.hipaa": {
		title: "Hipaa",
		description: "Enable or disable the HIPAA tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		defaultValue: true,
		isConfigurableFromFile: true,
		isConfigurableFromUI: false,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"extensions.nist": {
		title: "NIST",
		description: "Enable or disable the NIST 800-53 tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		defaultValue: true,
		isConfigurableFromFile: true,
		isConfigurableFromUI: false,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"extensions.oscap": {
		title: "OSCAP",
		description: "Enable or disable the Open SCAP tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		defaultValue: false,
		isConfigurableFromFile: true,
		isConfigurableFromUI: false,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"extensions.osquery": {
		title: "Osquery",
		description: "Enable or disable the Osquery tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		defaultValue: false,
		isConfigurableFromFile: true,
		isConfigurableFromUI: false,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"extensions.pci": {
		title: "PCI DSS",
		description: "Enable or disable the PCI DSS tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		defaultValue: true,
		isConfigurableFromFile: true,
		isConfigurableFromUI: false,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"extensions.tsc": {
		title: "TSC",
		description: "Enable or disable the TSC tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		defaultValue: true,
		isConfigurableFromFile: true,
		isConfigurableFromUI: false,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"extensions.virustotal": {
		title: "Virustotal",
		description: "Enable or disable the VirusTotal tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		defaultValue: false,
		isConfigurableFromFile: true,
		isConfigurableFromUI: false,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"hideManagerAlerts": {
		title: "Hide manager alerts",
		description: "Hide the alerts of the manager in every dashboard.",
		category: SettingCategory.GENERAL,
		type: EpluginSettingType.switch,
		defaultValue: false,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		requiresReloadingBrowserTab: true,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"ip.ignore": {
		title: "Index pattern ignore",
		description: "Disable certain index pattern names from being available in index pattern selector.",
		category: SettingCategory.GENERAL,
		type: EpluginSettingType.editor,
		defaultValue: [],
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		options: {
			editor: {
				language: 'json'
			}
		},
		uiFormTransformConfigurationValueToInputValue: function(value : any): any{
			return JSON.stringify(value);
		},
		uiFormTransformInputValueToConfigurationValue: function(value: string): any{
			try{
				return JSON.parse(value);
			}catch(error){
				return value;
			};
		},
		validate: validateJSONArrayOfStrings,
		validateBackend: function(schema){
			return schema.arrayOf(schema.string({validate: composeValidate(validateStringNoEmpty, validateStringNoSpaces)}));
		}
	},
	"ip.selector": {
		title: "IP selector",
		description: "Define if the user is allowed to change the selected index pattern directly from the top menu bar.",
		category: SettingCategory.GENERAL,
		type: EpluginSettingType.switch,
		defaultValue: true,
		isConfigurableFromFile: true,
		isConfigurableFromUI: false,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"logs.level": {
		title: "Log level",
		description: "Logging level of the App.",
		category: SettingCategory.GENERAL,
		type: EpluginSettingType.select,
		options: {
			select: [
				{
					text: "Info",
					value: "info"
				},
				{
					text: "Debug",
					value: "debug"
				}
			]
		},
		defaultValue: "info",
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		requiresRestartingPluginPlatform: true,
		validate: function (value){
			return validateLiteral(this.options.select.map(({value}) => value))(value)
		},
		validateBackend: function(schema){
			return schema.oneOf(this.options.select.map(({value}) => schema.literal(value)));
		},
	},
	"pattern": {
		title: "Index pattern",
		description: "Default index pattern to use on the app. If there's no valid index pattern, the app will automatically create one with the name indicated in this option.",
		category: SettingCategory.GENERAL,
		type: EpluginSettingType.text,
		defaultValue: WAZUH_ALERTS_PATTERN,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		requiresRunningHealthCheck: true,
		validate: composeValidate(validateStringNoEmpty, validateStringNoSpaces),
		validateBackend: function(schema){
			return schema.string({validate: this.validate});
		},
	},
	"timeout": {
		title: "Request timeout",
		description: "Maximum time, in milliseconds, the app will wait for an API response when making requests to it. It will be ignored if the value is set under 1500 milliseconds.",
		category: SettingCategory.GENERAL,
		type: EpluginSettingType.number,
		defaultValue: 20000,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		options: {
			number: {
				min: 1500
			}
		},
		validate: function(value){
			return validateNumber(this.options.number)(value);
		},
		validateBackend: function(schema){
			return schema.number({validate: this.validate.bind(this)});
		},
	},
	"wazuh.monitoring.creation": {
		title: "Index creation",
		description: "Define the interval in which a new wazuh-monitoring index will be created.",
		category: SettingCategory.MONITORING,
		type: EpluginSettingType.select,
		options: {
			select: [
				{
					text: "Hourly",
					value: "h"
				},
				{
					text: "Daily",
					value: "d"
				},
				{
					text: "Weekly",
					value: "w"
				},
				{
					text: "Monthly",
					value: "m"
				}
			]
		},
		defaultValue: WAZUH_MONITORING_DEFAULT_CREATION,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		requiresRunningHealthCheck: true,
		validate: function (value){
			return validateLiteral(this.options.select.map(({value}) => value))(value)
		},
		validateBackend: function(schema){
			return schema.oneOf(this.options.select.map(({value}) => schema.literal(value)));
		},
	},
	"wazuh.monitoring.enabled": {
		title: "Status",
		description: "Enable or disable the wazuh-monitoring index creation and/or visualization.",
		category: SettingCategory.MONITORING,
		type: EpluginSettingType.switch,
		defaultValue: WAZUH_MONITORING_DEFAULT_ENABLED,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		requiresRestartingPluginPlatform: true,
		options: {
			switch: {
				values: {
					disabled: {label: 'false', value: false},
					enabled: {label: 'true', value: true},
				}
			}
		},
		uiFormTransformChangedInputValue: function(value: boolean | string): boolean{
			return Boolean(value);
		},
		validate: validateBooleanIs,
		validateBackend: function(schema){
			return schema.boolean();
		},
	},
	"wazuh.monitoring.frequency": {
		title: "Frequency",
		description: "Frequency, in seconds, of API requests to get the state of the agents and create a new document in the wazuh-monitoring index with this data.",
		category: SettingCategory.MONITORING,
		type: EpluginSettingType.number,
		defaultValue: WAZUH_MONITORING_DEFAULT_FREQUENCY,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		requiresRestartingPluginPlatform: true,
		options: {
			number: {
				min: 60
			}
		},
		validate: function(value){
			return validateNumber(this.options.number)(value);
		},
		validateBackend: function(schema){
			return schema.number({validate: this.validate.bind(this)});
		},
	},
	"wazuh.monitoring.pattern": {
		title: "Index pattern",
		description: "Default index pattern to use for Wazuh monitoring.",
		category: SettingCategory.MONITORING,
		type: EpluginSettingType.text,
		defaultValue: WAZUH_MONITORING_PATTERN,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		requiresRunningHealthCheck: true,
		validate: composeValidate(validateStringNoEmpty, validateStringNoSpaces),
		validateBackend: function(schema){
			return schema.string({minLength: 1, validate: this.validate});
		},
	},
	"wazuh.monitoring.replicas": {
		title: "Index replicas",
		description: "Define the number of replicas to use for the wazuh-monitoring-* indices.",
		category: SettingCategory.MONITORING,
		type: EpluginSettingType.text,
		defaultValue: WAZUH_MONITORING_DEFAULT_INDICES_REPLICAS,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		requiresRunningHealthCheck: true,
		options: {
			number: {
				min: 0
			}
		},
		validate: function(value){
			return validateNumber(this.options.number)(value);
		},
		validateBackend: function(schema){
			return schema.number({validate: this.validate.bind(this)});
		},
	},
	"wazuh.monitoring.shards": {
		title: "Index shards",
		description: "Define the number of shards to use for the wazuh-monitoring-* indices.",
		category: SettingCategory.MONITORING,
		type: EpluginSettingType.number,
		defaultValue: WAZUH_MONITORING_DEFAULT_INDICES_SHARDS,
		isConfigurableFromFile: true,
		isConfigurableFromUI: true,
		requiresRunningHealthCheck: true,
		options: {
			number: {
				min: 1
			}
		},
		validate: function(value){
			return validateNumber(this.options.number)(value);
		},
		validateBackend: function(schema){
			return schema.number({validate: this.validate.bind(this)});
		},
	}
};

export type TPluginSettingKey = keyof typeof PLUGIN_SETTINGS;
