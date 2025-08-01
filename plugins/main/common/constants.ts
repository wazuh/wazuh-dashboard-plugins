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
export const PLUGIN_VERSION_SHORT = version.split('.').splice(0, 2).join('.');

// Index patterns - Wazuh alerts
export const WAZUH_INDEX_TYPE_ALERTS = 'alerts';
export const WAZUH_ALERTS_PREFIX = 'wazuh-alerts-';
export const WAZUH_ALERTS_PATTERN = 'wazuh-alerts-*';

// Job - Wazuh monitoring
export const WAZUH_INDEX_TYPE_MONITORING = 'monitoring';
export const WAZUH_MONITORING_PATTERN = 'wazuh-monitoring-*';

// Job - Wazuh statistics
export const WAZUH_INDEX_TYPE_STATISTICS = 'statistics';
export const WAZUH_STATISTICS_PATTERN = 'wazuh-statistics-*';

// Wazuh vulnerabilities
export const WAZUH_VULNERABILITIES_PATTERN = 'wazuh-states-vulnerabilities-*';
export const WAZUH_INDEX_TYPE_VULNERABILITIES = 'vulnerabilities';
export const VULNERABILITY_IMPLICIT_CLUSTER_MODE_FILTER = 'wazuh.cluster.name';

// FIM
export const WAZUH_FIM_PATTERN = 'wazuh-states-fim-*';
export const WAZUH_FIM_FILES_PATTERN = 'wazuh-states-fim-files-*';
export const WAZUH_FIM_REGISTRY_KEYS_PATTERN =
  'wazuh-states-fim-registry-keys-*';
export const WAZUH_FIM_REGISTRY_VALUES_PATTERN =
  'wazuh-states-fim-registry-values-*';

// System inventory
export const WAZUH_IT_HYGIENE_PATTERN = 'wazuh-states-inventory-*';
export const WAZUH_IT_HYGIENE_HARDWARE_PATTERN =
  'wazuh-states-inventory-hardware-*';
export const WAZUH_IT_HYGIENE_HOTFIXES_PATTERN =
  'wazuh-states-inventory-hotfixes-*';
export const WAZUH_IT_HYGIENE_INTERFACES_PATTERN =
  'wazuh-states-inventory-interfaces-*';
export const WAZUH_IT_HYGIENE_NETWORKS_PATTERN =
  'wazuh-states-inventory-networks-*';
export const WAZUH_IT_HYGIENE_PACKAGES_PATTERN =
  'wazuh-states-inventory-packages-*';
export const WAZUH_IT_HYGIENE_PORTS_PATTERN = 'wazuh-states-inventory-ports-*';
export const WAZUH_IT_HYGIENE_PROCESSES_PATTERN =
  'wazuh-states-inventory-processes-*';
export const WAZUH_IT_HYGIENE_PROTOCOLS_PATTERN =
  'wazuh-states-inventory-protocols-*';
export const WAZUH_IT_HYGIENE_SYSTEM_PATTERN =
  'wazuh-states-inventory-system-*';
export const WAZUH_IT_HYGIENE_USERS_PATTERN = 'wazuh-states-inventory-users-*';
export const WAZUH_IT_HYGIENE_GROUPS_PATTERN =
  'wazuh-states-inventory-groups-*';

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
export const WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING =
  'file-integrity-monitoring';
export const WAZUH_SAMPLE_INVENTORY_AGENT = 'wazuh-inventory-agent';
export const WAZUH_SAMPLE_VULNERABILITIES = 'wazuh-vulnerabilities';
export const WAZUH_SAMPLE_AGENT_MONITORING = 'agent-monitoring';
export const WAZUH_SAMPLE_SERVER_STATISTICS = 'server-statistics';
export const WAZUH_SAMPLE_ALERTS_DEFAULT_NUMBER_DOCUMENTS = 3000;
export const WAZUH_SETTING_ALERTS_SAMPLE_PREFIX = {
  settingIndexPattern: 'alerts.sample.prefix',
  dataSet: 'wazuh-alerts',
};

