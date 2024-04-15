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
