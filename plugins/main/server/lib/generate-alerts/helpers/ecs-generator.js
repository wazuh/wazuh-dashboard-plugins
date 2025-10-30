/*
 * Wazuh app - ECS Field Generator for Wazuh 5.0
 * Copyright (C) 2015-2024 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

const { Random } = require('./random');

/**
 * ECS Event Categories
 */
const EVENT_CATEGORIES = {
  AUTHENTICATION: 'authentication',
  CONFIGURATION: 'configuration',
  DATABASE: 'database',
  DRIVER: 'driver',
  EMAIL: 'email',
  FILE: 'file',
  HOST: 'host',
  IAM: 'iam',
  INTRUSION_DETECTION: 'intrusion_detection',
  MALWARE: 'malware',
  NETWORK: 'network',
  PACKAGE: 'package',
  PROCESS: 'process',
  REGISTRY: 'registry',
  SESSION: 'session',
  THREAT: 'threat',
  VULNERABILITY: 'vulnerability',
  WEB: 'web',
};

/**
 * ECS Event Types
 */
const EVENT_TYPES = {
  ACCESS: 'access',
  ADMIN: 'admin',
  ALLOWED: 'allowed',
  CHANGE: 'change',
  CONNECTION: 'connection',
  CREATION: 'creation',
  DELETION: 'deletion',
  DENIED: 'denied',
  END: 'end',
  ERROR: 'error',
  GROUP: 'group',
  INFO: 'info',
  INSTALLATION: 'installation',
  PROTOCOL: 'protocol',
  START: 'start',
  USER: 'user',
};

/**
 * ECS Event Kinds
 */
const EVENT_KINDS = {
  ALERT: 'alert',
  ENRICHMENT: 'enrichment',
  EVENT: 'event',
  METRIC: 'metric',
  STATE: 'state',
  PIPELINE_ERROR: 'pipeline_error',
  SIGNAL: 'signal',
};

/**
 * ECS Event Outcomes
 */
const EVENT_OUTCOMES = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  UNKNOWN: 'unknown',
};

/**
 * Generate ECS event field
 * @param {Object} options - Event options
 * @param {string} options.kind - Event kind (alert, event, metric, state)
 * @param {string[]} options.category - Event category array
 * @param {string[]} options.type - Event type array
 * @param {string} options.action - Specific action taken
 * @param {string} options.outcome - Outcome of the event (success, failure, unknown)
 * @param {number} options.severity - Severity level (0-100)
 * @param {string} options.module - Module that generated the event
 * @param {Date} options.created - When the event was created
 * @returns {Object} ECS event object
 */
function generateEvent(options = {}) {
  const {
    kind = EVENT_KINDS.ALERT,
    category = [],
    type = [],
    action = '',
    outcome = EVENT_OUTCOMES.UNKNOWN,
    severity = null,
    module = '',
    created = new Date(),
  } = options;

  const event = {
    kind,
    category: Array.isArray(category) ? category : [category],
    type: Array.isArray(type) ? type : [type],
    dataset: 'wazuh.alerts',
  };

  if (action) {
    event.action = action;
  }

  if (outcome) {
    event.outcome = outcome;
  }

  if (severity !== null) {
    event.severity = severity;
  }

  if (module) {
    event.module = module;
  }

  if (created) {
    event.created = created.toISOString();
  }

  return event;
}

/**
 * Generate ECS log field
 * @param {Object} options - Log options
 * @param {string} options.level - Log level (debug, info, warning, error, critical)
 * @param {string} options.filePath - File path where log originated
 * @param {string} options.originFile - Origin file name
 * @returns {Object} ECS log object
 */
function generateLog(options = {}) {
  const { level = 'info', filePath = '', originFile = '' } = options;

  const log = {};

  if (level) {
    log.level = level;
  }

  if (filePath) {
    log.file = { path: filePath };
  }

  if (originFile) {
    log.origin = { file: { name: originFile } };
  }

  return log;
}

/**
 * Generate human-readable message from alert data
 * @param {Object} options - Message options
 * @param {string} options.action - Action description
 * @param {string} options.user - User involved
 * @param {string} options.sourceIp - Source IP
 * @param {string} options.fileName - File name
 * @param {string} options.processName - Process name
 * @param {string} options.customMessage - Custom message template
 * @returns {string} Human-readable message
 */
function generateMessage(options = {}) {
  const {
    action = '',
    user = '',
    sourceIp = '',
    fileName = '',
    processName = '',
    customMessage = '',
  } = options;

  if (customMessage) {
    return customMessage;
  }

  let message = action;

  if (user) {
    message += ` by user ${user}`;
  }

  if (sourceIp) {
    message += ` from ${sourceIp}`;
  }

  if (fileName) {
    message += ` on file ${fileName}`;
  }

  if (processName) {
    message += ` in process ${processName}`;
  }

  return message || 'Security event detected';
}

