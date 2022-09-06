/*
 * Wazuh app - App configuration file
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
  WAZUH_DEFAULT_APP_CONFIG,
  WAZUH_MONITORING_DEFAULT_CREATION,
  WAZUH_MONITORING_DEFAULT_ENABLED,
  WAZUH_MONITORING_DEFAULT_FREQUENCY,
  WAZUH_MONITORING_DEFAULT_INDICES_REPLICAS,
  WAZUH_MONITORING_DEFAULT_INDICES_SHARDS,
  WAZUH_MONITORING_PATTERN,
  WAZUH_SAMPLE_ALERT_PREFIX,
  WAZUH_STATISTICS_DEFAULT_CREATION,
  WAZUH_STATISTICS_DEFAULT_CRON_FREQ,
  WAZUH_STATISTICS_DEFAULT_INDICES_REPLICAS,
  WAZUH_STATISTICS_DEFAULT_INDICES_SHARDS,
  WAZUH_STATISTICS_DEFAULT_NAME,
  WAZUH_STATISTICS_DEFAULT_PREFIX,
  WAZUH_STATISTICS_DEFAULT_STATUS,
} from '../../common/constants';
import { webDocumentationLink } from '../../common/services/web_documentation';
import { configEquivalences } from '../../common/config-equivalences';

/**
 * Given a string, this function builds a multine string, each line about 70
 * characters long, splitted at the closest whitespace character to that lentgh.
 *
 * This function is used to transform the settings description stored in the
 * configEquivalences map into a multiline string to be used as the setting
 * documentation.
 *
 * The # character is also appended to the beginning of each line.
 *
 * @param text
 * @returns multine string
 */
function splitDescription(text: string = ''): string {
  const lines = text.match(/.{1,80}(?=\s|$)/g) || [];
  return lines.map((z) => '# ' + z.trim()).join('\n');
}

