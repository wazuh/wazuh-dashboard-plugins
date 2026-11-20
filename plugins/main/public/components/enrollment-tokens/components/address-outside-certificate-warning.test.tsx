import {
  getCoveringWildcardName,
  matchesCertificateName,
} from './address-outside-certificate-warning';

describe('matchesCertificateName', () => {
  it('matches an exact name ignoring case', () => {
    expect(matchesCertificateName('Wazuh.Example', 'wazuh.example')).toBe(true);
    expect(matchesCertificateName('wazuh.example', 'other.example')).toBe(
      false,
    );
  });

  it('matches one leading label against a wildcard', () => {
    expect(matchesCertificateName('*.acme.example', 'wazuh.acme.example')).toBe(
      true,
    );
    expect(matchesCertificateName('*.acme.example', 'WAZUH.acme.example')).toBe(
      true,
    );
  });

  it('does not match more or fewer labels than the wildcard covers', () => {
    expect(matchesCertificateName('*.acme.example', 'a.b.acme.example')).toBe(
      false,
    );
    expect(matchesCertificateName('*.acme.example', 'acme.example')).toBe(
      false,
    );
    expect(matchesCertificateName('*.acme.example', '.acme.example')).toBe(
      false,
    );
  });
});

describe('getCoveringWildcardName', () => {
  const names = ['wazuh.manager.local', '*.acme.example'];

  it('returns the wildcard that covers the address', () => {
    expect(getCoveringWildcardName('wazuh.acme.example', names)).toBe(
      '*.acme.example',
    );
  });

  it('returns nothing for an exact name, an uncovered address or a pattern', () => {
    expect(getCoveringWildcardName('wazuh.manager.local', names)).toBe(
      undefined,
    );
    expect(getCoveringWildcardName('a.b.acme.example', names)).toBe(undefined);
    expect(getCoveringWildcardName('*.acme.example', names)).toBe(undefined);
    expect(getCoveringWildcardName('', names)).toBe(undefined);
  });

  it('returns nothing when an exact name also covers the address', () => {
    expect(
      getCoveringWildcardName('wazuh.acme.example', [
        'wazuh.acme.example',
        '*.acme.example',
      ]),
    ).toBe(undefined);
  });
});
