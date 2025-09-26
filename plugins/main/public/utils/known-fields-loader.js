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

// Re-export the original KnownFields for backwards compatibility
// These are the manually maintained fields for alerts
export { KnownFields } from './known-fields.js';

/**
 * Generated known fields for different index patterns
 */
export const GeneratedKnownFields = {
  alerts: alertsFields,
  'states-vulnerabilities': vulnerabilitiesFields,
};

/**
 * Known fields mapping for states patterns
 * Maps pattern types to their corresponding generated fields
 */
export const KnownFieldsStatesGenerated = {
  'vulnerabilities': vulnerabilitiesFields,
  // We can add more generated fields here as we create them
  'inventory-system': vulnerabilitiesFields, // Fallback for now
  'inventory-hardware': vulnerabilitiesFields, // Fallback for now
  'inventory-networks': vulnerabilitiesFields, // Fallback for now
  'fim-files': vulnerabilitiesFields, // Fallback for now
  'fim-registries': vulnerabilitiesFields, // Fallback for now
  'inventory-packages': vulnerabilitiesFields, // Fallback for now
  'inventory-ports': vulnerabilitiesFields, // Fallback for now
  'inventory-processes': vulnerabilitiesFields, // Fallback for now
  'inventory-protocols': vulnerabilitiesFields, // Fallback for now
  'inventory-users': vulnerabilitiesFields, // Fallback for now
  'inventory-groups': vulnerabilitiesFields, // Fallback for now
  'inventory-services': vulnerabilitiesFields, // Fallback for now
  'inventory-interfaces': vulnerabilitiesFields, // Fallback for now
  'inventory-hotfixes': vulnerabilitiesFields, // Fallback for now
  'inventory-browser-extensions': vulnerabilitiesFields, // Fallback for now
};

/**
 * Get known fields for a specific pattern type
 * @param {string} patternType - The pattern type (e.g., 'vulnerabilities', 'inventory-system')
 * @returns {Array} The known fields for the pattern type
 */
export function getKnownFieldsForPattern(patternType) {
  return KnownFieldsStatesGenerated[patternType] || vulnerabilitiesFields;
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
