import {
  compareEnrollmentTokenEndpoint,
  decodeEnrollmentToken,
  formatEnrollmentTokenEndpoint,
  parseEnrollmentTokenAddress,
} from './decode-enrollment-token';

const toBase64Url = (binary: string) =>
  btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const bytes = (from: number, count: number) =>
  String.fromCharCode(...Array.from({ length: count }, (_, i) => from + i));

/* The key is the 16 id bytes followed by the 16 secret bytes. */
const KEY = toBase64Url(bytes(0, 32));
const ID = 'AAECAwQFBgcICQoLDA0ODw';
const PIN = toBase64Url(bytes(100, 32));

const encodeToken = (payload: Record<string, unknown>) =>
  toBase64Url(JSON.stringify(payload));

describe('decodeEnrollmentToken', () => {
  it('reads the address and the id the listing names the token by', () => {
    const token = encodeToken({
      ver: 1,
      adr: 'manager.example.com',
      pin: PIN,
      key: KEY,
    });

    expect(decodeEnrollmentToken(token)).toEqual({
      address: 'manager.example.com',
      endpoint: {
        host: 'manager.example.com',
        port: 1517,
        prefix: 'wazuh-manager',
      },
      id: ID,
    });
  });

  it('reads a token pasted with surrounding whitespace', () => {
    const token = encodeToken({ ver: 1, adr: 'm', pin: PIN, key: KEY });

    expect(decodeEnrollmentToken(`  ${token}\n`)?.id).toBe(ID);
  });

  it('keeps no secret in what it returns', () => {
    const token = encodeToken({ ver: 1, adr: 'm', pin: PIN, key: KEY });

    expect(JSON.stringify(decodeEnrollmentToken(token))).not.toContain(KEY);
  });

  it('reads a token with an embedded CA', () => {
    const token = encodeToken({
      ver: 1,
      adr: '10.0.0.1:55000/agents',
      ca: '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----\n',
      key: KEY,
    });

    expect(decodeEnrollmentToken(token)).toMatchObject({
      endpoint: { host: '10.0.0.1', port: 55000, prefix: 'agents' },
      id: ID,
    });
  });

  it('has no id for a token minted without a credential', () => {
    const token = encodeToken({ ver: 1, adr: 'm', pin: PIN });

    const decoded = decodeEnrollmentToken(token);

    expect(decoded?.address).toBe('m');
    expect(decoded?.id).toBeUndefined();
  });

  it.each([
    ['text that is not base64url', 'not a token!'],
    ['base64url that is not JSON', toBase64Url('hello')],
    ['a JSON value that is not an object', toBase64Url('[1]')],
    ['another version', encodeToken({ ver: 2, adr: 'm', key: KEY })],
    ['no address', encodeToken({ ver: 1, key: KEY })],
    ['an address of the wrong shape', encodeToken({ ver: 1, adr: 'a:b:c' })],
    ['a key that is not text', encodeToken({ ver: 1, adr: 'm', key: 1 })],
    [
      'a key of the wrong length',
      encodeToken({ ver: 1, adr: 'm', key: toBase64Url(bytes(0, 16)) }),
    ],
    ['an impossible base64url length', 'abcde'],
  ])('refuses %s', (_, token) => {
    expect(decodeEnrollmentToken(token)).toBeUndefined();
  });
});

describe('parseEnrollmentTokenAddress', () => {
  it.each([
    ['manager', { host: 'manager', port: 1517, prefix: 'wazuh-manager' }],
    ['Manager:1515', { host: 'manager', port: 1515, prefix: 'wazuh-manager' }],
    ['manager/', { host: 'manager', port: 1517, prefix: '' }],
    ['manager:1515/a/b/', { host: 'manager', port: 1515, prefix: 'a/b' }],
    [
      '[fe80::1%25eth0]:1515',
      { host: 'fe80::1%25eth0', port: 1515, prefix: 'wazuh-manager' },
    ],
  ])('reads %s', (address, endpoint) => {
    expect(parseEnrollmentTokenAddress(address)).toEqual(endpoint);
  });

  it.each(['', ':1515', 'manager:', 'manager:port', '[::1'])(
    'refuses %p',
    address => {
      expect(parseEnrollmentTokenAddress(address)).toBeUndefined();
    },
  );
});

describe('compareEnrollmentTokenEndpoint', () => {
  const endpoint = {
    host: 'manager.example.com',
    port: 1517,
    prefix: 'wazuh-manager',
  };

  it('finds nothing when the entered endpoint is the one in the token', () => {
    expect(
      compareEnrollmentTokenEndpoint(endpoint, {
        address: 'MANAGER.example.com',
        port: '1517',
        prefix: '/wazuh-manager/',
      }),
    ).toEqual([]);
  });

  it('does not compare a port or a prefix that was left empty', () => {
    expect(
      compareEnrollmentTokenEndpoint(
        { ...endpoint, port: 2000, prefix: 'other' },
        { address: 'manager.example.com', port: '', prefix: '' },
      ),
    ).toEqual([]);
  });

  it('reports every part that differs', () => {
    expect(
      compareEnrollmentTokenEndpoint(endpoint, {
        address: '10.0.0.1',
        port: '1515',
        prefix: 'agents',
      }),
    ).toEqual(['address', 'port', 'prefix']);
  });

  it('compares an IPv6 address with or without brackets', () => {
    expect(
      compareEnrollmentTokenEndpoint(
        { host: 'fd00::1', port: 1517, prefix: 'wazuh-manager' },
        { address: '[FD00::1]' },
      ),
    ).toEqual([]);
  });
});

describe('formatEnrollmentTokenEndpoint', () => {
  it('spells out the defaults', () => {
    expect(
      formatEnrollmentTokenEndpoint({
        host: 'manager',
        port: 1517,
        prefix: 'wazuh-manager',
      }),
    ).toBe('manager:1517/wazuh-manager');
  });

  it('brackets an IPv6 address and omits an empty prefix', () => {
    expect(
      formatEnrollmentTokenEndpoint({
        host: 'fd00::1',
        port: 1515,
        prefix: '',
      }),
    ).toBe('[fd00::1]:1515');
  });
});
