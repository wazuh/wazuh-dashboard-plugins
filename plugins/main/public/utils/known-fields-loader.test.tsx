import {
  KnownFields,
  KnownFieldsStatesGenerated,
  getKnownFieldsForPattern,
  getKnownFieldsByIndexType,
  extractPatternType,
  getKnownFieldsForStatesPattern,
} from './known-fields-loader';
import { FieldsMonitoring } from './monitoring-fields';
import statisticsFields from './known-fields/statistics.json';

const monitoringFields = FieldsMonitoring;
import {
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

describe('Known Fields Loader', () => {
  describe('KnownFields export', () => {
    test('should export KnownFields as alerts fields', () => {
      expect(KnownFields).toBeDefined();
      expect(Array.isArray(KnownFields)).toBe(true);
      expect(KnownFields.length).toBeGreaterThan(0);

      // Should include basic index fields
      const basicFields = ['_id', '_index', '_score', '_source', '_type'];
      basicFields.forEach(fieldName => {
        const field = KnownFields.find(f => f.name === fieldName);
        expect(field).toBeDefined();
      });
    });
  });

  describe('getKnownFieldsByIndexType', () => {
    test('should return known fields for all index types', () => {
      const indexTypes = [
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
      ];

      indexTypes.forEach(indexType => {
        const fields = getKnownFieldsByIndexType(indexType);
        expect(fields).toBeDefined();
        expect(Array.isArray(fields)).toBe(true);
        expect(fields.length).toBeGreaterThan(0);
      });
    });

    test('should have consistent field structure', () => {
      const fields = getKnownFieldsByIndexType(WAZUH_INDEX_TYPE_ALERTS);
      fields.forEach(field => {
        expect(field).toHaveProperty('name');
        expect(field).toHaveProperty('type');
        expect(field).toHaveProperty('searchable');
        expect(field).toHaveProperty('aggregatable');
        expect(field).toHaveProperty('readFromDocValues');
      });
    });
  });

  describe('KnownFieldsStatesGenerated', () => {
    test('should include all states pattern types', () => {
      const expectedStatesTypes = [
        'vulnerabilities',
        'fim-files',
        'fim-registries',
        'inventory-system',
        'inventory-hardware',
        'inventory-networks',
        'inventory-packages',
        'inventory-ports',
        'inventory-processes',
        'inventory-protocols',
        'inventory-users',
        'inventory-groups',
        'inventory-services',
        'inventory-interfaces',
        'inventory-hotfixes',
        'inventory-browser-extensions',
      ];

      expectedStatesTypes.forEach(type => {
        expect(KnownFieldsStatesGenerated[type]).toBeDefined();
        expect(Array.isArray(KnownFieldsStatesGenerated[type])).toBe(true);
      });
    });
  });

  describe('extractPatternType', () => {
    test('should extract pattern type from valid states patterns', () => {
      expect(extractPatternType('wazuh-states-vulnerabilities-*')).toBe(
        'vulnerabilities',
      );
      expect(extractPatternType('wazuh-states-fim-files-*')).toBe('fim-files');
      expect(extractPatternType('wazuh-states-inventory-system-*')).toBe(
        'inventory-system',
      );
      expect(
        extractPatternType('wazuh-states-inventory-browser-extensions-*'),
      ).toBe('inventory-browser-extensions');
    });

    test('should return null for non-states patterns', () => {
      expect(extractPatternType('wazuh-alerts-*')).toBeNull();
      expect(extractPatternType('wazuh-monitoring-*')).toBeNull();
      expect(extractPatternType('some-other-pattern-*')).toBeNull();
    });

    test('should return null for malformed patterns', () => {
      expect(extractPatternType('')).toBeNull();
      expect(extractPatternType('wazuh-states-')).toBeNull();
      expect(extractPatternType('wazuh-states-*')).toBeNull();
    });

    test('should return null for unknown states pattern types', () => {
      // Pattern format is correct but type is not in KnownFieldsStatesGenerated
      expect(extractPatternType('wazuh-states-unknown-type-*')).toBeNull();
      expect(extractPatternType('wazuh-states-new-feature-*')).toBeNull();
    });
  });

  describe('getKnownFieldsForPattern', () => {
    test('should return correct fields for valid pattern types', () => {
      const vulnerabilityFields = getKnownFieldsForPattern('vulnerabilities');
      expect(vulnerabilityFields).toBeDefined();
      expect(Array.isArray(vulnerabilityFields)).toBe(true);

      const systemFields = getKnownFieldsForPattern('inventory-system');
      expect(systemFields).toBeDefined();
      expect(Array.isArray(systemFields)).toBe(true);
    });

    test('should return null for unknown pattern types', () => {
      expect(getKnownFieldsForPattern('unknown-type')).toBeNull();
      expect(getKnownFieldsForPattern('')).toBeNull();
    });
  });

  describe('getKnownFieldsForStatesPattern', () => {
    test('should return correct fields for states patterns', () => {
      const vulnerabilityFields = getKnownFieldsForStatesPattern(
        'wazuh-states-vulnerabilities-*',
      );
      expect(vulnerabilityFields).toBeDefined();
      expect(Array.isArray(vulnerabilityFields)).toBe(true);

      const systemFields = getKnownFieldsForStatesPattern(
        'wazuh-states-inventory-system-*',
      );
      expect(systemFields).toBeDefined();
      expect(Array.isArray(systemFields)).toBe(true);
    });

    test('should return null for non-states patterns', () => {
      expect(getKnownFieldsForStatesPattern('wazuh-alerts-*')).toBeNull();
      expect(getKnownFieldsForStatesPattern('wazuh-monitoring-*')).toBeNull();
    });
  });

  describe('States-specific field validation', () => {
    test('vulnerabilities should have package and vulnerability fields', () => {
      const vulnFields = getKnownFieldsForStatesPattern(
        'wazuh-states-vulnerabilities-*',
      );

      const packageFields = vulnFields.filter(f =>
        f.name.startsWith('package.'),
      );
      expect(packageFields.length).toBeGreaterThan(0);

      const vulnerabilityFields = vulnFields.filter(f =>
        f.name.startsWith('vulnerability.'),
      );
      expect(vulnerabilityFields.length).toBeGreaterThan(0);
    });

    test('inventory-system should have host OS fields', () => {
      const systemFields = getKnownFieldsForStatesPattern(
        'wazuh-states-inventory-system-*',
      );

      const hostFields = systemFields.filter(f => f.name.startsWith('host.'));
      expect(hostFields.length).toBeGreaterThan(0);

      const osFields = systemFields.filter(f => f.name.startsWith('host.os.'));
      expect(osFields.length).toBeGreaterThan(0);
    });

    test('monitoring should have timestamp and status fields', () => {
      const timestampField = monitoringFields.find(f => f.name === 'timestamp');
      expect(timestampField).toBeDefined();
      expect(timestampField.type).toBe('date');

      const statusField = monitoringFields.find(f => f.name === 'status');
      expect(statusField).toBeDefined();
      expect(statusField.type).toBe('string');
    });

    test('statistics should have analysisd fields', () => {
      const analysisdFields = statisticsFields.filter(f =>
        f.name.startsWith('analysisd.'),
      );
      expect(analysisdFields.length).toBeGreaterThan(0);

      const remoteFields = statisticsFields.filter(f =>
        f.name.startsWith('remoted.'),
      );
      expect(remoteFields.length).toBeGreaterThan(0);
    });
  });
});
