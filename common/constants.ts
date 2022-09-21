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

type TpluginSettingOptionsSelect = {
	select: {text: string, value: any}[]
};

type TpluginSettingOptionsNumber = {
	number: {
		min?: number
		max?: number
	}
};

type TpluginSettingOptionsEditor = {
	editor: {
		language: string
	}
};

type TpluginSettingOptionsSwitch = {
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

export type TpluginSetting = {
	title: string // Define the text displayed in the UI.
	description: string // Description.
	category: SettingCategory // Category.
	type: EpluginSettingType // Type.
	default: any // Default value.
	defaultHidden?: any // Default value if it is not set. It has preference over `default`
	configurableFile: boolean, // Configurable from the configuration file
	configurableUI: boolean // Configurable from the UI (Settings/Configuration)
	requireHealthCheck?: boolean // Modify the setting requires running the plugin health check (frontend)
	requireReload?: boolean // Modify the setting requires reloading the browser tab (frontend)
	requireRestart?: boolean // Modify the setting requires restarting the plugin platform to take effect
	options?: TpluginSettingOptionsNumber | TpluginSettingOptionsEditor | TpluginSettingOptionsSelect | TpluginSettingOptionsSwitch // Define options related to the `type`
	uiFormTransformChangedInputValue?: (value: any) => any // Transform the input value. The result is saved in the form global state of Settings/Configuration
	uiFormTransformInputValueToConfigurationValue?: (value: any) => any // Transform the configuration value or default as initial value for the input in Settings/Configuration
	uiFormTransformConfigurationValueToInputValue?: (value: any) => any // Transform the input value changed in the form of Settings/Configuration and returned in the `changed` property of the hook useForm
};

export type TPluginSettingWithKey = TpluginSetting & { key: string };

type TpluginSettings = {
	[key: string]: TpluginSetting
};

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


export const PLUGIN_SETTINGS: TpluginSettings = {
	"alerts.sample.prefix": {
		title: "Sample alerts prefix",
		description: "Define the index name prefix of sample alerts. It must match the template used by the index pattern to avoid unknown fields in dashboards.",
		category: SettingCategory.GENERAL,
		type: EpluginSettingType.text,
		default: WAZUH_SAMPLE_ALERT_PREFIX,
		configurableFile: true,
		configurableUI: true,
		requireHealthCheck: true,
	},
	"checks.api": {
		title: "API connection",
		description: "Enable or disable the API health check when opening the app.",
		category: SettingCategory.HEALTH_CHECK,
		type: EpluginSettingType.switch,
		default: true,
		configurableFile: true,
		configurableUI: true,
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
	},
	"checks.fields": {
		title: "Known fields",
		description: "Enable or disable the known fields health check when opening the app.",
		category: SettingCategory.HEALTH_CHECK,
		type: EpluginSettingType.switch,
		default: true,
		configurableFile: true,
		configurableUI: true,
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
	},
	"checks.maxBuckets": {
		title: "Set max buckets to 200000",
		description: "Change the default value of the plugin platform max buckets configuration.",
		category: SettingCategory.HEALTH_CHECK,
		type: EpluginSettingType.switch,
		default: true,
		configurableFile: true,
		configurableUI: true,
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
	},
	"checks.metaFields": {
		title: "Remove meta fields",
		description: "Change the default value of the plugin platform metaField configuration.",
		category: SettingCategory.HEALTH_CHECK,
		type: EpluginSettingType.switch,
		default: true,
		configurableFile: true,
		configurableUI: true,
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
	},
	"checks.pattern": {
		title: "Index pattern",
		description: "Enable or disable the index pattern health check when opening the app.",
		category: SettingCategory.HEALTH_CHECK,
		type: EpluginSettingType.switch,
		default: true,
		configurableFile: true,
		configurableUI: true,
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
	},
	"checks.setup": {
		title: "API version",
		description: "Enable or disable the setup health check when opening the app.",
		category: SettingCategory.HEALTH_CHECK,
		type: EpluginSettingType.switch,
		default: true,
		configurableFile: true,
		configurableUI: true,
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
	},
	"checks.template": {
		title: "Index template",
		description: "Enable or disable the template health check when opening the app.",
		category: SettingCategory.HEALTH_CHECK,
		type: EpluginSettingType.switch,
		default: true,
		configurableFile: true,
		configurableUI: true,
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
	},
	"checks.timeFilter": {
		title: "Set time filter to 24h",
		description: "Change the default value of the plugin platform timeFilter configuration.",
		category: SettingCategory.HEALTH_CHECK,
		type: EpluginSettingType.switch,
		default: true,
		configurableFile: true,
		configurableUI: true,
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
	},
	"cron.prefix": {
		title: "Cron prefix",
		description: "Define the index prefix of predefined jobs.",
		category: SettingCategory.GENERAL,
		type: EpluginSettingType.text,
		default: WAZUH_STATISTICS_DEFAULT_PREFIX,
		configurableFile: true,
		configurableUI: true,
	},
	"cron.statistics.apis": {
		title: "Includes APIs",
		description: "Enter the ID of the hosts you want to save data from, leave this empty to run the task on every host.",
		category: SettingCategory.STATISTICS,
		type: EpluginSettingType.editor,
		default: [],
		configurableFile: true,
		configurableUI: true,
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
		default: WAZUH_STATISTICS_DEFAULT_CREATION,
		configurableFile: true,
		configurableUI: true,
		requireHealthCheck: true,
	},
	"cron.statistics.index.name": {
		title: "Index name",
		description: "Define the name of the index in which the documents will be saved.",
		category: SettingCategory.STATISTICS,
		type: EpluginSettingType.text,
		default: WAZUH_STATISTICS_DEFAULT_NAME,
		configurableFile: true,
		configurableUI: true,
		requireHealthCheck: true,
	},
	"cron.statistics.index.replicas": {
		title: "Index replicas",
		description: "Define the number of replicas to use for the statistics indices.",
		category: SettingCategory.STATISTICS,
		type: EpluginSettingType.number,
		default: WAZUH_STATISTICS_DEFAULT_INDICES_REPLICAS,
		configurableFile: true,
		configurableUI: true,
		requireHealthCheck: true,
		options: {
			number: {
				min: 0
			}
		},
	},
	"cron.statistics.index.shards": {
		title: "Index shards",
		description: "Define the number of shards to use for the statistics indices.",
		category: SettingCategory.STATISTICS,
		type: EpluginSettingType.number,
		default: WAZUH_STATISTICS_DEFAULT_INDICES_SHARDS,
		configurableFile: true,
		configurableUI: true,
		requireHealthCheck: true,
		options: {
			number: {
				min: 1
			}
		},
	},
	"cron.statistics.interval": {
		title: "Interval",
		description: "Define the frequency of task execution using cron schedule expressions.",
		category: SettingCategory.STATISTICS,
		type: EpluginSettingType.text,
		default: WAZUH_STATISTICS_DEFAULT_CRON_FREQ,
		configurableFile: true,
		configurableUI: true,
		requireRestart: true,
	},
	"cron.statistics.status": {
		title: "Status",
		description: "Enable or disable the statistics tasks.",
		category: SettingCategory.STATISTICS,
		type: EpluginSettingType.switch,
		default: WAZUH_STATISTICS_DEFAULT_STATUS,
		configurableFile: true,
		configurableUI: true,
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
	},
	"customization.logo.app": {
		title: "Logo App",
		description: `Customize the logo displayed in the plugin menu.`,
		category: SettingCategory.CUSTOMIZATION,
		type: EpluginSettingType.text,
		default: "",
		configurableFile: true,
		configurableUI: true,
	},
	"customization.logo.healthcheck": {
		title: "Logo Health Check",
		description: `Customize the logo displayed in the plugin health check.`,
		category: SettingCategory.CUSTOMIZATION,
		type: EpluginSettingType.text,
		default: "",
		configurableFile: true,
		configurableUI: true,
	},
	"customization.logo.reports": {
		title: "Logo Reports",
		description: `Customize the logo displayed in the PDF reports.`,
		category: SettingCategory.CUSTOMIZATION,
		type: EpluginSettingType.text,
		default: "",
    	defaultHidden: REPORTS_LOGO_IMAGE_ASSETS_RELATIVE_PATH,
		configurableFile: true,
		configurableUI: true,
	},
	"customization.logo.sidebar": {
		title: "Logo Sidebar",
		description: `Customize the logo of the category that belongs the plugin.`,
		category: SettingCategory.CUSTOMIZATION,
		type: EpluginSettingType.text,
		default: "",
		configurableFile: true,
		configurableUI: true,
		requireReload: true,
	},
	"disabled_roles": {
		title: "Disables roles",
		description: "Disabled the plugin visibility for users with the roles.",
		category: SettingCategory.SECURITY,
		type: EpluginSettingType.editor,
		default: [],
		configurableFile: true,
		configurableUI: true,
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
	},
	"enrollment.dns": {
		title: "Enrollment DNS",
		description: "Specifies the Wazuh registration server, used for the agent enrollment.",
		category: SettingCategory.GENERAL,
		type: EpluginSettingType.text,
		default: "",
		configurableFile: true,
		configurableUI: true,
	},
	"enrollment.password": {
		title: "Enrollment Password",
		description: "Specifies the password used to authenticate during the agent enrollment.",
		category: SettingCategory.GENERAL,
		type: EpluginSettingType.text,
		default: "",
		configurableFile: true,
		configurableUI: false,
	},
	"extensions.audit": {
		title: "System auditing",
		description: "Enable or disable the Audit tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		default: true,
		configurableFile: true,
		configurableUI: false,
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
	},
	"extensions.aws": {
		title: "Amazon AWS",
		description: "Enable or disable the Amazon (AWS) tab on Overview.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		default: false,
		configurableFile: true,
		configurableUI: false,
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
	},
	"extensions.ciscat": {
		title: "CIS-CAT",
		description: "Enable or disable the CIS-CAT tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		default: false,
		configurableFile: true,
		configurableUI: false,
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
	},
	"extensions.docker": {
		title: "Docker Listener",
		description: "Enable or disable the Docker listener tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		default: false,
		configurableFile: true,
		configurableUI: false,
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
	},
	"extensions.gcp": {
		title: "Google Cloud platform",
		description: "Enable or disable the Google Cloud Platform tab on Overview.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		default: false,
		configurableFile: true,
		configurableUI: false,
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
	},
	"extensions.gdpr": {
		title: "GDPR",
		description: "Enable or disable the GDPR tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		default: true,
		configurableFile: true,
		configurableUI: false,
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
	},
	"extensions.hipaa": {
		title: "Hipaa",
		description: "Enable or disable the HIPAA tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		default: true,
		configurableFile: true,
		configurableUI: false,
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
	},
	"extensions.mitre": {
		title: "MITRE ATT&CK",
		description: "Enable or disable the MITRE tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		default: true,
		configurableFile: true,
		configurableUI: false,
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
	},
	"extensions.nist": {
		title: "NIST",
		description: "Enable or disable the NIST 800-53 tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		default: true,
		configurableFile: true,
		configurableUI: false,
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
	},
	"extensions.oscap": {
		title: "OSCAP",
		description: "Enable or disable the Open SCAP tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		default: false,
		configurableFile: true,
		configurableUI: false,
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
	},
	"extensions.osquery": {
		title: "Osquery",
		description: "Enable or disable the Osquery tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		default: false,
		configurableFile: true,
		configurableUI: false,
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
	},
	"extensions.pci": {
		title: "PCI DSS",
		description: "Enable or disable the PCI DSS tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		default: true,
		configurableFile: true,
		configurableUI: false,
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
	},
	"extensions.tsc": {
		title: "TSC",
		description: "Enable or disable the TSC tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		default: true,
		configurableFile: true,
		configurableUI: false,
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
	},
	"extensions.virustotal": {
		title: "Virustotal",
		description: "Enable or disable the VirusTotal tab on Overview and Agents.",
		category: SettingCategory.EXTENSIONS,
		type: EpluginSettingType.switch,
		default: false,
		configurableFile: true,
		configurableUI: false,
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
	},
	"hideManagerAlerts": {
		title: "Hide manager alerts",
		description: "Hide the alerts of the manager in every dashboard.",
		category: SettingCategory.GENERAL,
		type: EpluginSettingType.switch,
		default: false,
		configurableFile: true,
		configurableUI: true,
		requireReload: true,
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
	},
	"ip.ignore": {
		title: "Index pattern ignore",
		description: "Disable certain index pattern names from being available in index pattern selector.",
		category: SettingCategory.GENERAL,
		type: EpluginSettingType.editor,
		default: [],
		configurableFile: true,
		configurableUI: true,
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
	},
	"ip.selector": {
		title: "IP selector",
		description: "Define if the user is allowed to change the selected index pattern directly from the top menu bar.",
		category: SettingCategory.GENERAL,
		type: EpluginSettingType.switch,
		default: true,
		configurableFile: true,
		configurableUI: false,
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
		default: "info",
		configurableFile: true,
		configurableUI: true,
		requireRestart: true,
	},
	"pattern": {
		title: "Index pattern",
		description: "Default index pattern to use on the app. If there's no valid index pattern, the app will automatically create one with the name indicated in this option.",
		category: SettingCategory.GENERAL,
		type: EpluginSettingType.text,
		default: WAZUH_ALERTS_PATTERN,
		configurableFile: true,
		configurableUI: true,
		requireHealthCheck: true,
	},
	"timeout": {
		title: "Request timeout",
		description: "Maximum time, in milliseconds, the app will wait for an API response when making requests to it. It will be ignored if the value is set under 1500 milliseconds.",
		category: SettingCategory.GENERAL,
		type: EpluginSettingType.number,
		default: 20000,
		configurableFile: true,
		configurableUI: true,
		options: {
			number: {
				min: 1500
			}
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
		default: WAZUH_MONITORING_DEFAULT_CREATION,
		configurableFile: true,
		configurableUI: true,
		requireHealthCheck: true,
	},
	"wazuh.monitoring.enabled": {
		title: "Status",
		description: "Enable or disable the wazuh-monitoring index creation and/or visualization.",
		category: SettingCategory.MONITORING,
		type: EpluginSettingType.switch,
		default: WAZUH_MONITORING_DEFAULT_ENABLED,
		configurableFile: true,
		configurableUI: true,
		requireRestart: true,
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
	},
	"wazuh.monitoring.frequency": {
		title: "Frequency",
		description: "Frequency, in seconds, of API requests to get the state of the agents and create a new document in the wazuh-monitoring index with this data.",
		category: SettingCategory.MONITORING,
		type: EpluginSettingType.number,
		default: WAZUH_MONITORING_DEFAULT_FREQUENCY,
		configurableFile: true,
		configurableUI: true,
		requireRestart: true,
		options: {
			number: {
				min: 60
			}
		},
	},
	"wazuh.monitoring.pattern": {
		title: "Index pattern",
		description: "Default index pattern to use for Wazuh monitoring.",
		category: SettingCategory.MONITORING,
		type: EpluginSettingType.text,
		default: WAZUH_MONITORING_PATTERN,
		configurableFile: true,
		configurableUI: true,
		requireHealthCheck: true,
	},
	"wazuh.monitoring.replicas": {
		title: "Index replicas",
		description: "Define the number of replicas to use for the wazuh-monitoring-* indices.",
		category: SettingCategory.MONITORING,
		type: EpluginSettingType.text,
		default: WAZUH_MONITORING_DEFAULT_INDICES_REPLICAS,
		configurableFile: true,
		configurableUI: true,
		requireHealthCheck: true,
		options: {
			number: {
				min: 0
			}
		},
	},
	"wazuh.monitoring.shards": {
		title: "Index shards",
		description: "Define the number of shards to use for the wazuh-monitoring-* indices.",
		category: SettingCategory.MONITORING,
		type: EpluginSettingType.number,
		default: WAZUH_MONITORING_DEFAULT_INDICES_SHARDS,
		configurableFile: true,
		configurableUI: true,
		requireHealthCheck: true,
		options: {
			number: {
				min: 1
			}
		},
	}
};
