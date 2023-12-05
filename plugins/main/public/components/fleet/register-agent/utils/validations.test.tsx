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

  it('should return undefined for a valid IP', () => {
    const validIP = '192.168.1.1';
    const result = validateServerAddress(validIP);
    expect(result).toBeUndefined();
  });

  it('should return an error message for an invalid FQDN', () => {
    const invalidFQDN = 'example.';
    const result = validateServerAddress(invalidFQDN);
    expect(result).toBe(
      'Each label must have a letter or number at the beginning. The maximum length is 63 characters.',
    );
  });

  test('should return an error message for an invalid IP', () => {
    const invalidIP = '999.999.999.999.999';
    const result = validateServerAddress(invalidIP);
    expect(result).toBe('Not a valid IP');
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
