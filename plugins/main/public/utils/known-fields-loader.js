/**
 * Known fields loader - loads known fields from generated JSON files
 *
 * This module loads the known fields that are automatically generated
 * from Wazuh index templates, ensuring they're always in sync with
 * the official field definitions.
 */

// Import index type constants
import {
  WAZUH_INDEX_TYPE_EVENTS,
  WAZUH_INDEX_TYPE_ARCHIVES,
  WAZUH_INDEX_TYPE_EVENTS_ACCESS_MANAGEMENT,
  WAZUH_INDEX_TYPE_EVENTS_APPLICATIONS,
  WAZUH_INDEX_TYPE_EVENTS_CLOUD_SERVICES,
  WAZUH_INDEX_TYPE_EVENTS_CLOUD_SERVICES_AWS,
  WAZUH_INDEX_TYPE_EVENTS_CLOUD_SERVICES_AZURE,
  WAZUH_INDEX_TYPE_EVENTS_CLOUD_SERVICES_GCP,
  WAZUH_INDEX_TYPE_EVENTS_NETWORK_ACTIVITY,
  WAZUH_INDEX_TYPE_EVENTS_OTHER,
  WAZUH_INDEX_TYPE_EVENTS_SECURITY,
  WAZUH_INDEX_TYPE_EVENTS_SYSTEM_ACTIVITY,
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
import archivesFields from '../../common/known-fields/archives.json';
import eventsFields from '../../common/known-fields/events.json';
import eventsAccessManagementFields from '../../common/known-fields/events-access-management.json';
import eventsApplicationsFields from '../../common/known-fields/events-applications.json';
import eventsCloudServicesFields from '../../common/known-fields/events-cloud-services.json';
import eventsCloudServicesAWSFields from '../../common/known-fields/events-cloud-services-aws.json';
import eventsCloudServicesAzureFields from '../../common/known-fields/events-cloud-services-azure.json';
import eventsCloudServicesGCPFields from '../../common/known-fields/events-cloud-services-gcp.json';
import eventsNetworkActivityFields from '../../common/known-fields/events-network-activity.json';
import eventsOtherFields from '../../common/known-fields/events-other.json';
import eventsSecurityFields from '../../common/known-fields/events-security.json';
import eventsSystemActivityFields from '../../common/known-fields/events-system-activity.json';
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
export const KnownFields = eventsFields;

/**
 * Unified known fields mapping for all index types
 * Uses WAZUH_INDEX_TYPE_* constants as keys
 */
export const KnownFieldsByIndexType = {
  // Main index types
  [WAZUH_INDEX_TYPE_EVENTS]: eventsFields,
  [WAZUH_INDEX_TYPE_MONITORING]: monitoringFields,
  [WAZUH_INDEX_TYPE_STATISTICS]: statisticsFields,
  [WAZUH_INDEX_TYPE_ARCHIVES]: archivesFields,

  // Events
  [WAZUH_INDEX_TYPE_EVENTS_ACCESS_MANAGEMENT]: eventsAccessManagementFields,
  [WAZUH_INDEX_TYPE_EVENTS_APPLICATIONS]: eventsApplicationsFields,
  [WAZUH_INDEX_TYPE_EVENTS_CLOUD_SERVICES]: eventsCloudServicesFields,
  [WAZUH_INDEX_TYPE_EVENTS_CLOUD_SERVICES_AWS]: eventsCloudServicesAWSFields,
  [WAZUH_INDEX_TYPE_EVENTS_CLOUD_SERVICES_AZURE]:
    eventsCloudServicesAzureFields,
  [WAZUH_INDEX_TYPE_EVENTS_CLOUD_SERVICES_GCP]: eventsCloudServicesGCPFields,
  [WAZUH_INDEX_TYPE_EVENTS_NETWORK_ACTIVITY]: eventsNetworkActivityFields,
  [WAZUH_INDEX_TYPE_EVENTS_OTHER]: eventsOtherFields,
  [WAZUH_INDEX_TYPE_EVENTS_SECURITY]: eventsSecurityFields,
  [WAZUH_INDEX_TYPE_EVENTS_SYSTEM_ACTIVITY]: eventsSystemActivityFields,

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
