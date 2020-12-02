/*
 * Wazuh app - Wazuh Constants file
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// Index patterns
export const WAZUH_ALERTS_PREFIX = "wazuh-alerts-";
export const WAZUH_ALERTS_PATTERN = "wazuh-alerts-*";
export const WAZUH_MONITORING_PREFIX = "wazuh-monitoring-";
export const WAZUH_MONITORING_PATTERN = "wazuh-monitoring-*";

// Permissions
export const WAZUH_ROLE_ADMINISTRATOR_ID = 1;
export const WAZUH_ROLE_ADMINISTRATOR_NAME = 'administrator';

// Sample data
export const WAZUH_SAMPLE_ALERT_PREFIX = "wazuh-alerts-4.x-";
export const WAZUH_SAMPLE_ALERTS_INDEX_SHARDS = 1;
export const WAZUH_SAMPLE_ALERTS_INDEX_REPLICAS = 0;

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

// Default number of shards and remplicas for indices
export const WAZUH_INDEX_SHARDS = 2;
export const WAZUH_INDEX_REPLICAS = 0;

// Reserved ids for Users/Role mapping
export const WAZUH_API_RESERVED_ID_LOWER_THAN = 100;


// Default App Config
export const WAZUH_DEFAULT_APP_CONFIG = {
  pattern: WAZUH_ALERTS_PATTERN,
  'checks.pattern': true,
  'checks.template': true,
  'checks.api': true,
  'checks.setup': true,
  'checks.fields': true,
  'checks.metaFields': true,
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