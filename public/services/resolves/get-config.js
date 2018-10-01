/*
 * Wazuh app - Resolve function to parse configuration file
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export async function getWzConfig($q, genericReq, errorHandler, wazuhConfig) {
  // Remember to keep this values equal to default config.yml values
  const defaultConfig = {
    pattern: 'wazuh-alerts-3.x-*',
    'checks.pattern': true,
    'checks.template': true,
    'checks.api': true,
    'checks.setup': true,
    'extensions.pci': true,
    'extensions.gdpr': true,
    'extensions.audit': true,
    'extensions.oscap': true,
    'extensions.ciscat': false,
    'extensions.aws': false,
    'extensions.virustotal': false,
    timeout: 8000,
    'wazuh.shards': 1,
    'wazuh.replicas': 1,
    'wazuh-version.shards': 1,
    'wazuh-version.replicas': 1,
    'ip.selector': true,
    'xpack.rbac.enabled': true,
    'wazuh.monitoring.enabled': true,
    'wazuh.monitoring.frequency': 3600,
    'wazuh.monitoring.shards': 5,
    'wazuh.monitoring.replicas': 1
  };

  try {
    const config = await genericReq.request(
      'GET',
      '/utils/configuration',
      {}
    );

    if (!config || !config.data || !config.data.data)
      throw new Error('No config available');

    const ymlContent = config.data.data;

    if (typeof ymlContent === 'object') {
      // Replace default values by custom values from config.yml file
      for (const key in ymlContent) {
        defaultConfig[key] = ymlContent[key];
      }
    }

    wazuhConfig.setConfig(defaultConfig);
  } catch (error) {
    wazuhConfig.setConfig(defaultConfig);
    errorHandler.handle(
      'Error parsing config.yml, using default values.',
      'Config',
      true
    );
  }

  return $q.resolve();
}
