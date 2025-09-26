import {
  KnownFields,
  GeneratedKnownFields,
  KnownFieldsStatesGenerated,
  getKnownFieldsForPattern,
  extractPatternType,
  getKnownFieldsForStatesPattern,
} from './known-fields-loader';

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

  describe('GeneratedKnownFields', () => {
    test('should include all expected template types', () => {
      const expectedTypes = [
        'alerts',
        'monitoring', 
        'statistics',
        'states-vulnerabilities',
        'states-fim-files',
        'states-fim-registries',
        'states-inventory-system',
        'states-inventory-hardware',
        'states-inventory-networks',
        'states-inventory-packages',
        'states-inventory-ports',
        'states-inventory-processes',
        'states-inventory-protocols',
        'states-inventory-users',
        'states-inventory-groups',
        'states-inventory-services',
        'states-inventory-interfaces',
        'states-inventory-hotfixes',
        'states-inventory-browser-extensions',
      ];

      expectedTypes.forEach(type => {
        expect(GeneratedKnownFields[type]).toBeDefined();
        expect(Array.isArray(GeneratedKnownFields[type])).toBe(true);
        expect(GeneratedKnownFields[type].length).toBeGreaterThan(0);
      });
    });

    test('should have consistent field structure', () => {
      Object.values(GeneratedKnownFields).forEach(fields => {
        fields.forEach(field => {
          expect(field).toHaveProperty('name');
          expect(field).toHaveProperty('type');
          expect(field).toHaveProperty('searchable');
          expect(field).toHaveProperty('aggregatable');
          expect(field).toHaveProperty('readFromDocValues');
        });
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
      expect(extractPatternType('wazuh-states-vulnerabilities-*')).toBe('vulnerabilities');
      expect(extractPatternType('wazuh-states-fim-files-*')).toBe('fim-files');
      expect(extractPatternType('wazuh-states-inventory-system-*')).toBe('inventory-system');
      expect(extractPatternType('wazuh-states-inventory-browser-extensions-*')).toBe('inventory-browser-extensions');
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
      const vulnerabilityFields = getKnownFieldsForStatesPattern('wazuh-states-vulnerabilities-*');
      expect(vulnerabilityFields).toBeDefined();
      expect(Array.isArray(vulnerabilityFields)).toBe(true);

      const systemFields = getKnownFieldsForStatesPattern('wazuh-states-inventory-system-*');
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
      const vulnFields = getKnownFieldsForStatesPattern('wazuh-states-vulnerabilities-*');
      
      const packageFields = vulnFields.filter(f => f.name.startsWith('package.'));
      expect(packageFields.length).toBeGreaterThan(0);
      
      const vulnerabilityFields = vulnFields.filter(f => f.name.startsWith('vulnerability.'));
      expect(vulnerabilityFields.length).toBeGreaterThan(0);
    });

    test('inventory-system should have host OS fields', () => {
      const systemFields = getKnownFieldsForStatesPattern('wazuh-states-inventory-system-*');
      
      const hostFields = systemFields.filter(f => f.name.startsWith('host.'));
      expect(hostFields.length).toBeGreaterThan(0);
      
      const osFields = systemFields.filter(f => f.name.startsWith('host.os.'));
      expect(osFields.length).toBeGreaterThan(0);
    });

    test('monitoring should have timestamp and status fields', () => {
      const monitoringFields = GeneratedKnownFields.monitoring;
      
      const timestampField = monitoringFields.find(f => f.name === 'timestamp');
      expect(timestampField).toBeDefined();
      expect(timestampField.type).toBe('date');
      
      const statusField = monitoringFields.find(f => f.name === 'status');
      expect(statusField).toBeDefined();
      expect(statusField.type).toBe('string');
    });

    test('statistics should have analysisd fields', () => {
      const statisticsFields = GeneratedKnownFields.statistics;
      
      const analysisdFields = statisticsFields.filter(f => f.name.startsWith('analysisd.'));
      expect(analysisdFields.length).toBeGreaterThan(0);
      
      const remoteFields = statisticsFields.filter(f => f.name.startsWith('remoted.'));
      expect(remoteFields.length).toBeGreaterThan(0);
    });
  });
});
