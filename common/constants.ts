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
export const WAZUH_CONFIGURATION_SETTINGS_NEED_RESTART = [
  'wazuh.monitoring.enabled',
  'wazuh.monitoring.frequency',
  'cron.statistics.interval',
  'logs.level',
];
export const WAZUH_CONFIGURATION_SETTINGS_NEED_HEALTH_CHECK = [
  'pattern',
  'wazuh.monitoring.replicas',
  'wazuh.monitoring.creation',
  'wazuh.monitoring.pattern',
  'alerts.sample.prefix',
  'cron.statistics.index.name',
  'cron.statistics.index.creation',
  'cron.statistics.index.shards',
  'cron.statistics.index.replicas',
  'wazuh.monitoring.shards',
];
export const WAZUH_CONFIGURATION_SETTINGS_NEED_RELOAD = [
  'hideManagerAlerts',
  'customization.logo.sidebar'
];

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

// Default App Config
export const WAZUH_DEFAULT_APP_CONFIG = {
  pattern: WAZUH_ALERTS_PATTERN,
  'checks.pattern': true,
  'checks.template': true,
  'checks.api': true,
  'checks.setup': true,
  'checks.fields': true,
  'checks.metaFields': true,
  'checks.maxBuckets': true,
  'checks.timeFilter': true,
  'extensions.pci': true,
  'extensions.gdpr': true,
  'extensions.hipaa': true,
  'extensions.nist': true,
  'extensions.tsc': true,
  'extensions.audit': true,
  'extensions.oscap': false,
  'extensions.ciscat': false,
  'extensions.aws': false,
  'extensions.office': false,
  'extensions.github': false,
  'extensions.gcp': false,
  'extensions.virustotal': false,
  'extensions.osquery': false,
  'extensions.docker': false,
  timeout: 20000,
  'ip.selector': true,
  'ip.ignore': [],
  'xpack.rbac.enabled': true,
  'wazuh.monitoring.enabled': WAZUH_MONITORING_DEFAULT_ENABLED,
  'wazuh.monitoring.frequency': WAZUH_MONITORING_DEFAULT_FREQUENCY,
  'wazuh.monitoring.shards': WAZUH_MONITORING_DEFAULT_INDICES_SHARDS,
  'wazuh.monitoring.replicas': WAZUH_MONITORING_DEFAULT_INDICES_REPLICAS,
  'wazuh.monitoring.creation': WAZUH_MONITORING_DEFAULT_CREATION,
  'wazuh.monitoring.pattern': WAZUH_MONITORING_PATTERN,
  'cron.prefix': WAZUH_STATISTICS_DEFAULT_PREFIX,
  'cron.statistics.status': WAZUH_STATISTICS_DEFAULT_STATUS,
  'cron.statistics.apis': [],
  'cron.statistics.interval': WAZUH_STATISTICS_DEFAULT_CRON_FREQ,
  'cron.statistics.index.name': WAZUH_STATISTICS_DEFAULT_NAME,
  'cron.statistics.index.creation': WAZUH_STATISTICS_DEFAULT_CREATION,
  'cron.statistics.index.shards': WAZUH_STATISTICS_DEFAULT_INDICES_SHARDS,
  'cron.statistics.index.replicas': WAZUH_STATISTICS_DEFAULT_INDICES_REPLICAS,
  'alerts.sample.prefix': WAZUH_SAMPLE_ALERT_PREFIX,
  hideManagerAlerts: false,
  'logs.level': 'info',
  'enrollment.dns': '',
  'enrollment.password': '',
  'customization.logo.app': '',
  'customization.logo.sidebar': '',
  'customization.logo.healthcheck':'',
  'customization.logo.reports': ''
};

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
];

// Documentation
export const DOCUMENTATION_WEB_BASE_URL = "https://documentation.wazuh.com";

// Default Elasticsearch user name context
export const ELASTIC_NAME = 'elastic';
