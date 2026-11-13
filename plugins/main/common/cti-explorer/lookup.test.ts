import { classifyLookupValue, getUrlHost, refang } from './lookup';
import { CTI_LOOKUP_MAX_LENGTH } from './constants';

describe('refang', () => {
  it.each([
    ['hxxps://evil[.]example/path', 'https://evil.example/path'],
    ['evil(.)example', 'evil.example'],
    ['192.0.2[.]100[:]443', '192.0.2.100:443'],
    ['  example.com  ', 'example.com'],
  ])('turns %s into %s', (input, expected) => {
    expect(refang(input)).toBe(expected);
  });
});

describe('getUrlHost', () => {
  it('reads the host without credentials, port or case', () => {
    expect(getUrlHost('https://user:pw@CDN.Example.com:8443/a?b')).toBe(
      'cdn.example.com',
    );
  });

  it('reads a bracketed IPv6 host', () => {
    expect(getUrlHost('http://[2001:db8::1]:80/')).toBe('2001:db8::1');
  });

  it('returns null for a value without a scheme', () => {
    expect(getUrlHost('example.com/path')).toBeNull();
  });
});

describe('classifyLookupValue', () => {
  it('reports an empty value', () => {
    expect(classifyLookupValue('   ')).toEqual({ kind: 'empty' });
  });

  it('reports a value longer than the indexed keyword limit', () => {
    expect(classifyLookupValue('a'.repeat(CTI_LOOKUP_MAX_LENGTH + 1))).toEqual({
      kind: 'too_long',
    });
  });

  it.each([
    ['cve-2024-6387', 'CVE-2024-6387'],
    ['CVE-2026-112211', 'CVE-2026-112211'],
    ['tid-0048', 'TID-0048'],
  ])('reads %s as the vulnerability record %s', (input, id) => {
    expect(classifyLookupValue(input)).toEqual({ kind: 'vulnerability', id });
  });

  it.each([
    ['44d88612fea8a8f36de82e1278abb02f', 'hash_md5'],
    ['3395856ce81f2b7382dee72602f798b642f14140', 'hash_sha1'],
    [
      '275A021BBFB6489E54D471899F7DB9D1663FC695EC2FE2A2C4538AABF651FD0F',
      'hash_sha256',
    ],
  ])('reads %s as %s', (input, category) => {
    expect(classifyLookupValue(input)).toEqual({
      kind: 'ioc',
      category,
      values: [input],
    });
  });

  it('matches an IP address and its host:port records', () => {
    expect(classifyLookupValue('192.0.2.100')).toEqual({
      kind: 'ioc',
      category: 'ip',
      values: ['192.0.2.100'],
      hostPortPrefix: '192.0.2.100:',
    });
  });

  it('reads an IPv6 address', () => {
    expect(classifyLookupValue('2001:db8::1')).toMatchObject({
      category: 'ip',
    });
  });

  it('matches a URL and the domain of its host', () => {
    expect(classifyLookupValue('hxxps://Evil[.]Example/Login')).toEqual({
      kind: 'ioc',
      category: 'url',
      values: ['https://Evil.Example/Login', 'evil.example'],
    });
  });

  it.each(['192.0.2.100:31337', 'evil.example:8080', '[2001:db8::1]:443'])(
    'reads %s as a host:port pair',
    input => {
      expect(classifyLookupValue(input)).toEqual({
        kind: 'ioc',
        category: 'host_port',
        values: [input],
      });
    },
  );

  it('does not take a hex host:port pair for an IPv6 address', () => {
    expect(classifyLookupValue('dead:80')).toMatchObject({
      category: 'other',
    });
  });

  it('reads a domain', () => {
    expect(classifyLookupValue('primadomfrance.com')).toEqual({
      kind: 'ioc',
      category: 'domain',
      values: ['primadomfrance.com'],
    });
  });

  it('still looks up a value of no known shape, as it is', () => {
    expect(classifyLookupValue('not a value')).toEqual({
      kind: 'ioc',
      category: 'other',
      values: ['not a value'],
    });
  });
});
