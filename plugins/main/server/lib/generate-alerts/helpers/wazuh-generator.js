/*
 * Wazuh app - Wazuh-specific Field Generator
 * Copyright (C) 2015-2025 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

const { Random } = require('./random');
const { version: packageVersion } = require('../../../../package.json');

/**
 * Wazuh schema version
 */
const WAZUH_SCHEMA_VERSION = '1.7.0';

/**
 * Common Wazuh decoders
 */
const WAZUH_DECODERS = [
  'json',
  'sshd',
  'pam',
  'syslog',
  'apache-errorlog',
  'apache-accesslog',
  'web-accesslog',
  'windows_eventchannel',
  'wazuh-rootcheck',
  'sca',
  'audit',
  'fim',
  'aws-cloudtrail',
  'aws-guardduty',
  'azure',
  'gcp',
  'docker',
  'syscheck',
  'vulnerability-detector',
  'virustotal',
  'github',
  'office365',
];

/**
 * Common Wazuh rule IDs by category
 */
const WAZUH_RULE_IDS = {
  authentication: {
    success: ['5501', '5502', '5710', '5712', '60122'],
    failure: ['5503', '5551', '5503', '5716', '60204'],
    multiple_failures: ['5551', '5504', '5720', '60205'],
  },
  fim: {
    added: ['550', '554'],
    modified: ['550', '553'],
    deleted: ['553', '554'],
  },
  sca: ['19001', '19002', '19003', '19004', '19005'],
  vulnerability: ['23502', '23503', '23504', '23505'],
  aws: ['80200', '80201', '80202', '80300', '80301', '80302'],
  azure: ['87101', '87102', '87103', '87104', '87105'],
  gcp: ['65001', '65002', '65003'],
  'wazuh-rootcheck': ['510', '511', '512', '513', '514'],
  docker: ['87900', '87901', '87902'],
  virustotal: ['87101', '87102', '87103'],
  github: ['91001', '91002', '91003', '91004'],
  office: ['91550', '91551', '91552', '91553'],
  ssh: ['5710', '5711', '5712', '5716', '5720'],
  apache: ['30301', '30302', '30303', '30304', '30305'],
  web: ['31100', '31101', '31102', '31103', '31104', '31105', '31106'],
};

/**
 * Generate wazuh field
 * @param {Object} options - Wazuh field options
 * @param {string} options.clusterName - Cluster name
 * @param {string} options.clusterNode - Cluster node name
 * @param {string[]} options.decoders - Array of decoder names
 * @param {string[]} options.rules - Array of rule IDs
 * @param {string} options.schemaVersion - Schema version
 * @returns {Object} Wazuh field object
 */
function generateWazuhField(options = {}) {
  const {
    clusterName = 'wazuh-cluster',
    clusterNode = 'wazuh-cluster-node-01',
    decoders = [],
    rules = [],
    schemaVersion = WAZUH_SCHEMA_VERSION,
  } = options;

  const wazuh = {
    cluster: {
      name: clusterName,
      node: clusterNode,
    },
    schema: {
      version: schemaVersion,
    },
    integration: {},
  };

  // Ensure decoders is an array
  if (decoders && decoders.length > 0) {
    wazuh.integration.decoders = Array.isArray(decoders)
      ? decoders
      : [decoders];
  } else {
    // Default to 1-3 random decoders
    const numDecoders = Random.number(1, 3);
    wazuh.integration.decoders = [];
    for (let i = 0; i < numDecoders; i++) {
      const decoder = Random.arrayItem(WAZUH_DECODERS);
      if (!wazuh.integration.decoders.includes(decoder)) {
        wazuh.integration.decoders.push(decoder);
      }
    }
  }

  // Ensure rules is an array
  if (rules && rules.length > 0) {
    wazuh.rules = Array.isArray(rules) ? rules : [rules];
  } else {
    // Default to 1-2 random rules
    const categories = Object.keys(WAZUH_RULE_IDS);
    const category = Random.arrayItem(categories);
    const categoryRules = WAZUH_RULE_IDS[category];

    if (Array.isArray(categoryRules)) {
      wazuh.rules = [Random.arrayItem(categoryRules)];
    } else {
      const subcategories = Object.keys(categoryRules);
      const subcategory = Random.arrayItem(subcategories);
      wazuh.rules = [Random.arrayItem(categoryRules[subcategory])];
    }
  }

  return wazuh;
}

