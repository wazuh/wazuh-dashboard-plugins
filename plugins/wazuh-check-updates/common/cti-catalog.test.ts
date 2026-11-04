import {
  isWebUrl,
  normalizeVulnerabilityId,
  planIndicatorLookup,
} from './cti-catalog';

describe('normalizeVulnerabilityId', () => {
  test.each([
    ['CVE-2021-44228', 'CVE-2021-44228'],
    [' cve-2024-1234 ', 'CVE-2024-1234'],
    ['CVE-2026-1234567', 'CVE-2026-1234567'],
    ['tid-0220', 'TID-0220'],
  ])('accepts the full id %p', (value, expected) => {
    expect(normalizeVulnerabilityId(value)).toBe(expected);
  });

  test.each([
    'log4j',
    'critical',
    'CVE-2021',
    'CVE-2021-123',
    'CVE-2021-12345678',
    'CVE-2021-44228 OR 1=1',
    'TID-',
    '',
  ])('rejects %p, which is not a full id', value => {
    expect(normalizeVulnerabilityId(value)).toBeNull();
  });
});

describe('planIndicatorLookup', () => {
  test('anchors a bare IPv4 address to its host:port records', () => {
    expect(planIndicatorLookup('124.70.213.4')).toEqual({
      exact: ['124.70.213.4'],
      connectionPrefix: '124.70.213.4:',
    });
  });

  test('anchors a bare IPv6 address to its host:port records', () => {
    expect(planIndicatorLookup('2001:db8::1').connectionPrefix).toBe(
      '2001:db8::1:',
    );
  });

  test('matches a domain exactly and adds no prefix', () => {
    expect(planIndicatorLookup('google.com')).toEqual({
      exact: ['google.com'],
    });
  });

  test('matches a hash exactly and adds no prefix', () => {
    const hash = 'E9A5FD60'.padEnd(64, 'A');
    expect(planIndicatorLookup(hash)).toEqual({ exact: [hash] });
  });

  test('matches a URL, the URL without one trailing slash and its hostname', () => {
    expect(planIndicatorLookup('https://evil.example/path/')).toEqual({
      exact: [
        'https://evil.example/path/',
        'https://evil.example/path',
        'evil.example',
      ],
    });
  });

  test('trims the value', () => {
    expect(planIndicatorLookup('  evil.example  ').exact).toEqual([
      'evil.example',
    ]);
  });
});

describe('isWebUrl', () => {
  test.each([
    ['https://nvd.nist.gov/vuln/detail/CVE-2021-44228', true],
    ['http://example.com', true],
    ['javascript:alert(1)', false],
    ['data:text/html,<script>alert(1)</script>', false],
    ['not a url', false],
  ])('%p is a web URL: %p', (value, expected) => {
    expect(isWebUrl(value)).toBe(expected);
  });
});
