const { RuleGenerator } = require('./rule-generator');

describe('rule-generator', () => {
  describe('id', () => {
    it('should_verify_id_is_string', () => {
      expect(typeof RuleGenerator.id() === 'string').toBe(true);
      for (let i = 0; i < 100; i++) {
        expect(/\d+/.test(RuleGenerator.id())).toBe(true);
      }
    });
  });
  describe('level', () => {
    it('should_verify_level_is_an_integer', () => {
      for (let i = 0; i < 100; i++) {
        expect(Number.isInteger(RuleGenerator.level())).toBe(true);
      }
    });
  });
  describe('firedtimes', () => {
    it('firedtimes_is_an_integer', () => {
      for (let i = 0; i < 100; i++) {
        const actualValue = RuleGenerator.firedtimes();
        expect(Number.isInteger(actualValue)).toBe(true);
        expect(actualValue).toBeGreaterThanOrEqual(0);
      }
    });
  });
  describe('mail', () => {
    it('mail_is_an_integer', () => {
      for (let i = 0; i < 100; i++) {
        expect(typeof RuleGenerator.mail() === 'boolean').toBe(true);
      }
    });
  });
  describe('gdpr', () => {
    it('should_verify_gdpr_returns_array_of_strings_within_length', () => {
      for (let i = 0; i < 100; i++) {
        const actualValue = RuleGenerator.gdpr();
        expect(Array.isArray(actualValue)).toBe(true);
        expect(actualValue.every(value => typeof value === 'string')).toBe(
          true,
        );
        expect(actualValue.length).toBeGreaterThanOrEqual(1);
        expect(actualValue.length).toBeLessThanOrEqual(2);
      }
    });
  });
  describe('pci_dss', () => {
    it('should_verify_pci_dss_returns_array_of_strings_within_length', () => {
      for (let i = 0; i < 100; i++) {
        const actualValue = RuleGenerator.pci_dss();
        expect(Array.isArray(actualValue)).toBe(true);
        expect(actualValue.every(value => typeof value === 'string')).toBe(
          true,
        );
        expect(actualValue.length).toBeGreaterThanOrEqual(1);
        expect(actualValue.length).toBeLessThanOrEqual(3);
      }
    });
  });
  describe('tsc', () => {
    it('should_verify_tsc_returns_array_of_strings_within_length', () => {
      for (let i = 0; i < 100; i++) {
        const actualValue = RuleGenerator.tsc();
        expect(Array.isArray(actualValue)).toBe(true);
        expect(actualValue.every(value => typeof value === 'string')).toBe(
          true,
        );
        expect(actualValue.length).toBeGreaterThanOrEqual(1);
        expect(actualValue.length).toBeLessThanOrEqual(6);
      }
    });
  });
  describe('hipaa', () => {
    it('should_verify_hipaa_returns_array_of_strings_within_length', () => {
      for (let i = 0; i < 100; i++) {
        const actualValue = RuleGenerator.hipaa();
        expect(Array.isArray(actualValue)).toBe(true);
        expect(actualValue.every(value => typeof value === 'string')).toBe(
          true,
        );
        expect(actualValue.length).toBeGreaterThanOrEqual(1);
        expect(actualValue.length).toBeLessThanOrEqual(3);
      }
    });
  });
  describe('nist_800_53', () => {
    it('should_verify_nist_800_53_returns_array_of_strings_within_length', () => {
      for (let i = 0; i < 100; i++) {
        const actualValue = RuleGenerator.nist_800_53();
        expect(Array.isArray(actualValue)).toBe(true);
        expect(actualValue.every(value => typeof value === 'string')).toBe(
          true,
        );
        expect(actualValue.length).toBeGreaterThanOrEqual(1);
        expect(actualValue.length).toBeLessThanOrEqual(4);
      }
    });
  });
  describe('gpg13', () => {
    it('should_verify_gpg13_returns_array_of_strings_within_length', () => {
      for (let i = 0; i < 100; i++) {
        const actualValue = RuleGenerator.gpg13();
        expect(Array.isArray(actualValue)).toBe(true);
        expect(actualValue.every(value => typeof value === 'string')).toBe(
          true,
        );
        expect(actualValue.length).toBeGreaterThanOrEqual(1);
        expect(actualValue.length).toBeLessThanOrEqual(3);
      }
    });
  });
  describe('pci', () => {
    it('should_verify_pci_returns_array_of_strings_within_length', () => {
      for (let i = 0; i < 100; i++) {
        const actualValue = RuleGenerator.pci();
        expect(Array.isArray(actualValue)).toBe(true);
        expect(actualValue.every(value => typeof value === 'string')).toBe(
          true,
        );
        expect(actualValue.length).toEqual(1);
      }
    });
  });
  describe('frequency', () => {
    it('should_verify_frequency_is_an_integer', () => {
      for (let i = 0; i < 100; i++) {
        expect(Number.isInteger(RuleGenerator.frequency())).toBe(true);
      }
    });
  });
});
