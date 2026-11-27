import {
  isHttpsUrl,
  resolveCtiVerificationLinks,
} from './cti-verification-links';

/* eslint-disable camelcase -- OAuth device authorization JSON uses snake_case */
describe('isHttpsUrl', () => {
  it.each([
    'https://example.test',
    'https://example.test/path?q=1',
    'HTTPS://example.test/upper',
  ])('accepts %s', value => {
    expect(isHttpsUrl(value)).toBe(true);
  });

  it.each([
    ['http URL', 'http://example.test'],
    ['javascript URL', 'javascript:alert(1)'],
    ['data URL', 'data:text/html,<p>x</p>'],
    ['relative path', '/relative/path'],
    ['empty string', ''],
    ['non-string', 42],
    ['undefined', undefined],
  ])('rejects a %s', (_label, value) => {
    expect(isHttpsUrl(value)).toBe(false);
  });
});

describe('resolveCtiVerificationLinks', () => {
  const base = 'https://console.test/register';
  const complete = 'https://console.test/register?user_code=WZH-1';

  it('keeps an https pair on the same origin', () => {
    expect(
      resolveCtiVerificationLinks({
        verification_uri: base,
        verification_uri_complete: complete,
        user_code: 'WZH-1',
      }),
    ).toEqual({ verification_uri: base, verification_uri_complete: complete });
  });

  it('keeps a same-origin target on a different path', () => {
    const otherPath = 'https://console.test/activate/complete?code=WZH-1';
    expect(
      resolveCtiVerificationLinks({
        verification_uri: base,
        verification_uri_complete: otherPath,
        user_code: 'WZH-1',
      }).verification_uri_complete,
    ).toBe(otherPath);
  });

  it('builds the target from verification_uri when the origins differ', () => {
    expect(
      resolveCtiVerificationLinks({
        verification_uri: base,
        verification_uri_complete: 'https://other.test/register?user_code=X',
        user_code: 'WZH 1',
      }),
    ).toEqual({
      verification_uri: base,
      verification_uri_complete: `${base}?user_code=WZH%201`,
    });
  });

  it('builds the target from verification_uri when the target is not https', () => {
    expect(
      resolveCtiVerificationLinks({
        verification_uri: `${base}?lang=en`,
        verification_uri_complete: 'javascript:alert(1)',
        user_code: 'WZH-1',
      }).verification_uri_complete,
    ).toBe(`${base}?lang=en&user_code=WZH-1`);
  });

  it('builds the target from verification_uri when the target is missing', () => {
    expect(
      resolveCtiVerificationLinks({
        verification_uri: base,
        user_code: 'WZH-1',
      }).verification_uri_complete,
    ).toBe(`${base}?user_code=WZH-1`);
  });

  it('uses an https target as the address shown when verification_uri is missing or not https', () => {
    for (const verification_uri of [undefined, 'http://console.test/x']) {
      expect(
        resolveCtiVerificationLinks({
          verification_uri,
          verification_uri_complete: complete,
        }),
      ).toEqual({
        verification_uri: complete,
        verification_uri_complete: complete,
      });
    }
  });

  it('yields no link when neither value is https', () => {
    expect(
      resolveCtiVerificationLinks({
        verification_uri: 'http://console.test/register',
        verification_uri_complete: 'data:text/html,x',
        user_code: 'WZH-1',
      }),
    ).toEqual({ verification_uri: '', verification_uri_complete: '' });
  });

  it('returns the same pair when applied to its own output', () => {
    const once = resolveCtiVerificationLinks({
      verification_uri: base,
      verification_uri_complete: 'https://other.test/x',
      user_code: 'WZH-1',
    });
    expect(
      resolveCtiVerificationLinks({ ...once, user_code: 'WZH-1' }),
    ).toEqual(once);
  });
});
/* eslint-enable camelcase */
