/**
 * Known fields loader - loads known fields from generated JSON files
 *
 * This module loads the known fields that are automatically generated
 * from Wazuh index templates, ensuring they're always in sync with
 * the official field definitions.
 */

// Import generated known fields JSON files
import alertsFields from './known-fields/alerts.json';
import vulnerabilitiesFields from './known-fields/states-vulnerabilities.json';
import fimFilesFields from './known-fields/states-fim-files.json';
import fimRegistriesFields from './known-fields/states-fim-registries.json';
import inventorySystemFields from './known-fields/states-inventory-system.json';
import inventoryHardwareFields from './known-fields/states-inventory-hardware.json';
import inventoryNetworksFields from './known-fields/states-inventory-networks.json';
import inventoryPackagesFields from './known-fields/states-inventory-packages.json';
import inventoryPortsFields from './known-fields/states-inventory-ports.json';
import inventoryProcessesFields from './known-fields/states-inventory-processes.json';
import inventoryProtocolsFields from './known-fields/states-inventory-protocols.json';
import inventoryUsersFields from './known-fields/states-inventory-users.json';
import inventoryGroupsFields from './known-fields/states-inventory-groups.json';
import inventoryServicesFields from './known-fields/states-inventory-services.json';
import inventoryInterfacesFields from './known-fields/states-inventory-interfaces.json';
import inventoryHotfixesFields from './known-fields/states-inventory-hotfixes.json';
import inventoryBrowserExtensionsFields from './known-fields/states-inventory-browser-extensions.json';
import statisticsFields from './known-fields/statistics.json';

// Import monitoring fields from manually maintained file (not auto-generated)
// See: scripts/generate-known-fields.js for explanation
import { FieldsMonitoring } from './monitoring-fields';
const monitoringFields = FieldsMonitoring;

// Use generated fields as the primary source
export const KnownFields = alertsFields;

/**
 * Known fields mapping for different index types
 * Maps pattern types to their corresponding generated fields
 */
export const KnownFieldsStatesGenerated = {
  vulnerabilities: vulnerabilitiesFields,
  'fim-files': fimFilesFields,
  'fim-registries': fimRegistriesFields,
  'inventory-system': inventorySystemFields,
  'inventory-hardware': inventoryHardwareFields,
  'inventory-networks': inventoryNetworksFields,
  'inventory-packages': inventoryPackagesFields,
  'inventory-ports': inventoryPortsFields,
  'inventory-processes': inventoryProcessesFields,
  'inventory-protocols': inventoryProtocolsFields,
  'inventory-users': inventoryUsersFields,
  'inventory-groups': inventoryGroupsFields,
  'inventory-services': inventoryServicesFields,
  'inventory-interfaces': inventoryInterfacesFields,
  'inventory-hotfixes': inventoryHotfixesFields,
  'inventory-browser-extensions': inventoryBrowserExtensionsFields,
};

/**
 * Get known fields for a specific pattern type
 * @param {string} patternType - The pattern type (e.g., 'vulnerabilities', 'inventory-system')
 * @returns {Array} The known fields for the pattern type
 */
export function getKnownFieldsForPattern(patternType) {
  return KnownFieldsStatesGenerated[patternType] || null;
}

/**
 * Extracts the pattern type from a full index pattern string
 * Checks explicitly against known pattern types to avoid regex issues with hyphens
 * @param {string} pattern - Full index pattern (e.g., 'wazuh-states-vulnerabilities-*')
 * @returns {string|null} The pattern type or null if not a states pattern
 */
export function extractPatternType(pattern) {
  // Check if pattern starts with 'wazuh-states-' and ends with '-*'
  if (!pattern.startsWith('wazuh-states-') || !pattern.endsWith('-*')) {
    return null;
  }

  // Extract the middle part between 'wazuh-states-' and '-*'
  const prefix = 'wazuh-states-';
  const suffix = '-*';
  const startIndex = prefix.length;
  const endIndex = pattern.length - suffix.length;
  const extractedType = pattern.substring(startIndex, endIndex);

  // Verify it's a known pattern type
  return KnownFieldsStatesGenerated.hasOwnProperty(extractedType)
    ? extractedType
    : null;
}

/**
 * Get known fields for a states index pattern
 * @param {string} pattern - Full index pattern (e.g., 'wazuh-states-vulnerabilities-*')
 * @returns {Array|null} The known fields or null if not found
 */
export function getKnownFieldsForStatesPattern(pattern) {
  const patternType = extractPatternType(pattern);
  return patternType ? getKnownFieldsForPattern(patternType) : null;
}

/**
 * Map of index types to their corresponding known fields
 */
const INDEX_TYPE_TO_KNOWN_FIELDS = {
  'wazuh-index-type-alerts': alertsFields,
  'wazuh-index-type-monitoring': monitoringFields,
  'wazuh-index-type-statistics': statisticsFields,
  'wazuh-index-type-states-vulnerabilities': vulnerabilitiesFields,
  'wazuh-index-type-states-fim-files': fimFilesFields,
  'wazuh-index-type-states-fim-registries': fimRegistriesFields,
  'wazuh-index-type-states-inventory-system': inventorySystemFields,
  'wazuh-index-type-states-inventory-hardware': inventoryHardwareFields,
  'wazuh-index-type-states-inventory-networks': inventoryNetworksFields,
  'wazuh-index-type-states-inventory-packages': inventoryPackagesFields,
  'wazuh-index-type-states-inventory-ports': inventoryPortsFields,
  'wazuh-index-type-states-inventory-processes': inventoryProcessesFields,
  'wazuh-index-type-states-inventory-protocols': inventoryProtocolsFields,
  'wazuh-index-type-states-inventory-users': inventoryUsersFields,
  'wazuh-index-type-states-inventory-groups': inventoryGroupsFields,
  'wazuh-index-type-states-inventory-services': inventoryServicesFields,
  'wazuh-index-type-states-inventory-interfaces': inventoryInterfacesFields,
  'wazuh-index-type-states-inventory-hotfixes': inventoryHotfixesFields,
  'wazuh-index-type-states-inventory-browser-extensions':
    inventoryBrowserExtensionsFields,
};

/**
 * Get known fields by index type
 * @param {string} indexType - The index type constant (e.g., WAZUH_INDEX_TYPE_STATES_VULNERABILITIES)
 * @returns {Array|null} The known fields for the index type or null if not found
 */
export function getKnownFieldsByIndexType(indexType) {
  return INDEX_TYPE_TO_KNOWN_FIELDS[indexType] || null;
}