export const initialWazuhConfig: string = `---
#
# Wazuh app - App configuration file
# Copyright (C) 2015-2022 Wazuh, Inc.
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# Find more information about this on the LICENSE file.
#
# ======================== Wazuh app configuration file ========================
#
# Please check the documentation for more information about configuration options:
# ${webDocumentationLink('user-manual/wazuh-dashboard/config-file.html')}
#
# Also, you can check our repository:
# https://github.com/wazuh/wazuh-kibana-app
#
# ---------------------------- Unauthorized roles ------------------------------
#
# Disable Wazuh for the Elasticsearch / OpenSearch roles defined here.
# disabled_roles:
#   - wazuh_disabled
#
# ------------------------------- Index patterns -------------------------------
#
${splitDescription(configEquivalences.pattern)}
# pattern: ${WAZUH_ALERTS_PATTERN}
#
# ----------------------------------- Checks -----------------------------------
#
# Define which checks will be executed by the App's HealthCheck.
# Allowed values are: true, false
#
${splitDescription(configEquivalences['checks.pattern'])}
# checks.pattern: ${WAZUH_DEFAULT_APP_CONFIG['checks.pattern']}
#
${splitDescription(configEquivalences['checks.template'])}
# checks.template: ${WAZUH_DEFAULT_APP_CONFIG['checks.template']}
#
${splitDescription(configEquivalences['checks.api'])}
# checks.api: ${WAZUH_DEFAULT_APP_CONFIG['checks.api']}
#
${splitDescription(configEquivalences['checks.setup'])}
# checks.setup: ${WAZUH_DEFAULT_APP_CONFIG['checks.setup']}
#
${splitDescription(configEquivalences['checks.fields'])}
# checks.fields: ${WAZUH_DEFAULT_APP_CONFIG['checks.fields']}
#
${splitDescription(configEquivalences['checks.metaFields'])}
# checks.metaFields: ${WAZUH_DEFAULT_APP_CONFIG['checks.metaFields']}
#
${splitDescription(configEquivalences['checks.timeFilter'])}
# checks.timeFilter: ${WAZUH_DEFAULT_APP_CONFIG['checks.timeFilter']}
#
${splitDescription(configEquivalences['checks.maxBuckets'])}
# checks.maxBuckets: ${WAZUH_DEFAULT_APP_CONFIG['checks.maxBuckets']}
#
# --------------------------------- Extensions ---------------------------------
#
# Define the initial state of the extensions (enabled / disabled) for recently
# added hosts. The extensions can be enabled or disabled anytime using the UI.
# Allowed values are: true, false
#
${splitDescription(configEquivalences['extensions.pci'])}
# extensions.pci: ${WAZUH_DEFAULT_APP_CONFIG['extensions.pci']}
#
${splitDescription(configEquivalences['extensions.gdpr'])}
# extensions.gdpr: ${WAZUH_DEFAULT_APP_CONFIG['extensions.gdpr']}
#
${splitDescription(configEquivalences['extensions.hipaa'])}
# extensions.hipaa: ${WAZUH_DEFAULT_APP_CONFIG['extensions.hipaa']}
#
${splitDescription(configEquivalences['extensions.nist'])}
# extensions.nist: ${WAZUH_DEFAULT_APP_CONFIG['extensions.nist']}
#
${splitDescription(configEquivalences['extensions.tsc'])}
# extensions.tsc: ${WAZUH_DEFAULT_APP_CONFIG['extensions.tsc']}
#
${splitDescription(configEquivalences['extensions.audit'])}
# extensions.audit: ${WAZUH_DEFAULT_APP_CONFIG['extensions.audit']}
#
${splitDescription(configEquivalences['extensions.oscap'])}
# extensions.oscap: ${WAZUH_DEFAULT_APP_CONFIG['extensions.oscap']}
#
${splitDescription(configEquivalences['extensions.ciscat'])}
# extensions.ciscat: ${WAZUH_DEFAULT_APP_CONFIG['extensions.ciscat']}
#
${splitDescription(configEquivalences['extensions.aws'])}
# extensions.aws: ${WAZUH_DEFAULT_APP_CONFIG['extensions.aws']}
#
${splitDescription(configEquivalences['extensions.gcp'])}
# extensions.gcp: ${WAZUH_DEFAULT_APP_CONFIG['extensions.gcp']}
#
${splitDescription(configEquivalences['extensions.virustotal'])}
# extensions.virustotal: ${WAZUH_DEFAULT_APP_CONFIG['extensions.virustotal']}
#
${splitDescription(configEquivalences['extensions.osquery'])}
# extensions.osquery: ${WAZUH_DEFAULT_APP_CONFIG['extensions.osquery']}
#
${splitDescription(configEquivalences['extensions.docker'])}
# extensions.docker: ${WAZUH_DEFAULT_APP_CONFIG['extensions.docker']}
#
# ------------------------------- Timeout --------------------------------------
#
${splitDescription(configEquivalences.timeout)}
# timeout: ${WAZUH_DEFAULT_APP_CONFIG.timeout}
#
# --------------------------- Index pattern selector ---------------------------
#
${splitDescription(configEquivalences['ip.selector'])}
# ip.selector: ${WAZUH_DEFAULT_APP_CONFIG['ip.selector']}
#
${splitDescription(configEquivalences['ip.ignore'])}
# ip.ignore: ${WAZUH_DEFAULT_APP_CONFIG['ip.ignore']}
#
# ------------------------------ Monitoring ------------------------------------
#
${splitDescription(configEquivalences['wazuh.monitoring.enabled'])}
# wazuh.monitoring.enabled: ${WAZUH_MONITORING_DEFAULT_ENABLED}
#
${splitDescription(configEquivalences['wazuh.monitoring.frequency'])}
# wazuh.monitoring.frequency: ${WAZUH_MONITORING_DEFAULT_FREQUENCY}
#
${splitDescription(configEquivalences['wazuh.monitoring.shards'])}
# wazuh.monitoring.shards: ${WAZUH_MONITORING_DEFAULT_INDICES_SHARDS}
#
${splitDescription(configEquivalences['wazuh.monitoring.replicas'])}
# wazuh.monitoring.replicas: ${WAZUH_MONITORING_DEFAULT_INDICES_REPLICAS}
#
${splitDescription(configEquivalences['wazuh.monitoring.creation'])}
# Allowed values are: h (hourly), d (daily), w (weekly), m (monthly)
# wazuh.monitoring.creation: ${WAZUH_MONITORING_DEFAULT_CREATION}
#
${splitDescription(configEquivalences['wazuh.monitoring.pattern'])}
# wazuh.monitoring.pattern: ${WAZUH_MONITORING_PATTERN}
#
# --------------------------------- Sample data --------------------------------
#
${splitDescription(configEquivalences['alerts.sample.prefix'])}
# alerts.sample.prefix: ${WAZUH_SAMPLE_ALERT_PREFIX}
#
# ------------------------------ Background tasks ------------------------------
#
${splitDescription(configEquivalences['cron.prefix'])}
# cron.prefix: ${WAZUH_STATISTICS_DEFAULT_PREFIX}
#
# ------------------------------ Wazuh Statistics ------------------------------
#
${splitDescription(configEquivalences['cron.statistics.status'])}
# cron.statistics.status: ${WAZUH_STATISTICS_DEFAULT_STATUS}
#
${splitDescription(configEquivalences['cron.statistics.apis'])}
# cron.statistics.apis: ${WAZUH_DEFAULT_APP_CONFIG['cron.statistics.apis']}
#
${splitDescription(configEquivalences['cron.statistics.interval'])}
# cron.statistics.interval: ${WAZUH_STATISTICS_DEFAULT_CRON_FREQ}
#
${splitDescription(configEquivalences['cron.statistics.index.name'])}
# cron.statistics.index.name: ${WAZUH_STATISTICS_DEFAULT_NAME}
#
${splitDescription(configEquivalences['cron.statistics.index.creation'])}
# cron.statistics.index.creation: ${WAZUH_STATISTICS_DEFAULT_CREATION}
#
${splitDescription(configEquivalences['cron.statistics.index.shards'])}
# cron.statistics.shards: ${WAZUH_STATISTICS_DEFAULT_INDICES_SHARDS}
#
${splitDescription(configEquivalences['cron.statistics.index.replicas'])}
# cron.statistics.replicas: ${WAZUH_STATISTICS_DEFAULT_INDICES_REPLICAS}
#
# ------------------------------ Logo customization ----------------------------
#
${splitDescription(configEquivalences['customization.logo.app'])}
# customization.logo.app: ${WAZUH_DEFAULT_APP_CONFIG['customization.logo.app']}
#
${splitDescription(configEquivalences['customization.logo.sidebar'])}
# customization.logo.sidebar: ${WAZUH_DEFAULT_APP_CONFIG['customization.logo.sidebar']}
#
${splitDescription(configEquivalences['customization.logo.healthcheck'])}
# customization.logo.healthcheck: ${WAZUH_DEFAULT_APP_CONFIG['customization.logo.healthcheck']}
#
${splitDescription(configEquivalences['customization.logo.reports'])}
# customization.logo.reports: ${WAZUH_DEFAULT_APP_CONFIG['customization.logo.reports']}
#
# ---------------------------- Hide manager alerts -----------------------------
#
${splitDescription(configEquivalences.hideManagerAlerts)}
# hideManagerAlerts: ${WAZUH_DEFAULT_APP_CONFIG.hideManagerAlerts}
#
# ------------------------------- App logging level ----------------------------
#
${splitDescription(configEquivalences['logs.level'])}
# Allowed values are: info, debug
# logs.level: ${WAZUH_DEFAULT_APP_CONFIG['logs.level']}
#
# ------------------------------- Agent enrollment -----------------------------
#
${splitDescription(configEquivalences['enrollment.dns'])}
# enrollment.dns: ${WAZUH_DEFAULT_APP_CONFIG['enrollment.dns']}
#
${splitDescription(configEquivalences['enrollment.password'])}
# enrollment.password: ${WAZUH_DEFAULT_APP_CONFIG['enrollment.password']}
#
#-------------------------------- Wazuh hosts ----------------------------------
#
# The following configuration is the default structure to define a host.
#
# hosts:
#   # Host ID / name,
#   - env-1:
#       # Host URL
#       url: https://env-1.example
#       # Host / API port
#       port: 55000
#       # Host / API username
#       username: wazuh-wui
#       # Host / API password
#       password: wazuh-wui
#       # Use RBAC or not. If set to true, the username must be "wazuh-wui".
#       run_as: true
#   - env-2:
#       url: https://env-2.example
#       port: 55000
#       username: wazuh-wui
#       password: wazuh-wui
#       run_as: true

hosts:
  - default:
      url: https://localhost
      port: 55000
      username: wazuh-wui
      password: wazuh-wui
      run_as: false
`;
