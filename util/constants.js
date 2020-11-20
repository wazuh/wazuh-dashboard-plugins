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