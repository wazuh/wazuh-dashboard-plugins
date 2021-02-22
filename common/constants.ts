/*
 * Wazuh app - Wazuh Constants file
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import path  from 'path';

// Index patterns - Wazuh alerts
export const WAZUH_INDEX_TYPE_ALERTS = "alerts";
export const WAZUH_ALERTS_PREFIX = "wazuh-alerts-";
export const WAZUH_ALERTS_PATTERN = "wazuh-alerts-*";

// Job - Wazuh monitoring

export const WAZUH_INDEX_TYPE_MONITORING = "monitoring";
export const WAZUH_MONITORING_PREFIX = "wazuh-monitoring-";
export const WAZUH_MONITORING_PATTERN = "wazuh-monitoring-*";
export const WAZUH_MONITORING_TEMPLATE_NAME = "wazuh-agent";
export const WAZUH_MONITORING_DEFAULT_INDICES_SHARDS = 2;
export const WAZUH_MONITORING_DEFAULT_CREATION = 'd';
export const WAZUH_MONITORING_DEFAULT_ENABLED = true;
export const WAZUH_MONITORING_DEFAULT_FREQUENCY = 900;
export const WAZUH_MONITORING_DEFAULT_CRON_FREQ = '0 * * * * *';

// Job - Wazuh statistics

export const WAZUH_INDEX_TYPE_STATISTICS = "statistics";

// Job - Wazuh initialize
export const WAZUH_INDEX = '.wazuh';
export const WAZUH_VERSION_INDEX = '.wazuh-version';
export const WAZUH_KIBANA_TEMPLATE_NAME = 'wazuh-kibana';

// Permissions
export const WAZUH_ROLE_ADMINISTRATOR_ID = 1;
export const WAZUH_ROLE_ADMINISTRATOR_NAME = 'administrator';

// Sample data
export const WAZUH_SAMPLE_ALERT_PREFIX = "wazuh-alerts-4.x-";
export const WAZUH_SAMPLE_ALERTS_INDEX_SHARDS = 1;
export const WAZUH_SAMPLE_ALERTS_INDEX_REPLICAS = 0;
export const WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY = "security";
export const WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING = "auditing-policy-monitoring";
export const WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION = "threat-detection";
export const WAZUH_SAMPLE_ALERTS_DEFAULT_NUMBER_ALERTS = 3000;
export const WAZUH_SAMPLE_ALERTS_CATEGORIES_TYPE_ALERTS = {
  [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY]: [{ syscheck: true }, { aws: true }, { gcp: true }, { authentication: true }, { ssh: true }, { apache: true, alerts: 2000 }, { web: true }, { windows: { service_control_manager: true }, alerts: 1000 }],
  [WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING]: [{ rootcheck: true }, { audit: true }, { openscap: true }, { ciscat: true }],
  [WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION]: [{ vulnerabilities: true }, { virustotal: true }, { osquery: true }, { docker: true }, { mitre: true }]
};

// Security
export const WAZUH_SECURITY_PLUGIN_XPACK_SECURITY = 'X-Pack Security';
export const WAZUH_SECURITY_PLUGIN_OPEN_DISTRO_FOR_ELASTICSEARCH = 'Open Distro for Elasticsearch';

export const WAZUH_SECURITY_PLUGINS = [
  WAZUH_SECURITY_PLUGIN_XPACK_SECURITY,
  WAZUH_SECURITY_PLUGIN_OPEN_DISTRO_FOR_ELASTICSEARCH
];

// Default time filter set by the app
export const WAZUH_TIME_FILTER_DEFAULT = {
  from: "now-24h",
  to: 'now'
};

//Default max buckets set by the app
export const WAZUH_MAX_BUCKETS_DEFAULT = 200000;

// App configuration
export const WAZUH_CONFIGURATION_CACHE_TIME = 10000 // time in ms;
export const WAZUH_CONFIGURATION_SETTINGS_NEED_RESTART = [
  'pattern',
  'wazuh.monitoring.enabled',
  'wazuh.monitoring.frequency',
  'wazuh.monitoring.shards',
  'wazuh.monitoring.replicas',
  'wazuh.monitoring.creation',
  'wazuh.monitoring.pattern',
  'alerts.sample.prefix',
  'cron.statistics.interval',
  'cron.statistics.index.name',
  'cron.statistics.index.creation',
  'cron.statistics.index.shards',
  'cron.statistics.index.replicas',
  'logs.level',
];
export const WAZUH_CONFIGURATION_SETTINGS_NEED_RELOAD = [
  'hideManagerAlerts',
];

// Default number of shards and replicas for indices
export const WAZUH_INDEX_SHARDS = 2;
export const WAZUH_INDEX_REPLICAS = 0;

// Reserved ids for Users/Role mapping
export const WAZUH_API_RESERVED_ID_LOWER_THAN = 100;

// Wazuh data path
const WAZUH_DATA_KIBANA_BASE_PATH = 'data';
export const WAZUH_DATA_KIBANA_BASE_ABSOLUTE_PATH = path.join(__dirname, '../../../', WAZUH_DATA_KIBANA_BASE_PATH);
export const WAZUH_DATA_ABSOLUTE_PATH = path.join(WAZUH_DATA_KIBANA_BASE_ABSOLUTE_PATH, 'wazuh');

// Wazuh data path - config
export const WAZUH_DATA_CONFIG_DIRECTORY_PATH = path.join(WAZUH_DATA_ABSOLUTE_PATH, 'config');
export const WAZUH_DATA_CONFIG_APP_PATH = path.join(WAZUH_DATA_CONFIG_DIRECTORY_PATH, 'wazuh.yml');
export const WAZUH_DATA_CONFIG_REGISTRY_PATH = path.join(WAZUH_DATA_CONFIG_DIRECTORY_PATH, 'wazuh-registry.json');

// Wazuh data path - logs
export const WAZUH_DATA_LOGS_DIRECTORY_PATH = path.join(WAZUH_DATA_ABSOLUTE_PATH, 'logs');
export const WAZUH_DATA_LOGS_PLAIN_PATH = path.join(WAZUH_DATA_LOGS_DIRECTORY_PATH, 'wazuhapp-plain.log');
export const WAZUH_DATA_LOGS_RAW_PATH = path.join(WAZUH_DATA_LOGS_DIRECTORY_PATH, 'wazuhapp.log');

// Wazuh data path - downloads
export const WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH = path.join(WAZUH_DATA_ABSOLUTE_PATH, 'downloads');
export const WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH = path.join(WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH, 'reports');

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
  'extensions.gcp': false,
  'extensions.virustotal': false,
  'extensions.osquery': false,
  'extensions.docker': false,
  timeout: 20000,
  'api.selector': true,
  'ip.selector': true,
  'ip.ignore': [],
  'xpack.rbac.enabled': true,
  'wazuh.monitoring.enabled': true,
  'wazuh.monitoring.frequency': 900,
  'wazuh.monitoring.shards': WAZUH_INDEX_SHARDS,
  'wazuh.monitoring.replicas': WAZUH_INDEX_REPLICAS,
  'wazuh.monitoring.creation': 'd',
  'wazuh.monitoring.pattern': WAZUH_MONITORING_PATTERN,
  'cron.prefix': 'wazuh',
  'cron.statistics.status': true,
  'cron.statistics.apis': [],
  'cron.statistics.interval': '0 */5 * * * *',
  'cron.statistics.index.name': 'statistics',
  'cron.statistics.index.creation': 'w',
  'cron.statistics.index.shards': WAZUH_INDEX_SHARDS,
  'cron.statistics.index.replicas': WAZUH_INDEX_REPLICAS,
  'alerts.sample.prefix': WAZUH_SAMPLE_ALERT_PREFIX,
  hideManagerAlerts: false,
  'logs.level': 'info',
  'enrollment.dns': ''
};

// Wazuh errors
export const WAZUH_ERROR_DAEMONS_NOT_READY = 'ERROR3099 - Some Wazuh daemons are not ready yet in node';

// Agents
export enum WAZUH_AGENTS_OS_TYPE{
  WINDOWS = 'windows',
  LINUX = 'linux',
  SUNOS = 'sunos',
  DARWIN = 'darwin',
  OTHERS = ''
}

export enum WAZUH_MODULES_ID{
  SECURITY_EVENTS = 'general',
  INTEGRITY_MONITORING = 'fim',
  AMAZON_WEB_SERVICES = 'aws',
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
  GDPR = 'gdpr'
}
