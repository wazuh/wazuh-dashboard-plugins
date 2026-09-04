import { validateAgentName, validateManagerCaPath } from './validations';

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
});

describe('validateManagerCaPath', () => {
  test.each(['', '   ', undefined])(
    'should return undefined for the empty value %p',
    value => {
      expect(validateManagerCaPath(value)).toBeUndefined();
    },
  );

  test.each([
    '/var/ossec/etc/manager-ca.pem',
    'C:\\Program Files\\ossec-agent\\manager-ca.pem',
    './certs/manager ca.pem',
  ])('should accept the path %p', value => {
    expect(validateManagerCaPath(value)).toBeUndefined();
  });

  /* The path is interpolated into the command inside single quotes, so a single
  quote in the value would break out of them. */
  test('should return an error message for a path containing a single quote', () => {
    const result = validateManagerCaPath("/etc/ca's.pem");
    expect(result).toBe('The character "\'" is not valid in a file path.');
  });
});