/**
 * Generate ECS host field with enhanced OS information
 * @param {Object} hostData - Basic host data
 * @returns {Object} ECS-compliant host object
 */
function generateHost(hostData = {}) {
  const osMapping = {
    RHEL7: {
      family: 'linux',
      name: 'Red Hat Enterprise Linux',
      platform: 'rhel',
      type: 'linux',
      version: '7.9',
      full: 'Red Hat Enterprise Linux Server 7.9',
      kernel: '3.10.0-1160.el7.x86_64',
    },
    Amazon: {
      family: 'linux',
      name: 'Amazon Linux',
      platform: 'amzn',
      type: 'linux',
      version: '2',
      full: 'Amazon Linux 2',
      kernel: '4.14.256-197.484.amzn2.x86_64',
    },
    Ubuntu: {
      family: 'linux',
      name: 'Ubuntu',
      platform: 'ubuntu',
      type: 'linux',
      version: '20.04',
      full: 'Ubuntu 20.04.3 LTS',
      kernel: '5.4.0-91-generic',
    },
    Centos: {
      family: 'linux',
      name: 'CentOS Linux',
      platform: 'centos',
      type: 'linux',
      version: '7.9',
      full: 'CentOS Linux 7.9.2009',
      kernel: '3.10.0-1160.el7.x86_64',
    },
    Debian: {
      family: 'linux',
      name: 'Debian GNU/Linux',
      platform: 'debian',
      type: 'linux',
      version: '10',
      full: 'Debian GNU/Linux 10 (buster)',
      kernel: '4.19.0-18-amd64',
    },
    Windows: {
      family: 'windows',
      name: 'Windows Server',
      platform: 'windows',
      type: 'windows',
      version: '2019',
      full: 'Windows Server 2019 Datacenter',
      kernel: '10.0.17763',
    },
  };

  const agentName = hostData.name || 'RHEL7';
  const os = osMapping[agentName] || osMapping.RHEL7;

  // Generate MAC addresses
  const generateMac = () => {
    const hex = '0123456789abcdef';
    let mac = '';
    for (let i = 0; i < 6; i++) {
      mac +=
        (i > 0 ? ':' : '') +
        hex[Random.number(0, 15)] +
        hex[Random.number(0, 15)];
    }
    return mac;
  };

  // Generate multiple IPs (at least one, sometimes two)
  const ips = [hostData.ip || '10.0.0.1'];
  if (Random.probability(0.3)) {
    ips.push(`10.0.${Random.number(0, 255)}.${Random.number(1, 254)}`);
  }

  return {
    architecture: Random.arrayItem(['x86_64', 'aarch64', 'arm64']),
    hostname: hostData.name
      ? `${hostData.name.toLowerCase()}-${Random.number(1, 999)}`
      : 'server-001',
    ip: ips,
    mac: [generateMac()],
    name: hostData.name || 'server-001',
    os: os,
    type: Random.arrayItem(['server', 'workstation', 'desktop']),
  };
}

/**
 * Generate ECS-compliant user field
 * @param {Object} userData - User data
 * @returns {Object} ECS user object
 */
function generateUser(userData = {}) {
  const { name, id, domain, email, roles, groupName, groupId } = userData;

  const user = {};

  if (name) {
    user.name = name;
  }

  if (id !== undefined) {
    user.id = String(id);
  }

  if (domain) {
    user.domain = domain;
  }

  if (email) {
    user.email = email;
  }

  if (roles) {
    user.roles = Array.isArray(roles) ? roles : [roles];
  }

  if (groupName || groupId) {
    user.group = {};
    if (groupName) user.group.name = groupName;
    if (groupId !== undefined) user.group.id = String(groupId);
  }

  return user;
}

/**
 * Generate ECS-compliant source/destination field
 * @param {Object} options - Network endpoint options
 * @returns {Object} ECS source/destination object
 */
function generateNetworkEndpoint(options = {}) {
  const { ip, port, domain, geo, as } = options;

  const endpoint = {};

  if (ip) {
    endpoint.ip = ip;
  }

  if (port) {
    endpoint.port = parseInt(port, 10);
  }

  if (domain) {
    endpoint.domain = domain;
  }

  if (geo) {
    endpoint.geo = {
      country_name: geo.country_name,
      city_name: geo.city_name,
      region_name: geo.region_name,
      location: geo.location,
    };

    if (geo.country_iso_code) {
      endpoint.geo.country_iso_code = geo.country_iso_code;
    }

    if (geo.continent_code) {
      endpoint.geo.continent_code = geo.continent_code;
    }
  }

  if (as) {
    endpoint.as = {
      number: as.number,
      organization: {
        name: as.organization,
      },
    };
  }

  return endpoint;
}

module.exports = {
  EVENT_CATEGORIES,
  EVENT_TYPES,
  EVENT_KINDS,
  EVENT_OUTCOMES,
  generateEvent,
  generateLog,
  generateMessage,
  generateHost,
  generateUser,
  generateNetworkEndpoint,
};
