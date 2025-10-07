/**
 * Known fields loader - loads known fields from generated JSON files
 *
 * This module loads the known fields that are automatically generated
 * from Wazuh index templates, ensuring they're always in sync with
 * the official field definitions.
 */

// Import generated known fields JSON files from common directory
import alertsFields from '../../../common/known-fields/alerts.json';
import vulnerabilitiesFields from '../../../common/known-fields/states-vulnerabilities.json';
import fimFilesFields from '../../../common/known-fields/states-fim-files.json';
import fimRegistriesFields from '../../../common/known-fields/states-fim-registries.json';
import inventorySystemFields from '../../../common/known-fields/states-inventory-system.json';
import inventoryHardwareFields from '../../../common/known-fields/states-inventory-hardware.json';
import inventoryNetworksFields from '../../../common/known-fields/states-inventory-networks.json';
import inventoryPackagesFields from '../../../common/known-fields/states-inventory-packages.json';
import inventoryPortsFields from '../../../common/known-fields/states-inventory-ports.json';
import inventoryProcessesFields from '../../../common/known-fields/states-inventory-processes.json';
import inventoryProtocolsFields from '../../../common/known-fields/states-inventory-protocols.json';
import inventoryUsersFields from '../../../common/known-fields/states-inventory-users.json';
import inventoryGroupsFields from '../../../common/known-fields/states-inventory-groups.json';
import inventoryServicesFields from '../../../common/known-fields/states-inventory-services.json';
import inventoryInterfacesFields from '../../../common/known-fields/states-inventory-interfaces.json';
import inventoryHotfixesFields from '../../../common/known-fields/states-inventory-hotfixes.json';
import inventoryBrowserExtensionsFields from '../../../common/known-fields/states-inventory-browser-extensions.json';
import monitoringFields from '../../../common/known-fields/monitoring.json';
import statisticsFields from '../../../common/known-fields/statistics.json';

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
 * @param {string} pattern - Full index pattern (e.g., 'wazuh-states-vulnerabilities-*')
 * @returns {string|null} The pattern type or null if not a states pattern
 */
export function extractPatternType(pattern) {
  const match = pattern.match(/wazuh-states-(.+?)-\*/);
  return match ? match[1] : null;
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
