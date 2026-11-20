import { matchesCertificateName } from './address-outside-certificate-warning';

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
