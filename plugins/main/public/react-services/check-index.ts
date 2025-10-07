import { SavedObject } from '.';
import { getSavedObjects } from '../kibana-services';
import {
  NOT_TIME_FIELD_NAME_INDEX_PATTERN,
  WAZUH_INDEX_TYPE_ALERTS,
  WAZUH_INDEX_TYPE_MONITORING,
  WAZUH_INDEX_TYPE_STATISTICS,
  WAZUH_INDEX_TYPE_STATES_VULNERABILITIES,
  WAZUH_INDEX_TYPE_STATES_FIM_FILES,
  WAZUH_INDEX_TYPE_STATES_FIM_REGISTRIES,
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
} from '../../common/constants';

// Pattern to index type mapping
const PATTERN_TO_INDEX_TYPE_MAP: Record<string, string> = {
  'wazuh-states-vulnerabilities': WAZUH_INDEX_TYPE_STATES_VULNERABILITIES,
  'wazuh-states-fim-files': WAZUH_INDEX_TYPE_STATES_FIM_FILES,
  'wazuh-states-fim-registries': WAZUH_INDEX_TYPE_STATES_FIM_REGISTRIES,
  'wazuh-states-inventory-system': WAZUH_INDEX_TYPE_STATES_INVENTORY_SYSTEM,
  'wazuh-states-inventory-hardware': WAZUH_INDEX_TYPE_STATES_INVENTORY_HARDWARE,
  'wazuh-states-inventory-networks': WAZUH_INDEX_TYPE_STATES_INVENTORY_NETWORKS,
  'wazuh-states-inventory-packages': WAZUH_INDEX_TYPE_STATES_INVENTORY_PACKAGES,
  'wazuh-states-inventory-ports': WAZUH_INDEX_TYPE_STATES_INVENTORY_PORTS,
  'wazuh-states-inventory-processes':
    WAZUH_INDEX_TYPE_STATES_INVENTORY_PROCESSES,
  'wazuh-states-inventory-protocols':
    WAZUH_INDEX_TYPE_STATES_INVENTORY_PROTOCOLS,
  'wazuh-states-inventory-users': WAZUH_INDEX_TYPE_STATES_INVENTORY_USERS,
  'wazuh-states-inventory-groups': WAZUH_INDEX_TYPE_STATES_INVENTORY_GROUPS,
  'wazuh-states-inventory-services': WAZUH_INDEX_TYPE_STATES_INVENTORY_SERVICES,
  'wazuh-states-inventory-interfaces':
    WAZUH_INDEX_TYPE_STATES_INVENTORY_INTERFACES,
  'wazuh-states-inventory-hotfixes': WAZUH_INDEX_TYPE_STATES_INVENTORY_HOTFIXES,
  'wazuh-states-inventory-browser-extensions':
    WAZUH_INDEX_TYPE_STATES_INVENTORY_BROWSER_EXTENSIONS,
  'wazuh-monitoring': WAZUH_INDEX_TYPE_MONITORING,
  'wazuh-statistics': WAZUH_INDEX_TYPE_STATISTICS,
};

export function getIndexTypeFromPattern(pattern: string): string {
  // Find matching pattern key
  const matchingKey = Object.keys(PATTERN_TO_INDEX_TYPE_MAP).find(key =>
    pattern.includes(key),
  );

  // Return corresponding index type or default to alerts
  return matchingKey
    ? PATTERN_TO_INDEX_TYPE_MAP[matchingKey]
    : WAZUH_INDEX_TYPE_ALERTS;
}

export async function existsIndices(
  indexPatternId: string,
  indexType: string,
) {
  try {
    const fields = await SavedObject.getIndicesFields(
      indexPatternId,
      indexType,
    );
    return { exist: true, fields };
  } catch (error) {
    return { exist: false };
  }
}

export async function existsIndexPattern(indexPatternID: string) {
  return await getSavedObjects().client.get('index-pattern', indexPatternID);
}

export async function createIndexPattern(
  indexPattern: string,
  fields: any,
  extraAttributes: any = {},
) {
  try {
    await SavedObject.createSavedObject(
      'index-pattern',
      indexPattern,
      {
        attributes: {
          ...(extraAttributes ?? {}),
          title: indexPattern,
          timeFieldName: NOT_TIME_FIELD_NAME_INDEX_PATTERN,
        },
      },
      fields,
    );
    await SavedObject.validateIndexPatternSavedObjectCanBeFound([indexPattern]);
  } catch (error) {
    return { error: error.message };
  }
}
