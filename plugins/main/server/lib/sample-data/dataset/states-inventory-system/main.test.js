const { generateDocument } = require('./main');

// Enough documents to draw every operating system profile with high probability.
const documents = Array.from({ length: 500 }, () => generateDocument({}));

describe('states-inventory-system sample data', () => {
  it('generates the kernel as a keyword and drops the removed fields', () => {
    documents.forEach(({ host: { os } }) => {
      expect(os.kernel).toEqual(expect.any(String));
      expect(os.kernel).not.toBe('');
      expect(os).not.toHaveProperty('distribution');
    });
  });

  it.each`
    type         | expected
    ${'linux'}   | ${os => `${os.name} ${os.version}`}
    ${'macos'}   | ${os => `${os.name} ${os.version} (${os.build})`}
    ${'windows'} | ${os => `${os.name} ${os.display_version}`}
  `('fills the full name of $type documents', ({ type, expected }) => {
    const systems = documents
      .map(({ host }) => host.os)
      .filter(os => os.type === type);

    expect(systems.length).toBeGreaterThan(0);
    systems.forEach(os => {
      expect(os.full).toBe(expected(os));
    });
  });

  it('fills display_version only for Windows documents', () => {
    const windows = documents.filter(
      ({ host }) => host.os.platform === 'windows',
    );
    const others = documents.filter(
      ({ host }) => host.os.platform !== 'windows',
    );

    expect(windows.length).toBeGreaterThan(0);
    expect(others.length).toBeGreaterThan(0);
    windows.forEach(({ host }) => {
      expect(host.os.display_version).toEqual(expect.any(String));
    });
    others.forEach(({ host }) => {
      expect(host.os).not.toHaveProperty('display_version');
    });
  });

  it('nests the agent under wazuh, as the strict index template requires', () => {
    documents.forEach(document => {
      expect(document).not.toHaveProperty('agent');
      expect(document.wazuh.agent).toEqual(
        expect.objectContaining({ id: expect.any(String) }),
      );
    });
  });

  it('generates documents for Linux, macOS and Windows', () => {
    const types = new Set(documents.map(({ host }) => host.os.type));

    expect(types).toEqual(new Set(['linux', 'macos', 'windows']));
  });
});
