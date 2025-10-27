/**
 * Known fields loader - loads known fields from generated JSON files
 *
 * This module loads the known fields that are automatically generated
 * from Wazuh index templates, ensuring they're always in sync with
 * the official field definitions.
 */

// Import index type constants
import {
  WAZUH_INDEX_TYPE_ALERTS,
  WAZUH_INDEX_TYPE_MONITORING,
  WAZUH_INDEX_TYPE_STATISTICS,
  WAZUH_INDEX_TYPE_STATES_VULNERABILITIES,
  WAZUH_INDEX_TYPE_STATES_FIM_FILES,
  WAZUH_INDEX_TYPE_STATES_FIM_REGISTRIES_KEYS,
  WAZUH_INDEX_TYPE_STATES_FIM_REGISTRIES_VALUES,
  WAZUH_INDEX_TYPE_STATES_INVENTORY,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_SYSTEM,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_HARDWARE,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_NETWORKS,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_PACKAGES,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_PORTS,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_PROCESSES,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_PROTOCOLS,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_USERS,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_GROUPS,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_SERVICES,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_INTERFACES,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_HOTFIXES,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_BROWSER_EXTENSIONS,
  WAZUH_INDEX_TYPE_STATES_SCA,
} from '../../common/constants';

// Import generated known fields JSON files
import alertsFields from '../../common/known-fields/alerts.json';
import vulnerabilitiesFields from '../../common/known-fields/states-vulnerabilities.json';
import fimFilesFields from '../../common/known-fields/states-fim-files.json';
import fimRegistriesKeysFields from '../../common/known-fields/states-fim-registries-keys.json';
import fimRegistriesValuesFields from '../../common/known-fields/states-fim-registries-keys.json';
import inventoryFields from '../../common/known-fields/states-inventory.json';
import inventorySystemFields from '../../common/known-fields/states-inventory-system.json';
import inventoryHardwareFields from '../../common/known-fields/states-inventory-hardware.json';
import inventoryNetworksFields from '../../common/known-fields/states-inventory-networks.json';
import inventoryPackagesFields from '../../common/known-fields/states-inventory-packages.json';
import inventoryPortsFields from '../../common/known-fields/states-inventory-ports.json';
import inventoryProcessesFields from '../../common/known-fields/states-inventory-processes.json';
import inventoryProtocolsFields from '../../common/known-fields/states-inventory-protocols.json';
import inventoryUsersFields from '../../common/known-fields/states-inventory-users.json';
import inventoryGroupsFields from '../../common/known-fields/states-inventory-groups.json';
import inventoryServicesFields from '../../common/known-fields/states-inventory-services.json';
import inventoryInterfacesFields from '../../common/known-fields/states-inventory-interfaces.json';
import inventoryHotfixesFields from '../../common/known-fields/states-inventory-hotfixes.json';
import inventoryBrowserExtensionsFields from '../../common/known-fields/states-inventory-browser-extensions.json';
import inventorySCAFields from '../../common/known-fields/states-sca.json';
import statisticsFields from '../../common/known-fields/statistics.json';
import monitoringFields from '../../common/known-fields/monitoring.json';

// Use generated fields as the primary source
export const KnownFields = alertsFields;

/**
 * Unified known fields mapping for all index types
 * Uses WAZUH_INDEX_TYPE_* constants as keys
 */
export const KnownFieldsByIndexType = {
  // Main index types
  [WAZUH_INDEX_TYPE_ALERTS]: alertsFields,
  [WAZUH_INDEX_TYPE_MONITORING]: monitoringFields,
  [WAZUH_INDEX_TYPE_STATISTICS]: statisticsFields,

  // States index types
  [WAZUH_INDEX_TYPE_STATES_VULNERABILITIES]: vulnerabilitiesFields,
  [WAZUH_INDEX_TYPE_STATES_FIM_FILES]: fimFilesFields,
  [WAZUH_INDEX_TYPE_STATES_FIM_REGISTRIES_KEYS]: fimRegistriesKeysFields,
  [WAZUH_INDEX_TYPE_STATES_FIM_REGISTRIES_VALUES]: fimRegistriesValuesFields,
  [WAZUH_INDEX_TYPE_STATES_INVENTORY]: inventoryFields,
  [WAZUH_INDEX_TYPE_STATES_INVENTORY_SYSTEM]: inventorySystemFields,
  [WAZUH_INDEX_TYPE_STATES_INVENTORY_HARDWARE]: inventoryHardwareFields,
  [WAZUH_INDEX_TYPE_STATES_INVENTORY_NETWORKS]: inventoryNetworksFields,
  [WAZUH_INDEX_TYPE_STATES_INVENTORY_PACKAGES]: inventoryPackagesFields,
  [WAZUH_INDEX_TYPE_STATES_INVENTORY_PORTS]: inventoryPortsFields,
  [WAZUH_INDEX_TYPE_STATES_INVENTORY_PROCESSES]: inventoryProcessesFields,
  [WAZUH_INDEX_TYPE_STATES_INVENTORY_PROTOCOLS]: inventoryProtocolsFields,
  [WAZUH_INDEX_TYPE_STATES_INVENTORY_USERS]: inventoryUsersFields,
  [WAZUH_INDEX_TYPE_STATES_INVENTORY_GROUPS]: inventoryGroupsFields,
  [WAZUH_INDEX_TYPE_STATES_INVENTORY_SERVICES]: inventoryServicesFields,
  [WAZUH_INDEX_TYPE_STATES_INVENTORY_INTERFACES]: inventoryInterfacesFields,
  [WAZUH_INDEX_TYPE_STATES_INVENTORY_HOTFIXES]: inventoryHotfixesFields,
  [WAZUH_INDEX_TYPE_STATES_INVENTORY_BROWSER_EXTENSIONS]:
    inventoryBrowserExtensionsFields,
  [WAZUH_INDEX_TYPE_STATES_SCA]: inventorySCAFields,
};

/**
 * Get known fields by index type
 * @param {string} indexType - The index type constant value (e.g., 'alerts', 'states-vulnerabilities')
 * @returns {Array|null} The known fields for the index type or null if not found
 */
export function getKnownFieldsByIndexType(indexType) {
  return KnownFieldsByIndexType[indexType] || null;
}
