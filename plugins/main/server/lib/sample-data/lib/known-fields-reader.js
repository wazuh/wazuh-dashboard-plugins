/**
 * Known Fields Reader - Utility to read and process known fields JSON files
 *
 * This module provides utilities to read known fields definitions and generate
 * appropriate sample data based on field types and constraints.
 */

const fs = require('fs');
const path = require('path');
const random = require('./random');

/**
 * Load known fields from JSON file
 * @param {string} datasetType - The dataset type (e.g., 'states-inventory-groups')
 * @returns {Array} Array of known field definitions
 */
function loadKnownFields(datasetType) {
  try {
    // In production, compiled code is in target/public
    // In development, code is in server/lib/sample-data/lib
    // We need to find the known-fields directory relative to the plugin root

    // Try to find the plugin root by going up from __dirname
    let knownFieldsPath;

    // Development path: server/lib/sample-data/lib -> ../../../../public/utils/known-fields
    const devPath = path.join(
      __dirname,
      '../../../../public/utils/known-fields',
      `${datasetType}.json`,
    );

    // Production path: might be in target/public or similar
    // Try development path first
    if (fs.existsSync(devPath)) {
      knownFieldsPath = devPath;
    } else {
      // Fallback: try to find from plugin root
      // This handles production builds where structure might be different
      const pluginRoot = path.resolve(__dirname, '../../../..');
      knownFieldsPath = path.join(
        pluginRoot,
        'public/utils/known-fields',
        `${datasetType}.json`,
      );
    }

    const knownFieldsFile = fs.readFileSync(knownFieldsPath, 'utf8');
    const knownFields = JSON.parse(knownFieldsFile);

    return knownFields;
  } catch (error) {
    console.warn(
      `Warning: Could not load known fields for ${datasetType}:`,
      error.message,
    );
    return [];
  }
}

/**
 * Generate sample value based on field type and ES type
 * @param {Object} fieldDef - Field definition from known fields
 * @returns {*} Generated sample value
 */
function generateValueForField(fieldDef) {
  const { name, type, esTypes } = fieldDef;

  // Handle special system fields
  if (name.startsWith('_')) {
    return null; // Skip system fields like _id, _index, etc.
  }

  // Generate based on ES type
  const esType = esTypes?.[0] || type;

  switch (esType) {
    case 'keyword':
      return generateKeywordValue(name);

    case 'text':
    case 'match_only_text':
      return generateTextValue(name);

    case 'date':
      return new Date(random.date()).toISOString();

    case 'boolean':
      return random.choice([true, false]);

    case 'long':
    case 'integer':
      return random.int(0, 999999);

    case 'unsigned_long':
      return random.int(0, 999999);

    case 'ip':
      return generateIPAddress();

    case 'number':
      return random.float(0, 1000);

    default:
      return generateDefaultValue(name, type);
  }
}

/**
 * Generate keyword value based on field name patterns
 * @param {string} fieldName - Name of the field
 * @returns {string} Generated keyword value
 */
function generateKeywordValue(fieldName) {
  // Agent fields
  if (fieldName.includes('agent.name')) {
    return random.choice([
      'agent-001',
      'server-web-01',
      'db-server-02',
      'workstation-user01',
    ]);
  }

  if (fieldName.includes('agent.id')) {
    return random.int(1000, 9999).toString();
  }

  if (fieldName.includes('agent.version')) {
    return random.choice(['4.14.0', '4.13.1', '4.12.0']);
  }

  if (fieldName.includes('agent.host.architecture')) {
    return random.choice(['x86_64', 'arm64', 'i386']);
  }

  // Group fields
  if (fieldName.includes('group.name')) {
    return random.choice([
      'Administrators',
      'Users',
      'root',
      'wheel',
      'sudo',
      'docker',
      'Administrateurs',
      'Utilisateurs',
      'IIS_IUSRS',
      'daemon',
    ]);
  }

  if (fieldName.includes('group.uuid')) {
    return generateUUID();
  }

  if (fieldName.includes('group.users')) {
    return random.choice([
      'admin,root,superuser',
      'user1,user2,guest',
      'john.doe,jane.smith',
    ]);
  }

  // Wazuh fields
  if (fieldName.includes('wazuh.cluster.name')) {
    return random.choice(['wazuh-cluster', 'main-cluster', 'prod-cluster']);
  }

  if (fieldName.includes('wazuh.cluster.node')) {
    return random.choice(['master-node', 'worker-node-01', 'worker-node-02']);
  }

  if (fieldName.includes('wazuh.schema.version')) {
    return '1.0.0';
  }

  // Default keyword generation
  return `sample-${fieldName.split('.').pop()}-${random.int(1, 100)}`;
}