/**
 * Get decoders for a specific module
 * @param {string} module - Module name (authentication, fim, aws, etc.)
 * @returns {string[]} Array of decoder names
 */
function getDecodersForModule(module) {
  const decoderMap = {
    authentication: ['sshd', 'pam'],
    ssh: ['sshd'],
    fim: ['syscheck'],
    sca: ['sca'],
    audit: ['audit'],
    aws: ['json', 'aws-cloudtrail'],
    azure: ['json', 'azure'],
    gcp: ['json', 'gcp'],
    docker: ['json', 'docker'],
    'wazuh-rootcheck': ['wazuh-rootcheck'],
    vulnerability: ['json', 'vulnerability-detector'],
    virustotal: ['json', 'virustotal'],
    apache: ['apache-errorlog', 'apache-accesslog'],
    web: ['web-accesslog'],
    github: ['json', 'github'],
    office: ['json', 'office365'],
    windows: ['windows_eventchannel'],
    mitre: ['json', 'syslog'],
  };

  return decoderMap[module] || ['json', 'syslog'];
}

/**
 * Get rule IDs for a specific module and action
 * @param {string} module - Module name
 * @param {string} action - Action type (optional)
 * @returns {string[]} Array of rule IDs
 */
function getRulesForModule(module, action = null) {
  const rules = WAZUH_RULE_IDS[module];

  if (!rules) {
    return ['1002']; // Default generic rule
  }

  if (Array.isArray(rules)) {
    return [Random.arrayItem(rules)];
  }

  if (action && rules[action]) {
    return [Random.arrayItem(rules[action])];
  }

  // If rules is an object and no specific action, pick random subcategory
  const subcategories = Object.keys(rules);
  const subcategory = Random.arrayItem(subcategories);
  return [Random.arrayItem(rules[subcategory])];
}

/**
 * Generate agent field
 * @param {Object} agentData - Agent basic data
 * @param {Object} options - Additional options
 * @returns {Object} Agent field object
 */
function generateAgent(agentData = {}, options = {}) {
  const { generateHost } = require('./ecs-generator');

  const { groups = ['default'], version = `v${packageVersion}` } = options;

  return {
    id: agentData.id || '000',
    name: agentData.name || 'master',
    version: version,
    groups: Array.isArray(groups) ? groups : [groups],
    host: generateHost(agentData),
  };
}

/**
 * Generate rule field
 * @param {Object} options - Rule options
 * @returns {Object} Rule field object
 */
function generateRule(options = {}) {
  const {
    id,
    name = '',
    description,
    level = 3,
    firedtimes = 1,
    groups = [],
    pciDss = [],
    gdpr = [],
    hipaa = [],
    nist80053 = [],
    tsc = [],
    mitre = null,
  } = options;

  const rule = {
    id: id || `${Random.number(1, 6000)}`,
    description: description || 'Sample alert',
    level: level || Random.number(1, 15),
    groups: groups || [], // Always initialize as array
  };

  if (name) {
    rule.name = name;
  }

  if (firedtimes > 1) {
    rule.firedtimes = firedtimes;
  }

  // Regulatory compliance
  if (pciDss && pciDss.length > 0) {
    rule.pci_dss = pciDss;
  }

  if (gdpr && gdpr.length > 0) {
    rule.gdpr = gdpr;
  }

  if (hipaa && hipaa.length > 0) {
    rule.hipaa = hipaa;
  }

  if (nist80053 && nist80053.length > 0) {
    rule.nist_800_53 = nist80053;
  }

  if (tsc && tsc.length > 0) {
    rule.tsc = tsc;
  }

  // MITRE ATT&CK (keep for backward compatibility in rule, but should use threat field)
  if (mitre) {
    rule.mitre = mitre;
  }

  return rule;
}

module.exports = {
  WAZUH_SCHEMA_VERSION,
  WAZUH_DECODERS,
  WAZUH_RULE_IDS,
  generateWazuhField,
  getDecodersForModule,
  getRulesForModule,
  generateAgent,
  generateRule,
};
