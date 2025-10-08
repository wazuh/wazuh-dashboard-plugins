import {
  KnownFields,
  KnownFieldsStatesGenerated,
  getKnownFieldsForPattern,
  getKnownFieldsByIndexType,
  extractPatternType,
} from './known-fields-loader';
import { FieldsMonitoring } from './monitoring-fields';
import statisticsFields from './known-fields/statistics.json';

const monitoringFields = FieldsMonitoring;

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
        'wazuh-index-type-alerts',
        'wazuh-index-type-monitoring',
        'wazuh-index-type-statistics',
        'wazuh-index-type-states-vulnerabilities',
        'wazuh-index-type-states-fim-files',
        'wazuh-index-type-states-fim-registries',
        'wazuh-index-type-states-inventory-system',
        'wazuh-index-type-states-inventory-hardware',
        'wazuh-index-type-states-inventory-networks',
        'wazuh-index-type-states-inventory-packages',
        'wazuh-index-type-states-inventory-ports',
        'wazuh-index-type-states-inventory-processes',
        'wazuh-index-type-states-inventory-protocols',
        'wazuh-index-type-states-inventory-users',
        'wazuh-index-type-states-inventory-groups',
        'wazuh-index-type-states-inventory-services',
        'wazuh-index-type-states-inventory-interfaces',
        'wazuh-index-type-states-inventory-hotfixes',
        'wazuh-index-type-states-inventory-browser-extensions',
      ];

      indexTypes.forEach(indexType => {
        const fields = getKnownFieldsByIndexType(indexType);
        expect(fields).toBeDefined();
        expect(Array.isArray(fields)).toBe(true);
        expect(fields.length).toBeGreaterThan(0);
      });
    });

    test('should have consistent field structure', () => {
      const fields = getKnownFieldsByIndexType('wazuh-index-type-alerts');
      expect(fields).toBeTruthy();
      expect(Array.isArray(fields)).toBe(true);
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

  describe('States-specific field validation', () => {
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
