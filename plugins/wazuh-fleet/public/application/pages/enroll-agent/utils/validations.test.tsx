import {
  validateAgentName,
  validateServerAddress,
  validateEnrollmentKey,
} from './validations';

describe('Validations', () => {
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

  it.each`
    input                                                             | result
    ${'test'}                                                         | ${'Value is not a valid URL.'}
    ${'http'}                                                         | ${'Value is not a valid URL.'}
    ${'http://server:'}                                               | ${'Value is not a valid URL.'}
    ${'https://server:'}                                              | ${'Value is not a valid URL.'}
    ${'http://server:55000'}                                          | ${undefined}
    ${'https://server:55000'}                                         | ${undefined}
    ${'http://server:1000000'}                                        | ${'The port has an invalid value.'}
    ${'https://server:1000000'}                                       | ${'The port has an invalid value.'}
    ${'https://example.fqdn.valid:55000'}                             | ${undefined}
    ${'https://192.168.1.1:55000'}                                    | ${undefined}
    ${'https://2001:0db8:85a3:0000:0000:8a2e:0370:7334:55000'}        | ${undefined}
    ${'https://2001:db8:85a3::8a2e:370:7334:55000'}                   | ${'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6.'}
    ${'https://2001:0db8:85a3:0000:0000:8a2e:0370:7334:KL12:55000'}   | ${'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6.'}
    ${'https://example.:55000'}                                       | ${'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6.'}
    ${'https://example.fqdn.valid:1000000'}                           | ${'The port has an invalid value.'}
    ${'https://192.168.1.1:1000000'}                                  | ${'The port has an invalid value.'}
    ${'https://2001:0db8:85a3:0000:0000:8a2e:0370:7334:1000000'}      | ${'The port has an invalid value.'}
    ${'https://2001:db8:85a3::8a2e:370:7334:1000000'}                 | ${'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6. The port has an invalid value.'}
    ${'https://2001:0db8:85a3:0000:0000:8a2e:0370:7334:KL12:1000000'} | ${'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6. The port has an invalid value.'}
    ${'https://example.:1000000'}                                     | ${'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6. The port has an invalid value.'}
  `('Validate server URL input: $input', ({ input, result }) => {
    expect(validateServerAddress(input)).toBe(result);
  });

  it.each`
    input                                 | result
    ${'test'}                             | ${'It should be a 32 alphanumeric characters.'}
    ${'test?-dsa'}                        | ${'It should be a 32 alphanumeric characters.'}
    ${'00000000000000000000000000000000'} | ${undefined}
    ${'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'} | ${undefined}
    ${'a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0'} | ${undefined}
  `('Validate server URL input: $input', ({ input, result }) => {
    expect(validateEnrollmentKey(input)).toBe(result);
  });
});
