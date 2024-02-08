import { validateServerAddress, validateAgentName } from './validations';

describe('Validations', () => {
  it('should return undefined for an empty value', () => {
    const result = validateServerAddress('');
    expect(result).toBeUndefined();
  });

  it('should return undefined for a valid FQDN', () => {
    const validFQDN = 'example.fqdn.valid';
    const result = validateServerAddress(validFQDN);
    expect(result).toBeUndefined();
  });

  it('should return undefined for a valid IPv4', () => {
    const validIP = '192.168.1.1';
    const result = validateServerAddress(validIP);
    expect(result).toBeUndefined();
  });

  it('should return undefined for a valid IPv6', () => {
    const validIP = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    const result = validateServerAddress(validIP);
    expect(result).toBeUndefined();
  });

  it('should return an error message for an invalid IPv6', () => {
    const invalidIPV6 = '2001:db8:85a3::8a2e:370:7334';
    const result = validateServerAddress(invalidIPV6);
    expect(result).toBe(
      'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6',
    );
  });

  it('should return an error message for a compressed IPv6', () => {
    const compressedIPV6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334:KL12';
    const result = validateServerAddress(compressedIPV6);
    expect(result).toBe(
      'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6',
    );
  });

  it('should return an error message for an invalid FQDN', () => {
    const invalidFQDN = 'example.';
    const result = validateServerAddress(invalidFQDN);
    expect(result).toBe(
      'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6',
    );
  });

  test('should return undefined for an empty value', () => {
    const emptyValue = '';
    const result = validateAgentName(emptyValue);
    expect(result).toBeUndefined();
  });

  test('should return an error message for invalid format and length', () => {
    const invalidAgentName = '?';
    const result = validateAgentName(invalidAgentName);
    expect(result).toBe(
      'The minimum length is 2 characters. The character "?" is not valid. Allowed characters are A-Z, a-z, 0-9, ".", "-", "_"',
    );
  });

  test('should return an error message for invalid format of 1 character', () => {
    const invalidAgentName = 'agent$name';
    const result = validateAgentName(invalidAgentName);
    expect(result).toBe(
      'The character "$" is not valid. Allowed characters are A-Z, a-z, 0-9, ".", "-", "_"',
    );
  });

  test('should return an error message for invalid format of more than 1 character', () => {
    const invalidAgentName = 'agent$?name';
    const result = validateAgentName(invalidAgentName);
    expect(result).toBe(
      'The characters "$,?" are not valid. Allowed characters are A-Z, a-z, 0-9, ".", "-", "_"',
    );
  });

  test('should return an error message for invalid length', () => {
    const invalidAgentName = 'a';
    const result = validateAgentName(invalidAgentName);
    expect(result).toBe('The minimum length is 2 characters.');
  });

  test('should return an empty string for a valid agent name', () => {
    const validAgentName = 'agent_name';
    const result = validateAgentName(validAgentName);
    expect(result).toBe('');
  });
});