/**
 * Generate text value based on field name patterns
 * @param {string} fieldName - Name of the field
 * @returns {string} Generated text value
 */
function generateTextValue(fieldName) {
  if (fieldName.includes('description')) {
    return random.choice([
      "Les membres du groupe Administrateurs disposent d'un accès complet et illimité à l'ordinateur et au domaine",
      "Les utilisateurs ne peuvent pas effectuer de modifications accidentelles ou intentionnelles à l'échelle du système",
      'Groupe intégré utilisé par les services Internet (IIS)',
      'Les membres de ce groupe ont le droit de se connecter à distance à cet ordinateur',
      'Les membres de ce groupe peuvent sauvegarder et restaurer des fichiers sur cet ordinateur',
    ]);
  }

  return `Sample text for ${fieldName}`;
}

/**
 * Generate IP address
 * @returns {string} Random IP address
 */
function generateIPAddress() {
  return `${random.int(1, 254)}.${random.int(1, 254)}.${random.int(
    1,
    254,
  )}.${random.int(1, 254)}`;
}

/**
 * Generate UUID-like string
 * @returns {string} UUID-like string
 */
function generateUUID() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += random.choice(chars.split(''));
  }
  result += random.int(100000000, 999999999);
  result += random.int(1000, 9999);
  return result;
}

/**
 * Generate default value for unknown types
 * @param {string} fieldName - Name of the field
 * @param {string} type - Field type
 * @returns {*} Generated default value
 */
function generateDefaultValue(fieldName, type) {
  console.warn(
    `Unknown field type for ${fieldName}: ${type}, using string default`,
  );
  return `default-${fieldName.split('.').pop()}`;
}

/**
 * Build nested object from dot notation field names
 * @param {Array} fields - Array of field definitions
 * @param {Object} customGenerators - Custom value generators for specific fields
 * @returns {Object} Nested object with generated values
 */
function buildNestedObject(fields, customGenerators = {}) {
  const result = {};

  fields.forEach(fieldDef => {
    const { name } = fieldDef;

    // Skip system fields
    if (name.startsWith('_')) {
      return;
    }

    // Use custom generator if provided
    if (customGenerators[name]) {
      setNestedValue(result, name, customGenerators[name]());
      return;
    }

    // Generate value based on field definition
    const value = generateValueForField(fieldDef);
    if (value !== null) {
      setNestedValue(result, name, value);
    }
  });

  return result;
}

/**
 * Set nested value in object using dot notation
 * @param {Object} obj - Target object
 * @param {string} path - Dot notation path
 * @param {*} value - Value to set
 */
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Get field definitions for a specific namespace (e.g., 'group', 'agent')
 * @param {Array} fields - Array of field definitions
 * @param {string} namespace - Namespace to filter by
 * @returns {Array} Filtered field definitions
 */
function getFieldsByNamespace(fields, namespace) {
  return fields.filter(field => field.name.startsWith(`${namespace}.`));
}

module.exports = {
  loadKnownFields,
  generateValueForField,
  buildNestedObject,
  getFieldsByNamespace,
  setNestedValue,
};
