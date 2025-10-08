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
 * Unified known fields mapping for all index types
 * Uses WAZUH_INDEX_TYPE_* constant values as keys
 */
export const KnownFieldsByIndexType = {
  // Main index types
  alerts: alertsFields,
  monitoring: monitoringFields,
  statistics: statisticsFields,
  
  // States index types
  'states-vulnerabilities': vulnerabilitiesFields,
  'states-fim-files': fimFilesFields,
  'states-fim-registries': fimRegistriesFields,
  'states-inventory-system': inventorySystemFields,
  'states-inventory-hardware': inventoryHardwareFields,
  'states-inventory-networks': inventoryNetworksFields,
  'states-inventory-packages': inventoryPackagesFields,
  'states-inventory-ports': inventoryPortsFields,
  'states-inventory-processes': inventoryProcessesFields,
  'states-inventory-protocols': inventoryProtocolsFields,
  'states-inventory-users': inventoryUsersFields,
  'states-inventory-groups': inventoryGroupsFields,
  'states-inventory-services': inventoryServicesFields,
  'states-inventory-interfaces': inventoryInterfacesFields,
  'states-inventory-hotfixes': inventoryHotfixesFields,
  'states-inventory-browser-extensions': inventoryBrowserExtensionsFields,
};

// Legacy export for backwards compatibility with states patterns
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
 * Get known fields by index type
 * @param {string} indexType - The index type constant value (e.g., 'alerts', 'states-vulnerabilities')
 * @returns {Array|null} The known fields for the index type or null if not found
 */
export function getKnownFieldsByIndexType(indexType) {
  return KnownFieldsByIndexType[indexType] || null;
}
