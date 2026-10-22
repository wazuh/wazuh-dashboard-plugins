const fs = require('fs');
const path = require('path');
const { generateDocument } = require('./main');
const { REMEDIATION_VARIANTS } = require('./remediations');

const { mappings } = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'template.json'), 'utf8'),
).template;

// Every leaf of the document, where an array counts as a leaf (its items share the mapping).
const leafPaths = (value, prefix = '') => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([key, child]) =>
      leafPaths(child, prefix ? `${prefix}.${key}` : key),
    );
  }

  return [prefix];
};

const isMapped = fieldPath => {
  let node = mappings;

  for (const part of fieldPath.split('.')) {
    node = node?.properties?.[part];
  }

  return Boolean(node);
};

describe('states-sca sample data', () => {
  it('only emits fields mapped by the strict template', () => {
    const unmapped = Array.from({ length: 50 }, () => generateDocument({}))
      .flatMap(document => leafPaths(document))
      .filter(fieldPath => !isMapped(fieldPath));

    expect([...new Set(unmapped)]).toEqual([]);
  });

  it('puts the agent under wazuh.agent and the compliance as an object of arrays', () => {
    const document = generateDocument({});

    expect(document.agent).toBeUndefined();
    expect(document.wazuh.agent.id).toEqual(expect.any(String));
    expect(Array.isArray(document.check.compliance)).toBe(false);
    Object.values(document.check.compliance).forEach(requirements =>
      expect(Array.isArray(requirements)).toBe(true),
    );
  });

  it('generates every remediation variant, searchable by check.id', () => {
    const documents = Array.from({ length: 500 }, () => generateDocument({}));

    Object.entries(REMEDIATION_VARIANTS).forEach(([variant, remediation]) => {
      const variantDocument = documents.find(
        document =>
          document.check.id ===
          (variant.startsWith('REAL_')
            ? `CUST-REAL-${variant.slice(5)}`
            : `CUST-REM-${variant}`),
      );

      expect(variantDocument).toBeDefined();
      // check.remediation is a keyword with ignore_above 4096
      expect(remediation.length).toBeLessThan(4096);
      expect(variantDocument.check.remediation).toBe(remediation);
    });
  });

  it('keeps every remediation indexable and the ALL variant tagged with every case marker', () => {
    Object.values(REMEDIATION_VARIANTS).forEach(remediation =>
      // The field is a keyword with ignore_above: 4096
      expect(remediation.length).toBeLessThan(4096),
    );

    for (let marker = 1; marker <= 21; marker++) {
      expect(REMEDIATION_VARIANTS.ALL).toContain(
        `[M${String(marker).padStart(2, '0')}]`,
      );
    }
  });
});
