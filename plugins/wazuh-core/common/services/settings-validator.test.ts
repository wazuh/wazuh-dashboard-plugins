import { SettingsValidator } from './settings-validator';

describe('Validations', () => {
  it('should return undefined for an empty value', () => {
    const result = SettingsValidator.serverAddressHostnameFQDNIPv4IPv6('');
    expect(result).toBeUndefined();
  });

  it('should return undefined for a valid FQDN', () => {
    const validFQDN = 'example.fqdn.valid';
    const result =
      SettingsValidator.serverAddressHostnameFQDNIPv4IPv6(validFQDN);
    expect(result).toBeUndefined();
  });

  it('should return undefined for a valid IPv4', () => {
    const validIP = '192.168.1.1';
    const result = SettingsValidator.serverAddressHostnameFQDNIPv4IPv6(validIP);
    expect(result).toBeUndefined();
  });

  it('should return undefined for a valid IPv6', () => {
    const validIP = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    const result = SettingsValidator.serverAddressHostnameFQDNIPv4IPv6(validIP);
    expect(result).toBeUndefined();
  });

  it('should return an error message for an invalid IPv6', () => {
    const invalidIPV6 = '2001:db8:85a3::8a2e:370:7334';
    const result =
      SettingsValidator.serverAddressHostnameFQDNIPv4IPv6(invalidIPV6);
    expect(result).toBe(
      'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6',
    );
  });

  it('should return an error message for a compressed IPv6', () => {
    const compressedIPV6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334:KL12';
    const result =
      SettingsValidator.serverAddressHostnameFQDNIPv4IPv6(compressedIPV6);
    expect(result).toBe(
      'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6',
    );
  });

  it('should return an error message for an invalid FQDN', () => {
    const invalidFQDN = 'example.';
    const result =
      SettingsValidator.serverAddressHostnameFQDNIPv4IPv6(invalidFQDN);
    expect(result).toBe(
      'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6',
    );
  });
});

describe('SettingsValidator.serverEndpointPort', () => {
  it.each([
    ['an empty value, which means the agent default', ''],
    ['the lowest port', '1'],
    ['the default port', '1517'],
    ['the highest port', '65535'],
  ])('accepts %s', (_title, value) => {
    expect(SettingsValidator.serverEndpointPort(value)).toBeUndefined();
  });

  it.each([
    ['a non-numeric value', 'https', 'It should be a number.'],
    ['a decimal', '1517.5', 'It should be a number.'],
    ['a signed value', '-1', 'It should be a number.'],
    ['zero', '0', 'It should be a port number between 1 and 65535.'],
    [
      'a port above the range',
      '65536',
      'It should be a port number between 1 and 65535.',
    ],
  ])('rejects %s', (_title, value, message) => {
    expect(SettingsValidator.serverEndpointPort(value)).toBe(message);
  });
});

describe('SettingsValidator.serverEndpointPathPrefix', () => {
  it.each([
    ['an empty value, which means the agent default', ''],
    ['the unprefixed opt-out', '/'],
    ['the default prefix', '/wazuh-manager/'],
    ['a prefix without a leading slash', 'wazuh-manager'],
    ['a nested prefix', '/gateway/wazuh_manager.v5/'],
    ['a prefix at the maximum length', `/${'a'.repeat(127)}`],
  ])('accepts %s', (_title, value) => {
    expect(SettingsValidator.serverEndpointPathPrefix(value)).toBeUndefined();
  });

  it.each([
    [
      'a prefix over the maximum length',
      `/${'a'.repeat(128)}`,
      'It should be shorter than 129 characters.',
    ],
    [
      'a character outside the shared charset',
      '/wazuh~manager/',
      'It should only contain letters, numbers, and the characters . _ - /',
    ],
    [
      'a relative segment',
      '/wazuh-manager/../admin/',
      'It should not contain the segments . or ..',
    ],
    [
      'a current-directory segment',
      '/./wazuh-manager/',
      'It should not contain the segments . or ..',
    ],
    [
      'an empty segment',
      '/wazuh-manager//stateless/',
      'It should not contain empty segments.',
    ],
  ])('rejects %s', (_title, value, message) => {
    expect(SettingsValidator.serverEndpointPathPrefix(value)).toBe(message);
  });
});
