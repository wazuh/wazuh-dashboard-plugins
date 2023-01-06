/*
 * Wazuh app - Tab name equivalence
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { i18n } from '@kbn/i18n';

export const TabNames = {
  welcome: i18n.translate('wazuh.utils.welcome', { defaultMessage: 'Welcome' }),
  general: i18n.translate('wazuh.utils.securityEvents', {
    defaultMessage: 'Security events',
  }),
  fim: i18n.translate('wazuh.utils.integrityMonitoring', {
    defaultMessage: 'Integrity monitoring',
  }),
  pm: i18n.translate('wazuh.utils.policyMonitoring', {
    defaultMessage: 'Policy monitoring',
  }),
  vuls: i18n.translate('wazuh.utils.vuls', { defaultMessage: 'Vulnerabilities' }),
  oscap: i18n.translate('wazuh.utils.oscap', { defaultMessage: 'OpenSCAP' }),
  audit: i18n.translate('wazuh.utils.systemAuditing', {
    defaultMessage: 'System auditing',
  }),
  ciscat: i18n.translate('wazuh.utils.ciscat', { defaultMessage: 'CIS-CAT' }),
  pci: i18n.translate('wazuh.utils.pciDss', { defaultMessage: 'PCI DSS' }),
  gdpr: i18n.translate('wazuh.utils.gdpr', { defaultMessage: 'GDPR' }),
  hipaa: i18n.translate('wazuh.utils.hipaa', { defaultMessage: 'HIPAA' }),
  nist: i18n.translate('wazuh.utils.nist', { defaultMessage: 'NIST 800-53' }),
  tsc: i18n.translate('wazuh.utils.tsc', { defaultMessage: 'TSC' }),
  aws: i18n.translate('wazuh.utils.aws', { defaultMessage: 'Amazon AWS' }),
  gcp: i18n.translate('wazuh.utils.gcp', { defaultMessage: 'Google Cloud Platform' }),
  virustotal: i18n.translate('wazuh.utils.virusTotal', {
    defaultMessage: 'VirusTotal',
  }),
  configuration: i18n.translate('wazuh.utils.configuration', {
    defaultMessage: 'Configuration',
  }),
  syscollector: i18n.translate('wazuh.utils.sysCollector', {
    defaultMessage: 'Inventory data',
  }),
  stats: i18n.translate('wazuh.utils.stats', { defaultMessage: 'Stats' }),
  api: i18n.translate('wazuh.utils.api', { defaultMessage: 'API configuration' }),
  extensions: i18n.translate('wazuh.utils.extensions', {
    defaultMessage: 'Extensions',
  }),
  pattern: i18n.translate('wazuh.utils.pattern', { defaultMessage: 'Index pattern' }),
  about: i18n.translate('wazuh.utils.about', { defaultMessage: 'About' }),
  status: i18n.translate('wazuh.utils.status', { defaultMessage: 'Status' }),
  ruleset: i18n.translate('wazuh.utils.ruleset', { defaultMessage: 'Ruleset' }),
  rules: i18n.translate('wazuh.utils.rules', { defaultMessage: 'Rules' }),
  decoders: i18n.translate('wazuh.utils.decoders', { defaultMessage: 'Decoders' }),
  logs: i18n.translate('wazuh.utils.logs', { defaultMessage: 'Logs' }),
  groups: i18n.translate('wazuh.utils.groups', { defaultMessage: 'Groups' }),
  monitoring: i18n.translate('wazuh.utils.cluster', { defaultMessage: 'Cluster' }),
  reporting: i18n.translate('wazuh.utils.reporting', { defaultMessage: 'Reporting' }),
  'registration-service': i18n.translate('wazuh.utils.registerationService', {
    defaultMessage: 'Registration service',
  }),
  cluster: i18n.translate('wazuh.utils.cluster', { defaultMessage: 'Cluster' }),
  'wazuh-modules': i18n.translate('wazuh.utils.wazuhModule', {
    defaultMessage: 'Wazuh modules',
  }),
  'active-response': i18n.translate('wazuh.utils.activeResponse', {
    defaultMessage: 'Active response',
  }),
  integrations: i18n.translate('wazuh.utils.integrations', {
    defaultMessage: 'Integrations',
  }),
  'database-output': i18n.translate('wazuh.utils.databaseOutput', {
    defaultMessage: 'Database   output',
  }),
  alerts: i18n.translate('wazuh.utils.alerts', { defaultMessage: 'Alerts' }),
  'global-configuration': i18n.translate('wazuh.utils.globalConfiguration', {
    defaultMessage: 'Global configuration',
  }),
  'log-settings': i18n.translate('wazuh.utils.logSetting', {
    defaultMessage: 'Log settings',
  }),
  'integrity-monitoring': i18n.translate('wazuh.utils.integrityMonitoring', {
    defaultMessage: 'Integrity monitoring',
  }),
  'policy-monitoring': i18n.translate('wazuh.utils.policyMonitoring', {
    defaultMessage: 'Policy monitoring',
  }),
  'log-collection': i18n.translate('wazuh.utils.logCollection', {
    defaultMessage: 'Log collection',
  }),
  agentless: i18n.translate('wazuh.utils.agentless', { defaultMessage: 'Agentless' }),
  inventory: i18n.translate('wazuh.utils.inventory', { defaultMessage: 'Inventory' }),
  osquery: i18n.translate('wazuh.utils.osquery', { defaultMessage: 'Osquery' }),
  mitre: i18n.translate('wazuh.utils.mitreAttack', { defaultMessage: 'MITRE ATT&CK' }),
  'open-scap': i18n.translate('wazuh.utils.openscap', { defaultMessage: 'OpenSCAP' }),
  'cis-cat': i18n.translate('wazuh.utils.ciscat', { defaultMessage: 'CIS-CAT' }),
  'vulnerability-detector': i18n.translate('wazuh.utils.vuls', {
    defaultMessage: 'Vulnerabilities',
  }),
  'aws-s3': i18n.translate('wazuh.utils.awsS3', { defaultMessage: 'Amazon S3' }),
  command: i18n.translate('wazuh.utils.command', { defaultMessage: 'Wazuh commands' }),
  client: i18n.translate('wazuh.utils.clientConfiguration', {
    defaultMessage: 'Client configuration',
  }),
  edition: i18n.translate('wazuh.utils.editNodeConfiguration', {
    defaultMessage: 'Edit node configuration',
  }),
  'client-buffer': i18n.translate('wazuh.utils.clientBuffer', {
    defaultMessage: 'Anti-flooding settings',
  }),
  sca: i18n.translate('wazuh.utils.sca', { defaultMessage: 'SCA' }),
  'docker-listener': i18n.translate('wazuh.utils.docker', { defaultMessage: 'Docker listener' }),
  docker: i18n.translate('wazuh.utils.docker', { defaultMessage: 'Docker listener' }),
};