export const WAZUH_SETTING_FIM_FILES_SAMPLE_PREFIX = {
  indexPatternPrefix: WAZUH_FIM_FILES_PATTERN.replace('*', ''),
  dataSet: 'states-fim-files',
};
export const WAZUH_SETTING_FIM_REGISTRY_KEYS_SAMPLE_PREFIX = {
  indexPatternPrefix: WAZUH_FIM_REGISTRY_KEYS_PATTERN.replace('*', ''),
  dataSet: 'states-fim-registry-keys',
};
export const WAZUH_SETTING_FIM_REGISTRY_VALUES_SAMPLE_PREFIX = {
  indexPatternPrefix: WAZUH_FIM_REGISTRY_VALUES_PATTERN.replace('*', ''),
  dataSet: 'states-fim-registry-values',
};
export const WAZUH_SETTING_INVENTORY_HARDWARE_SAMPLE_PREFIX = {
  indexPatternPrefix: WAZUH_IT_HYGIENE_HARDWARE_PATTERN.replace('*', ''),
  dataSet: 'states-inventory-hardware',
};
export const WAZUH_SETTING_INVENTORY_HOTFIXES_SAMPLE_PREFIX = {
  indexPatternPrefix: WAZUH_IT_HYGIENE_HOTFIXES_PATTERN.replace('*', ''),
  dataSet: 'states-inventory-hotfixes',
};
export const WAZUH_SETTING_INVENTORY_INTERFACES_SAMPLE_PREFIX = {
  indexPatternPrefix: WAZUH_IT_HYGIENE_INTERFACES_PATTERN.replace('*', ''),
  dataSet: 'states-inventory-interfaces',
};
export const WAZUH_SETTING_INVENTORY_PACKAGES_SAMPLE_PREFIX = {
  indexPatternPrefix: WAZUH_IT_HYGIENE_PACKAGES_PATTERN.replace('*', ''),
  dataSet: 'states-inventory-packages',
};
export const WAZUH_SETTING_INVENTORY_PORTS_SAMPLE_PREFIX = {
  indexPatternPrefix: WAZUH_IT_HYGIENE_PORTS_PATTERN.replace('*', ''),
  dataSet: 'states-inventory-ports',
};
export const WAZUH_SETTING_INVENTORY_NETWORKS_SAMPLE_PREFIX = {
  indexPatternPrefix: WAZUH_IT_HYGIENE_NETWORKS_PATTERN.replace('*', ''),
  dataSet: 'states-inventory-networks',
};
export const WAZUH_SETTING_INVENTORY_PROCESSES_SAMPLE_PREFIX = {
  indexPatternPrefix: WAZUH_IT_HYGIENE_PROCESSES_PATTERN.replace('*', ''),
  dataSet: 'states-inventory-processes',
};
export const WAZUH_SETTING_INVENTORY_PROTOCOLS_SAMPLE_PREFIX = {
  indexPatternPrefix: WAZUH_IT_HYGIENE_PROTOCOLS_PATTERN.replace('*', ''),
  dataSet: 'states-inventory-protocols',
};
export const WAZUH_SETTING_INVENTORY_SYSTEM_SAMPLE_PREFIX = {
  indexPatternPrefix: WAZUH_IT_HYGIENE_SYSTEM_PATTERN.replace('*', ''),
  dataSet: 'states-inventory-system',
};
export const WAZUH_SETTING_INVENTORY_GROUPS_SAMPLE_PREFIX = {
  indexPatternPrefix: WAZUH_IT_HYGIENE_GROUPS_PATTERN.replace('*', ''),
  dataSet: 'states-inventory-groups',
};
export const WAZUH_SETTING_INVENTORY_USERS_SAMPLE_PREFIX = {
  indexPatternPrefix: WAZUH_IT_HYGIENE_USERS_PATTERN.replace('*', ''),
  dataSet: 'states-inventory-users',
};
export const WAZUH_SETTING_VULNERABILITIES_SAMPLE_PREFIX = {
  indexPatternPrefix: WAZUH_VULNERABILITIES_PATTERN.replace('*', ''),
  dataSet: 'states-vulnerabilities',
};
export const WAZUH_SETTING_AGENTS_MONITORING_SAMPLE_PREFIX = {
  indexPatternPrefix: WAZUH_MONITORING_PATTERN.replace('*', ''),
  dataSet: 'agents-monitoring',
};
export const WAZUH_SETTING_SERVER_STATISTICS_SAMPLE_PREFIX = {
  indexPatternPrefix: WAZUH_STATISTICS_PATTERN.replace('*', ''),
  dataSet: 'server-statistics',
};
export const WAZUH_SAMPLE_DATA_CATEGORIES_TYPE_DATA = {
  [WAZUH_SAMPLE_AGENT_MONITORING]: [
    {
      indexPatternPrefix:
        WAZUH_SETTING_AGENTS_MONITORING_SAMPLE_PREFIX.indexPatternPrefix,
      dataSet: WAZUH_SETTING_AGENTS_MONITORING_SAMPLE_PREFIX.dataSet,
    },
  ],
  [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY]: [
    {
      syscheck: true,
      settingIndexPattern:
        WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.settingIndexPattern,
      dataSet: WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.dataSet,
    },
    {
      aws: true,
      settingIndexPattern:
        WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.settingIndexPattern,
      dataSet: WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.dataSet,
    },
    {
      office: true,
      settingIndexPattern:
        WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.settingIndexPattern,
      dataSet: WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.dataSet,
    },
    {
      gcp: true,
      settingIndexPattern:
        WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.settingIndexPattern,
      dataSet: WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.dataSet,
    },
    {
      authentication: true,
      settingIndexPattern:
        WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.settingIndexPattern,
      dataSet: WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.dataSet,
    },
    {
      ssh: true,
      settingIndexPattern:
        WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.settingIndexPattern,
      dataSet: WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.dataSet,
    },
    {
      apache: true,
      count: 2000,
      settingIndexPattern:
        WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.settingIndexPattern,
      dataSet: WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.dataSet,
    },
    {
      web: true,
      settingIndexPattern:
        WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.settingIndexPattern,
      dataSet: WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.dataSet,
    },
    {
      windows: { service_control_manager: true },
      count: 1000,
      settingIndexPattern:
        WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.settingIndexPattern,
      dataSet: WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.dataSet,
    },
    {
      github: true,
      settingIndexPattern:
        WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.settingIndexPattern,
      dataSet: WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.dataSet,
    },
  ],
  [WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING]: [
    {
      rootcheck: true,
      settingIndexPattern:
        WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.settingIndexPattern,
      dataSet: WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.dataSet,
    },
    {
      audit: true,
      settingIndexPattern:
        WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.settingIndexPattern,
      dataSet: WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.dataSet,
    },
    {
      openscap: true,
      settingIndexPattern:
        WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.settingIndexPattern,
      dataSet: WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.dataSet,
    },
    {
      ciscat: true,
      settingIndexPattern:
        WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.settingIndexPattern,
      dataSet: WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.dataSet,
    },
    {
      virustotal: true,
      settingIndexPattern:
        WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.settingIndexPattern,
      dataSet: WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.dataSet,
    },
    {
      yara: true,
      settingIndexPattern:
        WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.settingIndexPattern,
      dataSet: WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.dataSet,
    },
  ],
  [WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION]: [
    {
      vulnerabilities: true,
      settingIndexPattern:
        WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.settingIndexPattern,
      dataSet: WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.dataSet,
    },
    {
      osquery: true,
      settingIndexPattern:
        WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.settingIndexPattern,
      dataSet: WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.dataSet,
    },
    {
      docker: true,
      settingIndexPattern:
        WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.settingIndexPattern,
      dataSet: WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.dataSet,
    },
    {
      mitre: true,
      settingIndexPattern:
        WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.settingIndexPattern,
      dataSet: WAZUH_SETTING_ALERTS_SAMPLE_PREFIX.dataSet,
    },
  ],
  [WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING]: [
    {
      files: true,
      indexPatternPrefix:
        WAZUH_SETTING_FIM_FILES_SAMPLE_PREFIX.indexPatternPrefix,
      dataSet: WAZUH_SETTING_FIM_FILES_SAMPLE_PREFIX.dataSet,
    },
    {
      indexPatternPrefix:
        WAZUH_SETTING_FIM_REGISTRY_KEYS_SAMPLE_PREFIX.indexPatternPrefix,
      dataSet: WAZUH_SETTING_FIM_REGISTRY_KEYS_SAMPLE_PREFIX.dataSet,
    },
    {
      indexPatternPrefix:
        WAZUH_SETTING_FIM_REGISTRY_VALUES_SAMPLE_PREFIX.indexPatternPrefix,
      dataSet: WAZUH_SETTING_FIM_REGISTRY_VALUES_SAMPLE_PREFIX.dataSet,
    },
  ],
  [WAZUH_SAMPLE_INVENTORY_AGENT]: [
    {
      registries: true,
      indexPatternPrefix:
        WAZUH_SETTING_INVENTORY_HARDWARE_SAMPLE_PREFIX.indexPatternPrefix,
      dataSet: WAZUH_SETTING_INVENTORY_HARDWARE_SAMPLE_PREFIX.dataSet,
    },
    {
      registries: true,
      indexPatternPrefix:
        WAZUH_SETTING_INVENTORY_HOTFIXES_SAMPLE_PREFIX.indexPatternPrefix,
      dataSet: WAZUH_SETTING_INVENTORY_HOTFIXES_SAMPLE_PREFIX.dataSet,
    },
    {
      registries: true,
      indexPatternPrefix:
        WAZUH_SETTING_INVENTORY_INTERFACES_SAMPLE_PREFIX.indexPatternPrefix,
      dataSet: WAZUH_SETTING_INVENTORY_INTERFACES_SAMPLE_PREFIX.dataSet,
    },
    {
      registries: true,
      indexPatternPrefix:
        WAZUH_SETTING_INVENTORY_NETWORKS_SAMPLE_PREFIX.indexPatternPrefix,
      dataSet: WAZUH_SETTING_INVENTORY_NETWORKS_SAMPLE_PREFIX.dataSet,
    },
    {
      registries: true,
      indexPatternPrefix:
        WAZUH_SETTING_INVENTORY_PACKAGES_SAMPLE_PREFIX.indexPatternPrefix,
      dataSet: WAZUH_SETTING_INVENTORY_PACKAGES_SAMPLE_PREFIX.dataSet,
    },
    {
      registries: true,
      indexPatternPrefix:
        WAZUH_SETTING_INVENTORY_PORTS_SAMPLE_PREFIX.indexPatternPrefix,
      dataSet: WAZUH_SETTING_INVENTORY_PORTS_SAMPLE_PREFIX.dataSet,
    },
    {
      registries: true,
      indexPatternPrefix:
        WAZUH_SETTING_INVENTORY_PROCESSES_SAMPLE_PREFIX.indexPatternPrefix,
      dataSet: WAZUH_SETTING_INVENTORY_PROCESSES_SAMPLE_PREFIX.dataSet,
    },
    {
      registries: true,
      indexPatternPrefix:
        WAZUH_SETTING_INVENTORY_PROTOCOLS_SAMPLE_PREFIX.indexPatternPrefix,
      dataSet: WAZUH_SETTING_INVENTORY_PROTOCOLS_SAMPLE_PREFIX.dataSet,
    },
    {
      registries: true,
      indexPatternPrefix:
        WAZUH_SETTING_INVENTORY_SYSTEM_SAMPLE_PREFIX.indexPatternPrefix,
      dataSet: WAZUH_SETTING_INVENTORY_SYSTEM_SAMPLE_PREFIX.dataSet,
    },
    {
      registries: true,
      indexPatternPrefix:
        WAZUH_SETTING_INVENTORY_USERS_SAMPLE_PREFIX.indexPatternPrefix,
      dataSet: WAZUH_SETTING_INVENTORY_USERS_SAMPLE_PREFIX.dataSet,
    },
    {
      registries: true,
      indexPatternPrefix:
        WAZUH_SETTING_INVENTORY_GROUPS_SAMPLE_PREFIX.indexPatternPrefix,
      dataSet: WAZUH_SETTING_INVENTORY_GROUPS_SAMPLE_PREFIX.dataSet,
    },
  ],
  [WAZUH_SAMPLE_SERVER_STATISTICS]: [
    {
      indexPatternPrefix:
        WAZUH_SETTING_SERVER_STATISTICS_SAMPLE_PREFIX.indexPatternPrefix,
      dataSet: WAZUH_SETTING_SERVER_STATISTICS_SAMPLE_PREFIX.dataSet,
    },
  ],
  [WAZUH_SAMPLE_VULNERABILITIES]: [
    {
      vulnerabilities: true,
      indexPatternPrefix:
        WAZUH_SETTING_VULNERABILITIES_SAMPLE_PREFIX.indexPatternPrefix,
      dataSet: WAZUH_SETTING_VULNERABILITIES_SAMPLE_PREFIX.dataSet,
    },
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

export const DATA_SOURCE_FILTER_CONTROLLED_EXCLUDE_SERVER =
  'hidden-exclude-server';
export const DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT = 'pinned-agent';
export const DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER = 'cluster-manager';
export const DATA_SOURCE_FILTER_CONTROLLED_REGULATORY_COMPLIANCE_REQUIREMENT =
  'hidden-regulatory-compliance-requirement';
export const DATA_SOURCE_FILTER_CONTROLLED_PCI_DSS_EXIST = 'pci-dss-exist';
export const DATA_SOURCE_FILTER_CONTROLLED_VULNERABILITIES_RULE_GROUP =
  'vulnerabilities-rule-group';
export const DATA_SOURCE_FILTER_CONTROLLED_OFFICE_365_RULE_GROUP =
  'office-365-rule-group';
export const DATA_SOURCE_FILTER_CONTROLLED_GITHUB_RULE_GROUP =
  'github-rule-group';
export const DATA_SOURCE_FILTER_CONTROLLED_TSC_EXIST = 'tsc-rule-exist';
export const DATA_SOURCE_FILTER_CONTROLLED_NIST_800_53_EXIST =
  'nist-800-53-rule-exist';
export const DATA_SOURCE_FILTER_CONTROLLED_GDPR_EXIST = 'gdpr-rule-exist';
export const DATA_SOURCE_FILTER_CONTROLLED_HIPAA_EXIST = 'hipaa-rule-exist';
export const DATA_SOURCE_FILTER_CONTROLLED_DOCKER_RULE_GROUP =
  'docker-rule-group';
export const DATA_SOURCE_FILTER_CONTROLLED_MITRE_ATTACK_RULE =
  'mitre-attack-rule';
export const DATA_SOURCE_FILTER_CONTROLLED_MITRE_ATTACK_RULE_ID =
  'hidden-mitre-attack-rule-id';
export const DATA_SOURCE_FILTER_CONTROLLED_GOOGLE_CLOUD_RULE_GROUP =
  'gcp-rule-group';
export const DATA_SOURCE_FILTER_CONTROLLED_MALWARE_DETECTION_RULE_GROUP =
  'malware-detection-rule-group';
export const DATA_SOURCE_FILTER_CONTROLLED_AWS_RULE_GROUP = 'aws-rule-group';
export const DATA_SOURCE_FILTER_CONTROLLED_FIM_RULE_GROUP = 'fim-rule-group';
export const DATA_SOURCE_FILTER_CONTROLLED_CONFIGURATION_ASSASSMENT_RULE_GROUP =
  'configuration-assessment-rule-group';

// Wazuh links
export const WAZUH_LINK_GITHUB = 'https://github.com/wazuh';
export const WAZUH_LINK_GOOGLE_GROUPS =
  'https://groups.google.com/forum/#!forum/wazuh';
export const WAZUH_LINK_SLACK = 'https://wazuh.com/community/join-us-on-slack';

export const HEALTH_CHECK = 'health-check';

// Health check
export const HEALTH_CHECK_REDIRECTION_TIME = 300; // ms

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
  'user-manual/wazuh-dashboard/settings.html';
export const PLUGIN_PLATFORM_URL_GUIDE =
  'https://opensearch.org/docs/2.10/about';
export const PLUGIN_PLATFORM_URL_GUIDE_TITLE = 'OpenSearch guide';

export const PLUGIN_PLATFORM_REQUEST_HEADERS = {
  'osd-xsrf': 'kibana',
};

// Plugin app
export const PLUGIN_APP_NAME = 'dashboard';

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

export const API_NAME_TASK_STATUS = {
  DONE: 'Done',
  IN_PROGRESS: 'In progress',
  FAILED: 'Failed',
  TIMEOUT: 'Timeout',
} as const;

export const UI_TASK_STATUS = [
  API_NAME_TASK_STATUS.DONE,
  API_NAME_TASK_STATUS.IN_PROGRESS,
  API_NAME_TASK_STATUS.FAILED,
  API_NAME_TASK_STATUS.TIMEOUT,
];

export const UI_TASK_STATUS_COLORS = {
  [API_NAME_TASK_STATUS.DONE]: 'success',
  [API_NAME_TASK_STATUS.IN_PROGRESS]: 'warning',
  [API_NAME_TASK_STATUS.FAILED]: 'danger',
  [API_NAME_TASK_STATUS.TIMEOUT]: 'subdued',
};

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

// ID used to refer the createOsdUrlStateStorage state
export const OSD_URL_STATE_STORAGE_ID = 'state:storeInSessionStorage';

export const APP_STATE_URL_KEY = '_a';
export const GLOBAL_STATE_URL_KEY = '_g';

export enum FilterStateStore {
  APP_STATE = 'appState',
  GLOBAL_STATE = 'globalState',
}

export const SUPPORTED_LANGUAGES = {
  DQL: 'kuery',
  LUCENE: 'lucene',
} as const;

export const SUPPORTED_LANGUAGES_ARRAY = Object.values(SUPPORTED_LANGUAGES);
