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

export async function getWzConfig($q, genericReq, wazuhConfig) {
  // Remember to keep this values equal to default wazuh.yml values
  const defaultConfig = {
    pattern: 'wazuh-alerts-3.x-*',
    'checks.pattern': true,
    'checks.template': true,
    'checks.api': true,
    'checks.setup': true,
    'checks.fields': true,
    'extensions.pci': true,
    'extensions.gdpr': true,
    'extensions.hipaa': true,
    'extensions.nist': true,
    'extensions.tsc': true,
    'extensions.audit': true,
    'extensions.oscap': false,
    'extensions.ciscat': false,
    'extensions.aws': false,
    'extensions.virustotal': false,
    'extensions.osquery': false,
    'extensions.mitre': false,
    'extensions.docker': false,
    timeout: 20000,
    'api.selector': false,
    'ip.selector': true,
    'ip.ignore': [],
    'xpack.rbac.enabled': true,
    'wazuh.monitoring.enabled': true,
    'wazuh.monitoring.frequency': 900,
    'wazuh.monitoring.shards': 2,
    'wazuh.monitoring.replicas': 0,
    'wazuh.monitoring.creation': 'd',
    'wazuh.monitoring.pattern': 'wazuh-monitoring-3.x-*',
    admin: true,
    hideManagerAlerts: false,
    'logs.level': 'info'
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
