/*
 * Wazuh app - Resolve function to parse configuration file
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import {
  WAZUH_ALERTS_PATTERN,
  WAZUH_INDEX_REPLICAS,
  WAZUH_INDEX_SHARDS,
  WAZUH_MONITORING_PATTERN,
  WAZUH_SAMPLE_ALERT_PREFIX
} from "../../../util/constants";

export async function getWzConfig($q, genericReq, wazuhConfig) {
  // Remember to keep this values equal to default wazuh.yml values
  const defaultConfig = {
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
    'enrollment.dns': '',
    'enrollment.password': '',
  };

  try {
    const config = await genericReq.request('GET', '/utils/configuration', {});

    if (!config || !config.data || !config.data.data)
      throw new Error('No config available');

    const ymlContent = config.data.data;

    if (
      typeof ymlContent === 'object' &&
      (Object.keys(ymlContent) || []).length
    ) {
      // Replace default values with custom values from wazuh.yml file
      for (const key in ymlContent) {
        defaultConfig[key] = ymlContent[key];
      }
    }

    wazuhConfig.setConfig(defaultConfig);
  } catch (error) {
    wazuhConfig.setConfig(defaultConfig);
    console.log('Error parsing wazuh.yml, using default values.'); // eslint-disable-line
    console.log(error.message || error); // eslint-disable-line
  }

  return $q.resolve();
}
