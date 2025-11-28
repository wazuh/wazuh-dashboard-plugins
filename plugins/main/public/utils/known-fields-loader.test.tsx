import { KnownFields, getKnownFieldsByIndexType } from './known-fields-loader';
import FieldsMonitoring from '../../common/known-fields/monitoring.json';
import statisticsFields from '../../common/known-fields/statistics.json';
import {
  WAZUH_INDEX_TYPE_ALERTS,
  WAZUH_INDEX_TYPE_MONITORING,
  WAZUH_INDEX_TYPE_STATES_FIM_FILES,
  WAZUH_INDEX_TYPE_STATES_FIM_REGISTRIES_KEYS,
  WAZUH_INDEX_TYPE_STATES_FIM_REGISTRIES_VALUES,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_BROWSER_EXTENSIONS,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_GROUPS,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_HARDWARE,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_HOTFIXES,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_INTERFACES,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_NETWORKS,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_PACKAGES,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_PORTS,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_PROCESSES,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_PROTOCOLS,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_SERVICES,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_SYSTEM,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_USERS,
  WAZUH_INDEX_TYPE_STATES_VULNERABILITIES,
  WAZUH_INDEX_TYPE_STATISTICS,
  WAZUH_INDEX_TYPE_STATES_SCA,
  WAZUH_INDEX_TYPE_EVENTS,
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
} from '../../common/constants';

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
        WAZUH_INDEX_TYPE_ALERTS,
        WAZUH_INDEX_TYPE_MONITORING,
        WAZUH_INDEX_TYPE_STATISTICS,
        WAZUH_INDEX_TYPE_STATES_VULNERABILITIES,
        WAZUH_INDEX_TYPE_STATES_FIM_FILES,
        WAZUH_INDEX_TYPE_STATES_FIM_REGISTRIES_KEYS,
        WAZUH_INDEX_TYPE_STATES_FIM_REGISTRIES_VALUES,
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
        WAZUH_INDEX_TYPE_EVENTS,
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
      expect(fields).toBeTruthy();
      expect(Array.isArray(fields)).toBe(true);
      if (fields) {
        fields.forEach(field => {
          expect(field).toHaveProperty('name');
          expect(field).toHaveProperty('type');
          expect(field).toHaveProperty('searchable');
          expect(field).toHaveProperty('aggregatable');
          expect(field).toHaveProperty('readFromDocValues');
        });
      }
    });
  });

  describe('States-specific field validation', () => {
    test('monitoring should have timestamp and status fields', () => {
      const timestampField = monitoringFields.find(f => f.name === 'timestamp');
      expect(timestampField).toBeDefined();
      if (timestampField) {
        expect(timestampField.type).toBe('date');
      }

      const statusField = monitoringFields.find(f => f.name === 'status');
      expect(statusField).toBeDefined();
      if (statusField) {
        expect(statusField.type).toBe('string');
      }
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

  describe('Events fields validation', () => {
    test('combined events should have fields from all event types', () => {
      const eventsFields = getKnownFieldsByIndexType(WAZUH_INDEX_TYPE_EVENTS);
      expect(eventsFields).toBeDefined();
      expect(Array.isArray(eventsFields)).toBe(true);
      if (eventsFields) {
        expect(eventsFields.length).toBeGreaterThan(0);

        // Should include basic index fields
        const basicFields = ['_id', '_index', '_score', '_source', '_type'];
        basicFields.forEach(fieldName => {
          const field = eventsFields.find(f => f.name === fieldName);
          expect(field).toBeDefined();
        });

        // Should include timestamp field
        const timestampField = eventsFields.find(f => f.name === '@timestamp');
        expect(timestampField).toBeDefined();
        if (timestampField) {
          expect(timestampField.type).toBe('date');
        }
      }
    });

    test('individual event types should have their specific fields', () => {
      const eventTypes = [
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
      ];

      eventTypes.forEach(eventType => {
        const fields = getKnownFieldsByIndexType(eventType);
        expect(fields).toBeDefined();
        expect(Array.isArray(fields)).toBe(true);
        if (fields) {
          expect(fields.length).toBeGreaterThan(0);

          // Each event type should have timestamp field
          const timestampField = fields.find(f => f.name === '@timestamp');
          expect(timestampField).toBeDefined();
          if (timestampField) {
            expect(timestampField.type).toBe('date');
          }
        }
      });
    });

    test('combined events should have more fields than individual event types', () => {
      const combinedFields = getKnownFieldsByIndexType(WAZUH_INDEX_TYPE_EVENTS);
      const individualFields = getKnownFieldsByIndexType(
        WAZUH_INDEX_TYPE_EVENTS_SECURITY,
      );

      // Combined fields should have at least as many fields as individual types
      // (usually more due to deduplication and combination)
      if (combinedFields && individualFields) {
        expect(combinedFields.length).toBeGreaterThanOrEqual(
          individualFields.length,
        );
      }
    });
  });
});
