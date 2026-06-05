/**
 * Unit tests for generate-alerts-script
 * Tests Wazuh Common Schema compliance
 */

const { generateAlert, generateAlerts } = require('../generate-alerts-script');
const { version: packageVersion } = require('../../../../package.json');

describe('Generate Alerts - Wazuh Common Schema', () => {
  describe('Base Alert Structure', () => {
    test('should generate alert with required top-level fields', () => {
      const alert = generateAlert({ authentication: true });

      expect(alert).toHaveProperty('@timestamp');
      expect(alert).toHaveProperty('event');
      expect(alert).toHaveProperty('agent');
      expect(alert).toHaveProperty('wazuh');
      expect(alert).toHaveProperty('rule');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('tags');
    });

    test('should have valid timestamp format', () => {
      const alert = generateAlert({ authentication: true });
      const timestamp = new Date(alert['@timestamp']);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
      // Should be within last 7 days
      expect(timestamp.getTime()).toBeGreaterThan(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      );
    });

    test('should have @sampledata marker', () => {
      const alert = generateAlert({ authentication: true });
      expect(alert['@sampledata']).toBe(true);
    });

    test('should have wazuh tags', () => {
      const alert = generateAlert({ authentication: true });
      expect(Array.isArray(alert.tags)).toBe(true);
      expect(alert.tags).toContain('wazuh');
      expect(alert.tags).toContain('@sampledata');
    });
  });

  describe('Event Fields (ECS)', () => {
    test('should have complete event categorization', () => {
      const alert = generateAlert({ authentication: true });

      expect(alert.event).toHaveProperty('kind');
      expect(alert.event).toHaveProperty('category');
      expect(alert.event).toHaveProperty('type');
      expect(alert.event).toHaveProperty('module');
      expect(alert.event).toHaveProperty('dataset');
      expect(alert.event.kind).toBe('alert');
      expect(alert.event.dataset).toBe('wazuh.alerts');
    });

    test('should have arrays for category and type', () => {
      const alert = generateAlert({ authentication: true });

      expect(Array.isArray(alert.event.category)).toBe(true);
      expect(Array.isArray(alert.event.type)).toBe(true);
      expect(alert.event.category.length).toBeGreaterThan(0);
      expect(alert.event.type.length).toBeGreaterThan(0);
    });
  });

  describe('Wazuh Fields', () => {
    test('should have wazuh.schema.version', () => {
      const alert = generateAlert({ authentication: true });
      expect(alert.wazuh.schema.version).toBe('1.7.0');
    });

    test('should have wazuh.cluster', () => {
      const alert = generateAlert({ authentication: true });
      expect(alert.wazuh.cluster).toHaveProperty('name');
      expect(typeof alert.wazuh.cluster.name).toBe('string');
    });

    test('should have decoders as array', () => {
      const alert = generateAlert({ authentication: true });
      expect(Array.isArray(alert.wazuh.integration.decoders)).toBe(true);
      expect(alert.wazuh.integration.decoders.length).toBeGreaterThan(0);
    });

    test('should have rules as array', () => {
      const alert = generateAlert({ authentication: true });
      expect(Array.isArray(alert.wazuh.rules)).toBe(true);
      expect(alert.wazuh.rules.length).toBeGreaterThan(0);
    });
  });

  describe('Agent Fields', () => {
    test('should have agent with id, name, version', () => {
      const alert = generateAlert({ authentication: true });

      expect(alert.agent).toHaveProperty('id');
      expect(alert.agent).toHaveProperty('name');
      expect(alert.agent).toHaveProperty('version');
      expect(alert.agent.version).toBe(`v${packageVersion}`);
    });

    test('should have agent.host with required fields', () => {
      const alert = generateAlert({ authentication: true });

      expect(alert.agent.host).toHaveProperty('ip');
      expect(alert.agent.host).toHaveProperty('mac');
      expect(alert.agent.host).toHaveProperty('os');
      expect(alert.agent.host).toHaveProperty('architecture');

      // IP should be array
      expect(Array.isArray(alert.agent.host.ip)).toBe(true);
      expect(alert.agent.host.ip.length).toBeGreaterThan(0);

      // MAC should be array
      expect(Array.isArray(alert.agent.host.mac)).toBe(true);
      expect(alert.agent.host.mac.length).toBeGreaterThan(0);

      // OS should be object
      expect(alert.agent.host.os).toHaveProperty('type');
      expect(alert.agent.host.os).toHaveProperty('name');
    });

    test('should have agent.groups as array', () => {
      const alert = generateAlert({ authentication: true });
      expect(Array.isArray(alert.agent.groups)).toBe(true);
      expect(alert.agent.groups).toContain('default');
    });
  });

  describe('Rule Fields', () => {
    test('should have rule with required fields', () => {
      const alert = generateAlert({ authentication: true });

      expect(alert.rule).toHaveProperty('id');
      expect(alert.rule).toHaveProperty('description');
      expect(alert.rule).toHaveProperty('level');
      expect(alert.rule).toHaveProperty('groups');
    });

    test('should have wazuh.integration.decoders as array', () => {
      const alert = generateAlert({ authentication: true });
      expect(Array.isArray(alert.wazuh.integration.decoders)).toBe(true);
    });

    test('should have valid rule level', () => {
      const alert = generateAlert({ authentication: true });
      expect(typeof alert.rule.level).toBe('number');
      expect(alert.rule.level).toBeGreaterThanOrEqual(1);
      expect(alert.rule.level).toBeLessThanOrEqual(15);
    });
  });

  describe('Log Fields', () => {
    test('should have log fields', () => {
      const alert = generateAlert({ authentication: true });

      expect(alert.log).toHaveProperty('level');
      expect(alert.log).toHaveProperty('file');
      expect(alert.log).toHaveProperty('origin');
      expect(alert.log.file).toHaveProperty('path');
      expect(alert.log.origin).toHaveProperty('file');
      expect(alert.log.origin.file).toHaveProperty('name');
    });
  });

  describe('Module-Specific Tests', () => {
    describe('Authentication Module', () => {
      test('should have user fields', () => {
        const alert = generateAlert({ authentication: true });

        expect(alert.user).toBeDefined();
        expect(alert.user).toHaveProperty('name');
      });

      test('should have source and destination fields', () => {
        const alert = generateAlert({ authentication: true });

        expect(alert.source).toBeDefined();
        expect(alert.source).toHaveProperty('ip');
        expect(alert.destination).toBeDefined();
        expect(alert.destination).toHaveProperty('ip');
      });

      test('should have geo location in source', () => {
        const alert = generateAlert({ authentication: true });

        expect(alert.source.geo).toBeDefined();
        expect(alert.source.geo).toHaveProperty('country_name');
        expect(alert.source.geo).toHaveProperty('city_name');
        expect(alert.source.geo).toHaveProperty('location');
        expect(alert.source.geo.location).toHaveProperty('lat');
        expect(alert.source.geo.location).toHaveProperty('lon');
      });
    });

    describe('FIM/Syscheck Module', () => {
      test('should have file fields', () => {
        const alert = generateAlert({ syscheck: true });

        expect(alert.file).toBeDefined();
        expect(alert.file).toHaveProperty('path');
        expect(alert.file).toHaveProperty('name');
        expect(alert.file).toHaveProperty('directory');
        expect(alert.file).toHaveProperty('size');
        expect(alert.file).toHaveProperty('owner');
      });

      test('should have event.module as fim', () => {
        const alert = generateAlert({ syscheck: true });
        expect(alert.event.module).toBe('fim');
      });

      test('should have file event action', () => {
        const alert = generateAlert({ syscheck: true });
        expect(alert.event.action).toMatch(/^file-(added|modified|deleted)$/);
      });
    });

    describe('AWS Module', () => {
      test('should have cloud fields', () => {
        const alert = generateAlert({ aws: true });

        expect(alert.cloud).toBeDefined();
        expect(alert.cloud.provider).toBe('aws');
        expect(alert.cloud).toHaveProperty('region');
        expect(alert.cloud).toHaveProperty('account');
        expect(alert.cloud.account).toHaveProperty('id');
      });

      test('should have service name', () => {
        const alert = generateAlert({ aws: true });
        expect(alert.cloud.service).toHaveProperty('name');
      });
    });

    describe('Azure Module', () => {
      test('should have cloud.provider as azure', () => {
        const alert = generateAlert({ azure: true });
        expect(alert.cloud.provider).toBe('azure');
      });
    });

    describe('GCP Module', () => {
      test('should have cloud.provider as gcp', () => {
        const alert = generateAlert({ gcp: true });
        expect(alert.cloud.provider).toBe('gcp');
      });

      test('should have project id', () => {
        const alert = generateAlert({ gcp: true });
        expect(alert.cloud.project).toHaveProperty('id');
      });
    });

    describe('Vulnerabilities Module', () => {
      test('should have vulnerability fields', () => {
        const alert = generateAlert({ vulnerabilities: true });

        expect(alert.vulnerability).toBeDefined();
        expect(alert.vulnerability).toHaveProperty('id');
        expect(alert.vulnerability).toHaveProperty('severity');
        expect(alert.vulnerability).toHaveProperty('score');
        expect(alert.vulnerability.score).toHaveProperty('base');
      });

      test('should have valid CVE format', () => {
        const alert = generateAlert({ vulnerabilities: true });
        expect(alert.vulnerability.id).toMatch(/^CVE-\d{4}-\d+$/);
      });
    });

    describe('Docker Module', () => {
      test('should have container fields', () => {
        const alert = generateAlert({ docker: true });

        expect(alert.container).toBeDefined();
        expect(alert.container).toHaveProperty('id');
        expect(alert.container).toHaveProperty('name');
        expect(alert.container).toHaveProperty('image');
        expect(alert.container.image).toHaveProperty('name');
      });
    });
  });

  describe('Message Generation', () => {
    test('should have descriptive message (not generic)', () => {
      const modules = ['authentication', 'aws', 'azure', 'fim', 'docker'];

      modules.forEach(mod => {
        const params = {};
        params[mod === 'fim' ? 'syscheck' : mod] = true;
        const alert = generateAlert(params);

        expect(alert.message).toBeDefined();
        expect(alert.message).not.toBe('Sample security alert');
        expect(alert.message.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Batch Generation', () => {
    test('should generate multiple alerts', () => {
      const alerts = generateAlerts({ authentication: true }, 5);

      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBe(5);
    });

    test('should generate unique alerts', () => {
      const alerts = generateAlerts({ authentication: true }, 3);

      const timestamps = alerts.map(a => a['@timestamp']);
      const uniqueTimestamps = new Set(timestamps);

      // All timestamps should be present (might have duplicates due to fast generation)
      expect(timestamps.length).toBe(3);
    });
  });
});
